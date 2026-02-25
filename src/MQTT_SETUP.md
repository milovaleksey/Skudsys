# 🚀 Быстрая настройка MQTT для динамических карточек

## Шаг 1: Настройка Backend

### 1.1 Установите зависимости

```bash
cd backend
npm install
```

Будут установлены: `mqtt`, `ws` (уже добавлены в package.json)

### 1.2 Настройте переменные окружения

Добавьте в `/backend/.env`:

```env
# MQTT Configuration
MQTT_ENABLED=true
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CONFIG_TOPIC=Skud/main/stat
```

### 1.3 Запустите backend

```bash
npm run dev
```

Вы должны увидеть:
```
✅ Подключено к MySQL
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
[WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
🔌 Подключение к MQTT брокеру...
[MQTT] ✅ Успешно подключено к брокеру
[MQTT] ✅ Подписка на топик конфигурации: Skud/main/stat
```

## Шаг 2: Настройка MQTT брокера (Mosquitto)

### 2.1 Установите Mosquitto (если еще не установлен)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
```

**macOS:**
```bash
brew install mosquitto
```

### 2.2 Настройте Mosquitto

Отредактируйте `/etc/mosquitto/mosquitto.conf`:

```conf
listener 1883
protocol mqtt
allow_anonymous true
```

Перезапустите:
```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

## Шаг 3: Тест MQTT

### 3.1 Опубликуйте конфигурацию карточек

```bash
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "students",
    "label": "Студентов в кампусе",
    "icon": "users",
    "valueTopic": "Skud/stats/students/total",
    "color": "#00aeef",
    "unit": "чел."
  },
  {
    "id": "employees",
    "label": "Сотрудников на работе",
    "icon": "briefcase",
    "valueTopic": "Skud/stats/employees/active",
    "color": "#10b981",
    "unit": "чел."
  },
  {
    "id": "parking",
    "label": "Занято парковочных мест",
    "icon": "car",
    "valueTopic": "Skud/stats/parking/status",
    "color": "#f59e0b"
  }
]'
```

В логах backend вы должны увидеть:
```
[MQTT] 📊 Получена конфигурация: 3 карточек
[MQTT] ✅ Подписка на топик данных: Skud/stats/students/total
[MQTT] ✅ Подписка на топик данных: Skud/stats/employees/active
[MQTT] ✅ Подписка на топик данных: Skud/stats/parking/status
```

### 3.2 Опубликуйте значения

```bash
mosquitto_pub -h localhost -t "Skud/stats/students/total" -m "1547"
mosquitto_pub -h localhost -t "Skud/stats/employees/active" -m "312"
mosquitto_pub -h localhost -t "Skud/stats/parking/status" -m "45 / 100"
```

В логах backend:
```
[MQTT] 📨 Обновление значения [students]: 1547
[MQTT] 📨 Обновление значения [employees]: 312
[MQTT] 📨 Обновление значения [parking]: 45 / 100
```

### 3.3 Или используйте тестовый скрипт

```bash
chmod +x mqtt-test.sh
./mqtt-test.sh localhost
```

## Шаг 4: Проверка во Frontend

### 4.1 Запустите frontend

```bash
npm run dev
```

### 4.2 Откройте дашборд

Перейдите на главную страницу. Вы должны увидеть:
- ✅ Индикатор "MQTT подключен" с зеленой точкой
- 📊 Динамические карточки с данными из MQTT
- 🔄 Live обновления при публикации новых значений

### 4.3 Проверьте WebSocket в консоли браузера

Откройте DevTools (F12) → Console. Вы должны видеть:
```
[WebSocket] Подключение к ws://localhost:3000/ws/mqtt?token=...
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

## Шаг 5: Проверка работы в реальном времени

В одном терминале запустите подписку:
```bash
mosquitto_sub -h localhost -t 'Skud/#' -v
```

В другом терминале публикуйте данные:
```bash
while true; do
  mosquitto_pub -h localhost -t "Skud/stats/students/total" -m "$((RANDOM % 2000))"
  sleep 2
done
```

На дашборде вы должны видеть обновление карточки каждые 2 секунды!

## 📊 Проверка статуса через API

### Статус MQTT подключения

```bash
curl http://localhost:3000/api/mqtt/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Ответ:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "broker": "localhost:1883",
    "cardsCount": 3,
    "valuesCount": 3
  }
}
```

### Получить карточки с значениями

```bash
curl http://localhost:3000/api/mqtt/cards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Ответ:
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "students",
        "label": "Студентов в кампусе",
        "icon": "users",
        "valueTopic": "Skud/stats/students/total",
        "color": "#00aeef",
        "unit": "чел.",
        "value": "1547"
      },
      ...
    ],
    "status": {
      "connected": true,
      "broker": "localhost:1883",
      "cardsCount": 3,
      "valuesCount": 3
    }
  }
}
```

## ❌ Troubleshooting

### Backend не видит MQTT брокер

```
[MQTT] ❌ Ошибка подключения: connect ECONNREFUSED 127.0.0.1:1883
```

**Решение:**
1. Проверьте, что Mosquitto запущен: `sudo systemctl status mosquitto`
2. Проверьте порт: `netstat -tulpn | grep 1883`
3. Проверьте firewall: `sudo ufw allow 1883/tcp`

### WebSocket не подключается

```
[WebSocket] ❌ Отклонено: отсутствует токен
```

**Решение:**
Убедитесь, что вы авторизованы. WebSocket требует JWT токен.

### Карточки не появляются

**Решение:**
1. Проверьте, что конфигурация опубликована: `mosquitto_sub -t 'Skud/main/stat' -v`
2. Проверьте JSON формат конфигурации
3. Проверьте логи backend: `[MQTT] 📊 Получена конфигурация`

## 🎯 Что дальше?

1. **Интеграция с вашей системой** - настройте автоматическую публикацию данных из вашего приложения
2. **Retain флаг** - используйте `retain: true` для сохранения последнего значения:
   ```bash
   mosquitto_pub -h localhost -t "Skud/main/stat" -m '...' -r
   ```
3. **Мониторинг** - следите за логами backend для диагностики проблем
4. **Безопасность** - настройте аутентификацию MQTT (username/password в `.env`)

## 📚 Полная документация

- [README_MQTT.md](./README_MQTT.md) - Полная документация
- [MQTT_CONFIG.md](./MQTT_CONFIG.md) - Формат конфигурации

Готово! 🎉 Теперь ваш дашборд отображает динамические карточки в реальном времени через MQTT!
