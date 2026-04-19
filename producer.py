import time
import json
import random
from awscrt import mqtt
from awsiot import mqtt_connection_builder

# --- SİSTEM MİMARİSİ KONFİGÜRASYONU ---
ENDPOINT = "az77g98t7thdc-ats.iot.us-east-1.amazonaws.com"
CLIENT_ID = "Simulated_Server_01"
TOPIC = "server/metrics"

# Sertifika yollarının doğruluğundan emin ol (Klasör yapına göre düzelt)
PATH_TO_CERT = "7c68680e8d1e8151fea98a08fdaf79908bf62981cb222a2e11b48a968d44897e-certificate.pem.crt"
PATH_TO_KEY = "7c68680e8d1e8151fea98a08fdaf79908bf62981cb222a2e11b48a968d44897e-private.pem.key"
PATH_TO_ROOT_CA = "AmazonRootCA1.pem"

def on_connection_interrupted(connection, error, **kwargs):
    print(f"Bağlantı koptu. Hata: {error}")

def on_connection_resumed(connection, return_code, session_present, **kwargs):
    print(f"Bağlantı yeniden sağlandı. Return Code: {return_code}")

print(f"AWS IoT Core Endpoint'ine bağlanılıyor: {ENDPOINT}...")

# MTLS Bağlantı İnşası (awsiotsdk v2 standardı)
mqtt_connection = mqtt_connection_builder.mtls_from_path(
    endpoint=ENDPOINT,
    cert_filepath=PATH_TO_CERT,
    pri_key_filepath=PATH_TO_KEY,
    ca_filepath=PATH_TO_ROOT_CA,
    client_id=CLIENT_ID,
    clean_session=False,
    keep_alive_secs=30,
    on_connection_interrupted=on_connection_interrupted,
    on_connection_resumed=on_connection_resumed
)

# Bağlantıyı Ateşle
connect_future = mqtt_connection.connect()
connect_future.result()
print("Sistem Çevrimiçi! Bağlantı başarılı.")

try:
    while True:
        # Sensör verisi simülasyonu
        payload = {
            "device_id": CLIENT_ID,
            "timestamp": int(time.time()),
            "cpu_usage": round(random.uniform(10.0, 95.0), 2),
            "ram_usage": round(random.uniform(4.0, 32.0), 2)
        }
        message_json = json.dumps(payload)
        
        # Veriyi Buluta Fırlat
        mqtt_connection.publish(
            topic=TOPIC,
            payload=message_json,
            qos=mqtt.QoS.AT_LEAST_ONCE
        )
        print(f"Veri İletildi -> {message_json}")
        time.sleep(2) # İşlemciyi yormamak için 2 saniye darboğaz (throttle)
        
except KeyboardInterrupt:
    print("\nSimülasyon durduruluyor...")
    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()
    print("Sistem Çevrimdışı.")