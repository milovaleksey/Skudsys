# 🎯 Динамическая аналитика СКУД через MQTT - Полная документация

## 📌 Концепция

Система аналитики полностью конфигурируется через MQTT:
1. **Конфигурация** определяет типы аналитики и их параметры
2. **Сырые данные** приходят из СКУД в виде агрегированных событий
3. **Backend** обрабатывает данные согласно конфигурации
4. **Frontend** динамически строит визуализации

---

## 🔄 Архитектура

```
┌─────────────────┐
│  MQTT Broker    │
│  (mosquitto)    │
└────────┬────────┘
         │
         ├─── Topic: Skud/analytics/config
         │    └─> Конфигурация типов аналитики
         │
         ├─── Topic: Skud/analytics/events/aggregated
         │    └─> Сырые данные (JSON массив)
         │
         ▼
┌─────────────────────────────┐
│  Backend (Node.js)          │
│  ┌───────────────────────┐  │
│  │  MQTT Service         │  │
│  │  - Подписка на топики │  │
│  │  - Получение данных   │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │  Analytics Processor  │  │
│  │  - Парсинг конфига    │  │
│  │  - Обработка данных   │  │
│  │  - Агрегации          │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │  WebSocket Server     │  │
│  │  - Трансляция данных  │  │
│  └───────────────────────┘  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Frontend (React)           │
│  ┌───────────────────────┐  │
│  │  useAnalyticsMQTT     │  │
│  │  - WebSocket клиент   │  │
│  │  - Получение данных   │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────▼───────────┐  │
│  │  AnalyticsPage        │  │
│  │  - Динамические       │  │
│  │    графики            │  │
│  │  - Экспорт Excel      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 📡 MQTT Топики

### 1. Конфигурация аналитики
```
Topic: Skud/analytics/config
Retained: YES (чтобы новые клиенты получали последнюю конфигурацию)
Format: JSON
```

### 2. Сырые данные
```
Topic: Skud/analytics/events/aggregated
Retained: NO
Format: JSON Array
```

---

## 📝 Формат данных

### Конфигурация (ANALYTICS_CONFIG_EXAMPLE.json)

```json
{
  "version": "1.0",
  "dataSource": {
    "topic": "Skud/analytics/events/aggregated",
    "schema": {
      "event_date": "ISO8601 datetime",
      "root_zone_name": "string",
      "total_events": "number"
    }
  },
  "analytics": [
    {
      "id": "total_stats",
      "type": "statistics",
      "title": "Общая статистика",
      "enabled": true,
      "calculations": [...]
    },
    ...
  ]
}
```

### Сырые данные (event-data-1.json)

```json
[
  {
    "event_date": "2025-06-17T16:00:00.000Z",
    "root_zone_name": "Корпус №16",
    "total_events": 3
  },
  ...
]
```

---

## 🛠 Backend компоненты

### 1. MQTT Service (`/backend/src/services/mqtt.service.js`)

**Обязанности:**
- Подключение к MQTT брокеру
- Подписка на топики аналитики
- Получение конфигурации и данных
- Вызов Analytics Processor
- Трансляция через WebSocket

**Ключевые методы:**
```javascript
subscribeToAnalyticsTopics()  // Подписка
handleMessage(topic, message) // Обработка сообщений
processAnalyticsData()         // Обработка данных
getAnalyticsData()             // Получение обработанных данных
```

### 2. Analytics Processor (`/backend/src/services/analytics.processor.js`)

**Обязанности:**
- Парсинг конфигурации
- Обработка сырых данных
- Применение агрегаций и фильтров
- Возврат обработанных данных

**Поддерживаемые типы аналитики:**
- `statistics` - общая статистика (sum, count_distinct, avg_daily, max_day)
- `timeSeries` - временные ряды
- `ranking` - топ N элементов
- `weekdayPattern` - распределение по дням недели
- `multiSeries` - сравнение нескольких серий
- `categorization` - категоризация данных
- `filtered` - фильтрованные данные
- `comparison` - сравнение групп

**Пример обработки:**
```javascript
// Конфигурация
{
  "type": "statistics",
  "calculations": [
    {
      "metric": "totalPasses",
      "operation": "sum",
      "field": "total_events"
    }
  ]
}

