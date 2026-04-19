import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, Cpu, Database, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import './App.css';

const WS_URL = 'ws://localhost:8000/ws';

function App() {
  const [data, setData] = useState([]);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let ws;
    const connect = () => {
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        setConnected(true);
        console.log('Connected to Bridge');
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'history') {
          setData(msg.data);
        } else if (msg.type === 'update') {
          setData(prev => {
            const newData = [...prev, msg.data];
            return newData.slice(-50); // Keep last 50 points
          });
          
          // Analysis: Threshold Check
          if (msg.data.cpu_usage > 90) {
            addAlert(`High CPU Usage: ${msg.data.cpu_usage}%`);
          }
        }
      };
      
      ws.onclose = () => {
        setConnected(false);
        console.log('Disconnected. Retrying in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connect();
    return () => ws?.close();
  }, []);

  const addAlert = (message) => {
    const id = Date.now();
    setAlerts(prev => [{ id, message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
  };

  const latest = data[data.length - 1] || { cpu_usage: 0, ram_usage: 0 };

  // Data Analysis
  const stats = useMemo(() => {
    if (data.length === 0) return { cpu: { avg: 0, max: 0, min: 0 }, ram: { avg: 0, max: 0, min: 0 } };
    
    const cpuVals = data.map(d => d.cpu_usage);
    const ramVals = data.map(d => d.ram_usage);
    
    return {
      cpu: {
        avg: (cpuVals.reduce((a, b) => a + b, 0) / data.length).toFixed(1),
        max: Math.max(...cpuVals).toFixed(1),
        min: Math.min(...cpuVals).toFixed(1)
      },
      ram: {
        avg: (ramVals.reduce((a, b) => a + b, 0) / data.length).toFixed(1),
        max: Math.max(...ramVals).toFixed(1),
        min: Math.min(...ramVals).toFixed(1)
      }
    };
  }, [data]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="title-group">
          <h1>IoT Cloud Monitoring</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0' }}>Real-time Server Telemetry & Analysis</p>
        </div>
        <div className="status-badge">
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          {connected ? 'Cloud Gateway Active' : 'Connecting to Gateway...'}
        </div>
      </header>

      <main>
        <div className="metrics-grid">
          {/* CPU Card */}
          <div className="card">
            <div className="metric-header">
              <div>
                <span className="metric-label">CPU LOAD</span>
                <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                  {latest.cpu_usage}<span className="metric-unit">%</span>
                </div>
              </div>
              <Cpu color="var(--accent-cyan)" size={24} />
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">AVG</span>
                <span className="stat-value">{stats.cpu.avg}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">MAX</span>
                <span className="stat-value">{stats.cpu.max}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">MIN</span>
                <span className="stat-value">{stats.cpu.min}%</span>
              </div>
            </div>
          </div>

          {/* RAM Card */}
          <div className="card">
            <div className="metric-header">
              <div>
                <span className="metric-label">RAM USAGE</span>
                <div className="metric-value" style={{ color: 'var(--accent-purple)' }}>
                  {latest.ram_usage}<span className="metric-unit">GB</span>
                </div>
              </div>
              <Database color="var(--accent-purple)" size={24} />
            </div>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">AVG</span>
                <span className="stat-value">{stats.ram.avg}GB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">MAX</span>
                <span className="stat-value">{stats.ram.max}GB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">MIN</span>
                <span className="stat-value">{stats.ram.min}GB</span>
              </div>
            </div>
          </div>

          {/* Analysis Alerts */}
          <div className="card alert-panel">
            <div className="metric-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> SYSTEM ANALYTICS
            </div>
            {alerts.length === 0 ? (
              <div style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                <Zap size={14} style={{ marginRight: '4px' }} /> All systems nominal. No anomalies detected.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="alert-item">
                  <AlertCircle size={18} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{alert.message}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{alert.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Graph */}
        <div className="chart-container">
          <div className="chart-header">
            <span className="metric-label">LIVE TELEMETRY HISTORY</span>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  hide={true}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ background: '#1a1f26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu_usage" 
                  name="CPU %"
                  stroke="var(--accent-cyan)" 
                  fillOpacity={1} 
                  fill="url(#colorCpu)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="ram_usage" 
                  name="RAM GB"
                  stroke="var(--accent-purple)" 
                  fillOpacity={1} 
                  fill="url(#colorRam)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
