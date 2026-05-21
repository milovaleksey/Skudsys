# 🅿️ Настройка парковки - Простой гайд

## 📝 В .env backend добавьте:

```bash
# MQTT для парковки (используется тот же брокер что и для основного MQTT)
PARKING_MQTT_BROKER=10.101.221.198
PARKING_MQTT_PORT=1883
PARKING_MQTT_USERNAME=
PARKING_MQTT_PASSWORD=
PARKING_MQTT_CONFIG_TOPIC=Skud/parking/config
PARKING_MQTT_VEHICLES_TOPIC_PREFIX=Skud/parking/
PARKING_MQTT_ENABLED=true
```

---

## 🚀 Перезапустите backend:

```bash
cd /var/www/utmn-security/debug/backend
# Ctrl+C (остановить)
npm start  # Запустить снова
```

---

## ✅ Проверьте логи:

**Должно быть:**
```
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.198:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

---

## 🧪 Проверьте API:

```bash
curl http://localhost:3000/v1/parking/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидается 200 OK**, не 404!

---

## 📖 Детальная документация:

- `/PARKING_ENV_CONFIG.md` - полная конфигурация
- `/PARKING_404_FIXED.md` - что было исправлено

---

🎉 **Готово!**