// Результат
{
  "totalPasses": 250000
}
```

### 3. WebSocket Server (`/backend/src/websocket/mqtt.ws.js`)

**Обязанности:**
- WebSocket сервер на `/ws/mqtt`
- Аутентификация клиентов
- Отправка начальных данных
- Трансляция обновлений

**События:**
- `initial` - начальные данные при подключении
- `analytics-updated` - обновление данных аналитики

---

## 💻 Frontend компоненты

### 1. Hook useAnalyticsMQTT (`/hooks/useAnalyticsMQTT.ts`)

**Обязанности:**
- Подключение к WebSocket
- Получение данных аналитики
- Автоматическое переподключение

**Возвращаемые данные:**
```typescript
{
  statistics: any,              // Статистика
  timeSeries: any[],            // Временные ряды
  topLocations: any[],          // Топ локаций
  weekdayPattern: any[],        // По дням недели
  locationsComparison: any[],   // Сравнение локаций
  isConnected: boolean,         // Статус подключения
  error: string | null,         // Ошибка
  reconnect: () => void         // Переподключение
}
```

### 2. AnalyticsPage (`/components/AnalyticsPage.tsx`)

**Обязанности:**
- Отображение аналитики
- Динамические графики
- Экспорт в Excel

**Компоненты:**
- Карточки статистики (4 шт)
- Area Chart - динамика по дням
- Horizontal Bar - топ-10 зон
- Bar Chart - по дням недели
- Line Chart - сравнение локаций

---

## 🧪 Тестирование

### Шаг 1: Запуск backend

```bash
cd backend
npm run dev
```

### Шаг 2: Публикация конфигурации

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/config" \
  -f ANALYTICS_CONFIG_EXAMPLE.json \
  -r
```

### Шаг 3: Публикация данных

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/events/aggregated" \
  -f /imports/event-data-1.json
```

### Шаг 4: Открыть страницу "Аналитика"

Frontend автоматически:
1. Подключится к WebSocket
2. Получит обработанные данные
3. Отобразит графики

### Автоматический тест

```bash
chmod +x test_analytics_mqtt.sh
./test_analytics_mqtt.sh
```

---

## 📊 Поддерживаемые типы аналитики

### 1. Statistics (Статистика)

**Конфигурация:**
```json
{
  "type": "statistics",
  "calculations": [
    {
      "metric": "totalPasses",
      "operation": "sum",
      "field": "total_events"
    },
    {
      "metric": "uniqueZones",
      "operation": "count_distinct",
      "field": "root_zone_name"
    }
  ]
}
```

**Результат:**
```json
{
  "totalPasses": 250000,
  "uniqueZones": 17
}
```

**Операции:**
- `sum` - сумма
- `count_distinct` - уникальные значения
- `avg_daily` - среднее в день
- `max_day` - пиковый день

---

### 2. TimeSeries (Временные ряды)

**Конфигурация:**
```json
{
  "type": "timeSeries",
  "config": {
    "groupBy": "event_date",
    "aggregation": "sum",
    "field": "total_events"
  }
}
```

**Результат:**
```json
[
  { "date": "2025-06-17", "count": 4500 },
  { "date": "2025-06-18", "count": 4800 }
]
```

---

### 3. Ranking (Топ N)

**Конфигурация:**
```json
{
  "type": "ranking",
  "config": {
    "groupBy": "root_zone_name",
    "aggregation": "sum",
    "field": "total_events",
    "limit": 10,
    "showPercentage": true
  }
}
```

**Результат:**
```json
[
  {
    "name": "Корпус №5",
    "count": 25000,
    "percentage": 16.67
  }
]
```

---

### 4. WeekdayPattern (По дням недели)

**Конфигурация:**
```json
{
  "type": "weekdayPattern",
  "config": {
    "aggregation": "avg",
    "field": "total_events",
    "weekdayLabels": {
      "1": "Вс",
      "2": "Пн",...
    }
  }
}
```

**Результат:**
```json
[
  { "day": "Пн", "dayIndex": 2, "count": 7500 },
  { "day": "Вт", "dayIndex": 3, "count": 8500 }
]
```

---

### 5. MultiSeries (Сравнение серий)

**Конфигурация:**
```json
{
  "type": "multiSeries",
  "config": {
    "groupBy": ["event_date", "root_zone_name"],
    "topN": 5
  }
}
```

**Результат:**
```json
[
  {
    "date": "2025-06-17",
    "Корпус №5": 800,
    "Корпус №4": 750
  }
]
```

---

## 🔧 Расширение системы

### Добавление нового типа аналитики

#### 1. Обновить Analytics Processor

`/backend/src/services/analytics.processor.js`:

```javascript
processAnalytics(analyticsConfig) {
  switch (type) {
    // ... existing cases
    
    case 'myNewType':
      return this.processMyNewType(config);
    
    default:
      console.warn(`Unknown type: ${type}`);
      return null;
  }
}

