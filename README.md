# AWS IoT Core Metrics Producer 🚀

Bu proje, simüle edilmiş sunucu metriklerini (CPU ve RAM kullanımı) MQTT protokolü üzerinden **AWS IoT Core**'a gerçek zamanlı olarak gönderen bir Python uygulamasıdır.

## 📋 Özellikler

- **mTLS Kimlik Doğrulaması:** AWS IoT Core ile güvenli bağlantı.
- **Gerçek Zamanlı Veri Akışı:** Her 2 saniyede bir simüle edilmiş metrik gönderimi.
- **Simülasyon:** CPU ve RAM kullanımı verilerini rastgele üreterek buluta aktarır.

## 🛠️ Kurulum

### 1. Gereksinimler

Projenin çalışması için Python 3.7+ ve `awsiotsdk` kütüphanesine ihtiyacınız vardır.

```bash
pip install awsiotsdk
```

### 2. AWS Sertifikaları

Aşağıdaki dosyaları projenin ana dizinine yerleştirmeniz gerekmektedir:

- `7c6868...-certificate.pem.crt` (Cihaz Sertifikası)
- `7c6868...-private.pem.key` (Özel Anahtar)
- `AmazonRootCA1.pem` (AWS Root CA)

> [!CAUTION]
> **Güvenlik Uyarısı:** Sertifika ve özel anahtar (`.key`) dosyalarınız hassas bilgiler içerir. Bunları asla GitHub gibi halka açık platformlarda paylaşmayın. `.gitignore` dosyası bu dosyaları korumak için yapılandırılmıştır.

## 🚀 Çalıştırma

Uygulamayı başlatmak için terminale şu komutu yazın:

```bash
python producer.py
```

## 📊 Gönderilen Veri Formatı

Uygulama, `server/metrics` konusuna şu formatta JSON verisi gönderir:

```json
{
  "device_id": "Simulated_Server_01",
  "timestamp": 1713537600,
  "cpu_usage": 45.2,
  "ram_usage": 12.5
}
```

## ⚙️ Yapılandırma

`producer.py` dosyası içindeki şu değişkenleri kendi AWS ortamınıza göre düzenleyebilirsiniz:

- `ENDPOINT`: AWS IoT Core Endpoint adresiniz.
- `CLIENT_ID`: Cihazınızın benzersiz kimliği.
- `TOPIC`: Verilerin yayınlanacağı MQTT konusu.

## 📄 Lisans

Bu proje eğitim amaçlıdır.
