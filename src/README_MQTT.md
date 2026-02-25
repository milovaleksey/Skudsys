# Динамические статистические карточки с MQTT (Backend + Frontend)

Главная страница дашборда поддерживает динамические карточки статистики, которые обновляются в реальном времени через MQTT.

## 🏗️ Архитектура

```
MQTT Broker (Mosquitto)
      ↓
Backend (Node.js)
  - MQTT Client
  - WebSocket Server
  - REST API
      ↓
Frontend (React)
  - WebSocket Client
  - REST API Client
```

**Преимущества такой архитектуры:**
- ✅ Одно подключение к MQTT брокеру (вместо множества от каждого браузера)
- ✅ Централизованная обработка данных
- ✅ Кеширование и оптимизация
- ✅ Безопасность (MQTT credentials только на backend)
- ✅ Real-time обновления через WebSocket

## 📋 Быстрый старт

### 1. Настройте MQTT брокер

**Mosquitto** (`/etc/mosquitto/mosquitto.conf`):
```conf
listener 1883
protocol mqtt

# Для внутреннего использования WebSocket не обязателен
# listener 9001
# protocol websockets
```

Перезапустите брокер:
```bash
sudo systemctl restart mosquitto
```

### 2. Настройте Backend

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

Установите зависимости:
```bash
cd backend
npm install
```

Запустите backend:
```bash
npm run dev
```

### 3. Запустите Frontend

```bash
cd frontend  # или в корень если monorepo
npm install
npm run dev
```

### 4. Протестируйте MQTT карточки

Опубликуйте конфигурацию:
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
  }
]'
```

Публикуйте значения:
```bash
mosquitto_pub -h localhost -t "Skud/stats/students/total" -m "1547"
mosquitto_pub -h localhost -t "Skud/stats/employees/active" -m "312"
```

Или используйте тестовый скрипт:
```bash
chmod +x mqtt-test.sh
./mqtt-test.sh localhost
```

## 🔌 API Endpoints

### REST API

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/mqtt/cards` | GET | Получить карточки с их значениями |
| `/api/mqtt/values` | GET | Получить только значения карточек |
| `/api/mqtt/status` | GET | Статус MQTT подключения |
| `/api/mqtt/publish` | POST | Опубликовать в MQTT (только admin) |

### WebSocket

**URL:** `ws://localhost:3000/ws/mqtt?token=<JWT_TOKEN>`

**Типы сообщений от сервера:**

```typescript
// Начальные данные при подключении
{
  type: 'initial',
  cards: [...],
  status: { connected, broker, cardsCount, valuesCount }
}

// Обновление конфигурации карточек
{
  type: 'config-updated',
  cards: [...]
}

// Обновление значения одной карточки
{
  type: 'value-updated',
  cardId: 'students',
  value: '1547'
}

// Изменение статуса MQTT
{
  type: 'status-changed',
  status: { connected, ... }
}

// Heartbeat (каждые 30 сек)
{
  type: 'heartbeat'
}
```

**Сообщения от клиента:**

```typescript
// Ping для проверки соединения
{
  type: 'ping'
}
```

## 📊 Формат конфигурации

**Топик:** `Skud/main/stat`

```json
[
  {
    "id": "unique_id",           // Уникальный ID карточки
    "label": "Название",         // Название (обязательно)
    "icon": "users",             // Иконка (опционально)
    "valueTopic": "topic/path",  // MQTT топик значения (обязательно)
    "color": "#00aeef",          // Цвет акцента HEX (опционально)
    "unit": "чел."               // Единица измерения (опционально)
  }
]
```

### Доступные иконки

`users`, `briefcase`, `car`, `activity`, `trending-up`, `trending-down`, 
`alert-circle`, `check-circle`, `clock`, `database`, `server`, `wifi`, `wifi-off`

## 🚀 Примеры использования

### Пример 1: Базовая статистика

```bash
# Конфигурация
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "students",
    "label": "Всего студентов",
    "icon": "users",
    "valueTopic": "stats/students",
    "color": "#00aeef"
  },
  {
    "id": "employees",
    "label": "Всего сотрудников",
    "icon": "briefcase",
    "valueTopic": "stats/employees",
    "color": "#10b981"
  }
]'

# Значения
mosquitto_pub -h localhost -t "stats/students" -m "1547"
mosquitto_pub -h localhost -t "stats/employees" -m "312"
```

### Пример 2: Мониторинг окружения

