# MQTT конструктор аналитики - Документация

## 📋 Краткое описание

MQTT-конструктор для аналитики позволяет динамически настраивать виджеты и фильтры для визуализации данных из системы СКУД через MQTT протокол.

---

## ✅ Что добавлено

### Backend:

1. **`/backend/src/services/analytics-mqtt.service.js`**
   - MQTT сервис для аналитики
   - Подключение к MQTT брокеру
   - Автоматический сбор данных из БД СКУД
   - Публикация конфигурации и данных
   - Периодическое обновление (каждые 5 минут по умолчанию)

2. **`/backend/src/websocket/analytics.ws.js`**
   - WebSocket сервер для передачи данных на frontend
   - Путь: `/ws/analytics`
   - Heartbeat для поддержания соединений

3. **`/backend/src/routes/analytics.routes.js`** (обновлен)
   - `GET /v1/analytics/mqtt/status` - статус MQTT подключения
   - `POST /v1/analytics/mqtt/update` - запросить обновление данных
   - `GET /v1/analytics/mqtt/config` - получить конфигурацию

4. **`/backend/.env.example`**
   - Шаблон с переменными окружения

### Frontend:

1. **`/hooks/useAnalyticsMQTT.ts`**
   - React Hook для подключения к Analytics WebSocket
   - Автопереподключение при обрыве связи
   - TypeScript типы для данных

2. **`/components/AnalyticsPage.tsx`** (обновлен)
   - Динамическая отрисовка виджетов из MQTT конфигурации
   - Поддержка 4 типов графиков: Area, Bar, Line, Pie
   - Экспорт в Excel
   - Отображение метаданных

---

## ⚙️ Настройка

### 1. ENV переменные

Добавьте в ваш `/backend/.env` файл:

```env
# Analytics MQTT
ANALYTICS_MQTT_ENABLED=true
ANALYTICS_MQTT_CONFIG_TOPIC=Skud/analytics/config
ANALYTICS_MQTT_DATA_TOPIC=Skud/analytics/data
ANALYTICS_MQTT_STATUS_TOPIC=Skud/analytics/status
ANALYTICS_MQTT_UPDATE_INTERVAL=300000
```

**Описание переменных:**
- `ANALYTICS_MQTT_ENABLED` - включить/выключить Analytics MQTT (по умолчанию: true)
- `ANALYTICS_MQTT_CONFIG_TOPIC` - топик для конфигурации виджетов
- `ANALYTICS_MQTT_DATA_TOPIC` - топик для данных
- `ANALYTICS_MQTT_STATUS_TOPIC` - топик для статуса сервиса
- `ANALYTICS_MQTT_UPDATE_INTERVAL` - интервал обновления в мс (по умолчанию: 300000 = 5 минут)

### 2. MQTT Broker

Убедитесь, что MQTT брокер запущен и доступен по адресу из `MQTT_BROKER`:

```env
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

---

## 📊 MQTT Топики

### 1. Config Topic: `Skud/analytics/config`

Конфигурация виджетов и фильтров:

```json
{
  "version": "1.0",
  "widgets": [
    {
      "id": "total-passes-chart",
      "type": "area",
      "title": "Общая динамика проходов",
      "description": "Временной ряд всех проходов по дням",
      "dataSource": "time-series-total",
      "color": "#00aeef",
      "showTrend": true,
      "showAverage": true
    },
    {
      "id": "top-buildings-bar",
      "type": "bar",
      "title": "Топ-10 зданий",
      "description": "Рейтинг самых посещаемых локаций",
      "dataSource": "top-buildings",
      "limit": 10,
      "color": "#00aeef",
      "showPercentage": true
    }
  ],
  "filters": [
    {
      "id": "date-range",
      "type": "dateRange",
      "label": "Период",
      "default": "last-7-days",
      "options": ["last-7-days", "last-30-days", "last-90-days", "custom"]
    }
  ]
}
```

**Типы виджетов:**
- `area` - график с областью
- `bar` - столбчатая диаграмма / список с барами
- `line` - линейный график
- `pie` - круговая диаграмма

### 2. Data Topic: `Skud/analytics/data`

Данные для визуализации:

```json
{
  "timestamp": "2025-07-16T10:00:00Z",
  "datasets": {
    "time-series-total": [
      { "date": "2025-06-18", "count": 5380 },
      { "date": "2025-06-19", "count": 7787 }
    ],
    "top-buildings": [
      { "name": "Корпус №5", "count": 15234, "percentage": 18.5 },
      { "name": "Корпус №4", "count": 14012, "percentage": 17.0 }
    ],
    "buildings-comparison": [
      {
        "date": "2025-06-18",
        "Корпус №4": 1371,
        "Корпус №5": 1287,
        "Корпус №16": 1381
      }
    ],
    "category-distribution": [
      { "category": "Корпуса", "count": 45678, "percentage": 62 },
      { "category": "Общежития", "count": 28012, "percentage": 38 }
    ],
    "weekday-pattern": [
      { "day": "Пн", "count": 8234 },
      { "day": "Вт", "count": 9012 }
    ]
  },
  "metadata": {
    "totalPasses": 73690,
    "uniqueBuildings": 16,
    "dateRange": {
      "from": "2025-06-18",
      "to": "2025-07-15"
    }
  }
}
```

**Датасеты:**
- `time-series-total` - временные ряды (проходы по дням)
- `top-buildings` - топ зданий
- `buildings-comparison` - сравнение нескольких зданий
- `category-distribution` - распределение по категориям
- `weekday-pattern` - паттерн по дням недели

### 3. Status Topic: `Skud/analytics/status`

Статус сервиса:

```json
{
  "status": "connected",
  "timestamp": "2025-07-16T10:00:00Z"
}
```

---

## 🚀 Запуск

### 1. Запуск Backend

```bash
cd backend
npm install
npm start
```

**В консоли должно появиться:**
```
✅ Analytics WebSocket initialized
🔌 Подключение к MQTT брокеру...
[Analytics MQTT] ✅ Connected to broker
[Analytics MQTT] 📡 Subscribed to Skud/analytics/config
[Analytics MQTT] 📤 Published default config
[Analytics MQTT] ⏰ Data updates scheduled every 5 minutes
```

### 2. Запуск Frontend

```bash
npm install
npm run dev
```

### 3. Открыть страницу

Перейдите на страницу "Аналитика" в приложении.

---

## 🔧 API Endpoints

### 1. Получить статус MQTT

```http
GET /v1/analytics/mqtt/status
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "hasConfig": true,
    "topics": {
      "config": "Skud/analytics/config",
      "data": "Skud/analytics/data",
      "status": "Skud/analytics/status"
    }
  }
}
```

### 2. Запросить обновление данных

```http
POST /v1/analytics/mqtt/update
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Обновление данных запущено"
}
```

### 3. Получить конфигурацию

```http
GET /v1/analytics/mqtt/config
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "widgets": [...],
    "filters": [...]
  }
}
```

---

## 🎨 Как изменить конфигурацию

### Через MQTT клиент

Опубликуйте новую конфигурацию в топик `Skud/analytics/config`:

```bash
mosquitto_pub -h localhost -t "Skud/analytics/config" -m '{
  "version": "1.0",
  "widgets": [
    {
      "id": "my-custom-chart",
      "type": "bar",
      "title": "Мой график",
      "dataSource": "custom-data",
      "color": "#ff6b6b"
    }
  ]
}'
```

### Программно через backend

Обновите метод `publishDefaultConfig()` в `analytics-mqtt.service.js`.

---

## 🐛 Troubleshooting

### 1. WebSocket не подключается

**Проблема:** Frontend показывает "MQTT отключен"

**Решение:**
- Проверьте, что backend запущен
- Проверьте URL в `useAnalyticsMQTT.ts`
- Проверьте логи backend

### 2. Нет данных в графиках

**Проблема:** Виджеты отображаются, но пустые

**Решение:**
- Проверьте, что БД СКУД содержит данные
- Проверьте логи backend на ошибки SQL
- Попробуйте обновить данные кнопкой "Обновить"

### 3. MQTT не подключается

**Проблема:** Backend логи показывают ошибки подключения к MQTT

**Решение:**
- Проверьте, что MQTT брокер запущен: `mosquitto -v`
- Проверьте `MQTT_BROKER` в `.env`
- Проверьте firewall/порты

---

## 📝 Примеры датасетов

### Time Series (временные ряды)

```json
[
  { "date": "2025-06-18", "count": 5380 },
  { "date": "2025-06-19", "count": 7787 },
  { "date": "2025-06-20", "count": 3429 }
]
```

### Top Buildings (топ зданий)

```json
[
  { "name": "Корпус №5", "count": 15234, "percentage": 18.5 },
  { "name": "Корпус №4", "count": 14012, "percentage": 17.0 },
  { "name": "Корпус №16", "count": 12876, "percentage": 15.6 }
]
```

### Buildings Comparison (сравнение зданий)

```json
[
  {
    "date": "2025-06-18",
    "Корпус №4": 1371,
    "Корпус №5": 1287,
    "Корпус №16": 1381
  },
  {
    "date": "2025-06-19",
    "Корпус №4": 983,
    "Корпус №5": 1758,
    "Корпус №16": 1057
  }
]
```

### Category Distribution (распределение по категориям)

```json
[
  { "category": "Корпуса", "count": 45678, "percentage": 62 },
  { "category": "Общежития", "count": 28012, "percentage": 38 }
]
```

### Weekday Pattern (паттерн по дням недели)

```json
[
  { "day": "Пн", "count": 8234 },
  { "day": "Вт", "count": 9012 },
  { "day": "Ср", "count": 8890 },
  { "day": "Чт", "count": 9456 },
  { "day": "Пт", "count": 8123 },
  { "day": "Сб", "count": 2345 },
  { "day": "Вс", "count": 1890 }
]
```

---

## 🎯 Следующие шаги

1. ✅ Запустите backend и frontend
2. 📊 Откройте страницу "Аналитика"
3. 🔄 Нажмите "Обновить" для получения данных
4. 📥 Экспортируйте в Excel для проверки
5. 🔧 Настройте конфигурацию под свои нужды

---

**Готово!** 🎉
