# ✅ Parking MQTT - Исправлено подключение к внешнему серверу

## Что было исправлено

✅ Parking MQTT теперь использует **те же переменные окружения** что и основной MQTT:
- `MQTT_BROKER` вместо `MQTT_HOST` 
- `MQTT_PORT`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`

## 🚀 Перезапустите backend

```bash
cd /var/www/utmn-security/debug/backend
npm start
```

**Ожидаемый вывод:**
```
✅ Подключено к MySQL
🚀 Сервер запущен на порту 3000
[MQTT WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
[Parking WS] ✅ WebSocket сервер для парковок инициализирован
🔌 Подключение к MQTT брокеру...
[MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[MQTT] ✅ Успешно подключено к брокеру
🔌 Подключение к Parking MQTT брокеру...
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

## 📡 Опубликуйте парковки на MQTT сервере

Теперь нужно опубликовать данные на **внешнем** MQTT сервере:

```bash
cd /var/www/utmn-security/debug

# Обновите скрипт для внешнего сервера
nano parking-publish.sh
```

Измените:
```bash
# Было:
MQTT_HOST="localhost"
MQTT_PORT="1883"

# Стало:
MQTT_HOST="10.101.221.232"
MQTT_PORT="1883"
```

Затем опубликуйте:
```bash
chmod +x parking-publish.sh
./parking-publish.sh
```

## ⚙️ Переменные окружения

Parking MQTT использует те же настройки из `/backend/.env`:

```bash
# MQTT брокер
MQTT_BROKER=10.101.221.232
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Опционально: отключить Parking MQTT
# PARKING_MQTT_ENABLED=false
```

## 🔍 Проверка подключения

### На MQTT сервере (10.101.221.232)

```bash
# Посмотреть активных клиентов
mosquitto_sub -v -t '$SYS/broker/clients/connected'

# Должны увидеть клиента: utmn_parking_XXXXXXXX
```

### Опубликовать тестовые данные

```bash
# На сервере 10.101.221.232
mosquitto_pub -t "Skud/parking/config" -f parking-config.json
mosquitto_pub -t "Skud/parking/k1/vehicles" -f parking-k1-vehicles.json
mosquitto_pub -t "Skud/parking/k5/vehicles" -f parking-k5-vehicles.json
mosquitto_pub -t "Skud/parking/central/vehicles" -f parking-central-vehicles.json
```

## 🌐 Проверка frontend

Откройте **"Парковочная система"** и увидите:
- ✅ "Система парковок подключена" 🟢
- 3 парковки с данными
- 24 автомобиля

## 🐛 Troubleshooting

### Backend подключается к localhost
- ❌ Проверьте `/backend/.env` - должен быть `MQTT_BROKER=10.101.221.232`
- ❌ Перезапустите backend

### Нет данных на странице
- ❌ Опубликуйте конфигурацию: `mosquitto_pub -h 10.101.221.232 -t "Skud/parking/config" -f parking-config.json`
- ❌ Проверьте WebSocket в консоли браузера (F12)

### MQTT брокер недоступен
- ❌ Проверьте firewall: `telnet 10.101.221.232 1883`
- ❌ Проверьте mosquitto на сервере: `systemctl status mosquitto`

---

**Теперь Parking MQTT подключается к внешнему серверу!** 🎉
