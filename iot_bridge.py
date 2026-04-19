import json
import asyncio
import logging
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from awscrt import mqtt
from awsiot import mqtt_connection_builder

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Bridge")

# --- CONFIGURATION ---
ENDPOINT = "az77g98t7thdc-ats.iot.us-east-1.amazonaws.com"
CLIENT_ID = "Dashboard_Bridge_Server"
TOPIC = "server/metrics"

PATH_TO_CERT = "7c68680e8d1e8151fea98a08fdaf79908bf62981cb222a2e11b48a968d44897e-certificate.pem.crt"
PATH_TO_KEY = "7c68680e8d1e8151fea98a08fdaf79908bf62981cb222a2e11b48a968d44897e-private.pem.key"
PATH_TO_ROOT_CA = "AmazonRootCA1.pem"

active_connections: List[WebSocket] = []
history_buffer = []
MAX_HISTORY = 50
loop = None

async def broadcast(message: dict):
    history_buffer.append(message)
    if len(history_buffer) > MAX_HISTORY:
        history_buffer.pop(0)
    for connection in active_connections:
        try:
            await connection.send_json({"type": "update", "data": message})
        except Exception:
            pass

def on_message_received(topic, payload, dup, qos, retain, **kwargs):
    logger.info(f"Received MQTT: {payload.decode('utf-8')}")
    try:
        data = json.loads(payload.decode('utf-8'))
        if loop:
            asyncio.run_coroutine_threadsafe(broadcast(data), loop)
    except Exception as e:
        logger.error(f"Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global loop, mqtt_connection
    loop = asyncio.get_running_loop()
    
    logger.info("Connecting to AWS IoT Core...")
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=ENDPOINT,
        cert_filepath=PATH_TO_CERT,
        pri_key_filepath=PATH_TO_KEY,
        ca_filepath=PATH_TO_ROOT_CA,
        client_id=CLIENT_ID,
        clean_session=True,
        keep_alive_secs=30
    )
    
    connect_future = mqtt_connection.connect()
    connect_future.result()
    logger.info("Connected to AWS IoT!")

    subscribe_future, _ = mqtt_connection.subscribe(
        topic=TOPIC,
        qos=mqtt.QoS.AT_LEAST_ONCE,
        callback=on_message_received
    )
    subscribe_future.result()
    logger.info(f"Subscribed to {TOPIC}")
    
    yield
    
    logger.info("Disconnecting...")
    mqtt_connection.disconnect().result()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    if history_buffer:
        await websocket.send_json({"type": "history", "data": history_buffer})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
