# 🚀 MQTT Шпаргалка - Быстрый старт

## ⚡ За 2 минуты

### 1. Backend (.env)
```bash
MQTT_ENABLED=true
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### 2. Mosquitto
```bash
sudo apt install mosquitto
sudo systemctl start mosquitto
```

### 3. Публикация конфигурации
```bash
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[{"id":"test","label":"Тест","valueTopic":"test/value"}]'
mosquitto_pub -h localhost -t "test/value" -m "42"
```

## 📋 Быстрые команды

### Тест
```bash
./mqtt-test.sh localhost
```

### Мониторинг
```bash
mosquitto_sub -t 'Skud/#' -v
```

### Проверка backend
```bash
curl http://localhost:3000/api/mqtt/status -H "Authorization: Bearer TOKEN"
```

## 🎨 Формат конфигурации

```json
[
  {
    "id": "students",
    "label": "Студентов",
    "icon": "users",
    "valueTopic": "Skud/stats/students",
    "color": "#00aeef",
    "unit": "чел."
  }
]
```

## 🔥 Горячие топики

| Топик | Назначение |
|-------|------------|
| `Skud/main/stat` | Конфигурация карточек |
| `Skud/stats/*` | Значения карточек |

## 📊 Примеры значений

```bash
# Простое число
mosquitto_pub -t "topic" -m "1547"

# Форматированное
mosquitto_pub -t "topic" -m "45 / 100"

# Текст
mosquitto_pub -t "topic" -m "В норме"
```

## ✅ Чеклист запуска

- [ ] Mosquitto запущен: `systemctl status mosquitto`
- [ ] Backend видит MQTT: смотри `[MQTT] ✅` в логах
- [ ] Конфигурация опубликована: `mosquitto_sub -t Skud/main/stat`
- [ ] Frontend показывает "MQTT подключен"
- [ ] Карточки обновляются в real-time

## 🐛 Проблемы?

```bash
# Логи backend
cd backend && npm run dev

# Логи mosquitto
journalctl -u mosquitto -f

# Консоль браузера
F12 → Console → ищи "[WebSocket]"
```

## 📚 Полная документация

- **README_MQTT.md** - Архитектура, API, примеры
- **MQTT_SETUP.md** - Пошаговая настройка
- **MQTT_CONFIG.md** - Формат конфигурации
- **MQTT_SUMMARY.md** - Итоговая документация
