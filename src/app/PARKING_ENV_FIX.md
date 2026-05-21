# ⚠️ ВАЖНО: Настройка .env для парковок

## Проблема решена ✅

Создан отсутствующий модуль `/backend/src/utils/logger.js`

## Опциональная настройка

Если хотите отключить Parking MQTT (использовать только статические данные), добавьте в `/backend/.env`:

```bash
# Отключить Parking MQTT
PARKING_MQTT_ENABLED=false
```

По умолчанию Parking MQTT **включен** и использует те же настройки что и основной MQTT:

```bash
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

## Перезапуск

```bash
cd /var/www/utmn-security/debug/backend
npm start
```

Теперь должно работать без ошибок! ✅