```bash
# Конфигурация
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "temp",
    "label": "Температура",
    "icon": "activity",
    "valueTopic": "sensors/temperature",
    "color": "#ef4444",
    "unit": "°C"
  },
  {
    "id": "humidity",
    "label": "Влажность",
    "icon": "database",
    "valueTopic": "sensors/humidity",
    "color": "#3b82f6",
    "unit": "%"
  }
]'

# Значения
mosquitto_pub -h localhost -t "sensors/temperature" -m "22.5"
mosquitto_pub -h localhost -t "sensors/humidity" -m "65"
```

### Пример 3: Периодическое обновление (Python)

```python
import paho.mqtt.client as mqtt
import json
import time
import random

client = mqtt.Client()
client.connect("localhost", 1883, 60)

# Публикуем конфигурацию с retain
config = [
    {
        "id": "active_users",
        "label": "Активных пользователей",
        "icon": "users",
        "valueTopic": "app/users/active",
        "color": "#00aeef"
    }
]
client.publish("Skud/main/stat", json.dumps(config), retain=True)

# Обновляем значения каждые 5 секунд
while True:
    active_users = random.randint(10, 50)
    client.publish("app/users/active", str(active_users))
    time.sleep(5)
```

### Пример 4: Node.js интеграция

```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  // Публикуем конфигурацию
  const config = [
    {
      id: 'orders',
      label: 'Заказов сегодня',
      icon: 'check-circle',
      valueTopic: 'shop/orders/today',
      color: '#10b981'
    }
  ];
  
  client.publish('Skud/main/stat', JSON.stringify(config), { retain: true });
  
  // Обновляем значения
  setInterval(() => {
    const orders = Math.floor(Math.random() * 100);
    client.publish('shop/orders/today', String(orders));
  }, 5000);
});
```

## 🔧 Backend файлы

```
/backend/src/
├── services/
│   └── mqtt.service.js        # MQTT клиент и логика
├── controllers/
│   └── mqtt.controller.js     # REST API контроллеры
├── routes/
│   └── mqtt.routes.js         # Маршруты API
├── websocket/
│   └── mqtt.ws.js             # WebSocket сервер
└── server.js                  # Инициализация MQTT и WS
```

## 🎨 Frontend файлы

```
/src/
├── hooks/
│   └── useMQTT.ts             # React хуки для MQTT
├── components/
│   ├── MainPage.tsx           # Главная страница с карточками
│   └── DynamicStatCard.tsx    # Компонент карточки
```

## 🐛 Troubleshooting

### Backend не подключается к MQTT

1. Проверьте конфигурацию в `.env`:
   ```bash
   cat backend/.env | grep MQTT
   ```

2. Проверьте, что брокер запущен:
   ```bash
   sudo systemctl status mosquitto
   ```

3. Проверьте логи backend:
   ```bash
   cd backend && npm run dev
   # Смотрите строки "[MQTT]"
   ```

### WebSocket не подключается

1. Проверьте порт backend (должен быть 3000)
2. Проверьте токен авторизации в localStorage
3. Откройте консоль браузера и смотрите ошибки WebSocket

### Карточки не обновляются

1. Проверьте, что WebSocket подключен (индикатор "MQTT подключен")
2. Проверьте, что конфигурация опубликована в топик `Skud/main/stat`
3. Проверьте, что значения публикуются в правильные топики

### Ошибка "Требуется токен авторизации"

WebSocket требует JWT токен в query параметре. Убедитесь, что пользователь авторизован.

## 📈 Производительность

- **Backend:** Одно MQTT подключение обслуживает все фронтенды
- **WebSocket:** Эффективная передача только изменений
- **Кеширование:** Значения хранятся в памяти backend
- **Reconnect:** Автоматическое переподключение с экспоненциальной задержкой

## 🔒 Безопасность

- ✅ JWT авторизация для WebSocket
- ✅ MQTT credentials только на backend
- ✅ Проверка прав доступа для публикации
- ✅ Rate limiting на API endpoints
- ✅ Валидация данных от MQTT

## 📚 Дополнительно

- [MQTT_CONFIG.md](./MQTT_CONFIG.md) - Детальная документация по формату
- [mqtt-test.sh](./mqtt-test.sh) - Тестовый скрипт

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи backend (`npm run dev`)
2. Проверьте консоль браузера (F12)
3. Проверьте MQTT брокер (`mosquitto_sub -t '#' -v`)