processMyNewType(config) {
  // Ваша логика обработки
  return processedData;
}
```

#### 2. Обновить Frontend

`/components/AnalyticsPage.tsx`:

```tsx
const { myNewTypeData } = useAnalyticsMQTT();

// Отображение
{myNewTypeData && (
  <Card>
    <h3>Мой новый тип аналитики</h3>
    {/* Визуализация */}
  </Card>
)}
```

#### 3. Добавить в конфигурацию

```json
{
  "id": "my_new_type",
  "type": "myNewType",
  "title": "Мой новый тип",
  "enabled": true,
  "config": {
    // параметры
  }
}
```

---

## 🐛 Отладка

### Backend логи

```bash
# В консоли backend должно быть:
[MQTT] ✅ Подписка на топик конфигурации аналитики: Skud/analytics/config
[MQTT] ✅ Подписка на топик данных аналитики: Skud/analytics/events/aggregated
[MQTT] 📊 Получена конфигурация аналитики
[MQTT] 📊 Получено 300 записей данных аналитики
[Analytics Processor] Конфигурация обновлена
[Analytics Processor] Получено 300 записей
[MQTT] 📊 Обработка данных аналитики...
[MQTT] ✅ Обработано 10 типов аналитики
[WebSocket] 📊 Рассылка обновления аналитики клиентам
```

### Frontend логи (F12 → Console)

```javascript
[Analytics WebSocket] ✅ Подключено
[Analytics WebSocket] Получено: initial
[Analytics WebSocket] Получены начальные данные аналитики
[Analytics WebSocket] Обновление данных аналитики
```

### Проверка MQTT

```bash
# Подписка на все топики аналитики
mosquitto_sub -h localhost -p 1883 -t "Skud/analytics/#" -v
```

---

## 📈 Производительность

### Оптимизации

1. **Retained message для конфигурации** - новые клиенты сразу получают конфиг
2. **Кэширование в памяти** - обработанные данные хранятся в памяти
3. **Инкрементальные обновления** - только измененные данные

### Ограничения

- Максимальный размер сообщения MQTT: 256 MB (по умолчанию)
- Для больших датасетов (>100k записей) рекомендуется пагинация
- WebSocket поддерживает до 1000 одновременных клиентов

---

## 🔒 Безопасность

1. **Аутентификация WebSocket** - через JWT токен
2. **MQTT credentials** - username/password в `.env`
3. **Валидация данных** - проверка структуры JSON
4. **Error handling** - graceful degradation при ошибках

---

## 📚 Примеры использования

### Пример 1: Добавление нового фильтра

```json
{
  "id": "night_activity",
  "type": "filtered",
  "title": "Ночная активность",
  "config": {
    "filter": "hour BETWEEN 22 AND 6",
    "groupBy": "root_zone_name"
  }
}
```

### Пример 2: Сравнение месяцев

```json
{
  "id": "month_comparison",
  "type": "comparison",
  "config": {
    "groups": [
      { "name": "Июнь", "filter": "month = 6" },
      { "name": "Июль", "filter": "month = 7" }
    ]
  }
}
```

---

## 🎉 Заключение

Система динамической аналитики через MQTT обеспечивает:
✅ Гибкость - любые типы аналитики через конфигурацию
✅ Масштабируемость - обработка на backend
✅ Реальное время - WebSocket обновления
✅ Простота - JSON конфигурация

**Готово к использованию!** 🚀
