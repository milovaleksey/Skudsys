# 📊 Аналитика СКУД через MQTT - Документация

## 🎯 Обзор

Страница "Аналитика СКУД" работает через MQTT в реальном времени:
- **Backend** подписывается на MQTT топики аналитики
- **WebSocket** транслирует данные на frontend
- **Frontend** отображает графики и статистику в реальном времени

## 📡 MQTT Топики

Система подписывается на следующие топики:

| Топик | Описание | Формат данных |
|-------|----------|---------------|
| `Skud/analytics/statistics` | Общая статистика | JSON объект |
| `Skud/analytics/timeSeries` | Временные ряды (по дням) | JSON массив |
| `Skud/analytics/topLocations` | Топ-10 локаций | JSON массив |
| `Skud/analytics/weekdayPattern` | Распределение по дням недели | JSON массив |
| `Skud/analytics/locationsComparison` | Сравнение топ-5 локаций | JSON массив |
| `Skud/analytics/hourlyDistribution` | Распределение по часам | JSON массив |

---

## 📝 Форматы данных

### 1️⃣ **Skud/analytics/statistics**

```json
{
  "totalPasses": 150000,
  "uniquePeople": 5420,
  "uniqueLocations": 45,
  "avgDailyPasses": 5000,
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}
```

### 2️⃣ **Skud/analytics/timeSeries**

```json
[
  { "date": "2025-01-01", "count": 4500 },
  { "date": "2025-01-02", "count": 4800 },
  { "date": "2025-01-03", "count": 5200 }
]
```

### 3️⃣ **Skud/analytics/topLocations**

```json
[
  { "name": "Учебный корпус №1", "count": 25000, "percentage": 16.67 },
  { "name": "Учебный корпус №2", "count": 22000, "percentage": 14.67 },
  { "name": "Библиотека", "count": 18000, "percentage": 12.00 }
]
```

### 4️⃣ **Skud/analytics/weekdayPattern**

```json
[
  { "day": "Пн", "dayIndex": 2, "count": 22000 },
  { "day": "Вт", "dayIndex": 3, "count": 24000 },
  { "day": "Ср", "dayIndex": 4, "count": 25000 },
  { "day": "Чт", "dayIndex": 5, "count": 23000 },
  { "day": "Пт", "dayIndex": 6, "count": 21000 },
  { "day": "Сб", "dayIndex": 7, "count": 8000 },
  { "day": "Вс", "dayIndex": 1, "count": 4000 }
]
```

### 5️⃣ **Skud/analytics/locationsComparison**

```json
[
  { 
    "date": "2025-01-01",
    "Учебный корпус №1": 800,
    "Учебный корпус №2": 750,
    "Библиотека": 600,
    "Столовая": 550,
    "Общежитие №1": 500
  },
  { 
    "date": "2025-01-02",
    "Учебный корпус №1": 850,
    "Учебный корпус №2": 780,
    "Библиотека": 620,
    "Столовая": 570,
    "Общежитие №1": 520
  }
]
```

---

## 🧪 Тестирование с mosquitto_pub

### Установка mosquitto-clients

**Ubuntu/Debian:**
```bash
sudo apt-get install mosquitto-clients
```

**macOS:**
```bash
brew install mosquitto
```

### Публикация тестовых данных

#### 1. Общая статистика
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/statistics" \
  -m '{
    "totalPasses": 150000,
    "uniquePeople": 5420,
    "uniqueLocations": 45,
    "avgDailyPasses": 5000,
    "dateRange": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    }
  }'
```

#### 2. Временные ряды
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/timeSeries" \
  -m '[
    {"date":"2025-01-01","count":4500},
    {"date":"2025-01-02","count":4800},
    {"date":"2025-01-03","count":5200},
    {"date":"2025-01-04","count":4900},
    {"date":"2025-01-05","count":5100}
  ]'
```

#### 3. Топ локаций
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/topLocations" \
  -m '[
    {"name":"Учебный корпус №1","count":25000,"percentage":16.67},
    {"name":"Учебный корпус №2","count":22000,"percentage":14.67},
    {"name":"Библиотека","count":18000,"percentage":12.00},
    {"name":"Столовая","count":15000,"percentage":10.00},
    {"name":"Общежитие №1","count":12000,"percentage":8.00}
  ]'
```

#### 4. По дням недели
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/weekdayPattern" \
  -m '[
    {"day":"Пн","dayIndex":2,"count":22000},
    {"day":"Вт","dayIndex":3,"count":24000},
    {"day":"Ср","dayIndex":4,"count":25000},
    {"day":"Чт","dayIndex":5,"count":23000},
    {"day":"Пт","dayIndex":6,"count":21000},
    {"day":"Сб","dayIndex":7,"count":8000},
    {"day":"Вс","dayIndex":1,"count":4000}
  ]'
```

#### 5. Сравнение локаций
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/locationsComparison" \
  -m '[
    {"date":"2025-01-01","Учебный корпус №1":800,"Учебный корпус №2":750,"Библиотека":600,"Столовая":550,"Общежитие №1":500},
    {"date":"2025-01-02","Учебный корпус №1":850,"Учебный корпус №2":780,"Библиотека":620,"Столовая":570,"Общежитие №1":520},
    {"date":"2025-01-03","Учебный корпус №1":900,"Учебный корпус №2":820,"Библиотека":650,"Столовая":590,"Общежитие №1":540}
  ]'
```

---

## ✅ Чек-лист тестирования

### Этап 1: Проверка подключения
- [ ] Откройте страницу "Аналитика"
- [ ] Проверьте индикатор подключения (зеленый = подключено)
- [ ] В консоли браузера должно быть: `[Analytics WebSocket] ✅ Подключено`

### Этап 2: Публикация данных
- [ ] Опубликуйте статистику через `mosquitto_pub`
- [ ] Опубликуйте временные ряды
- [ ] Опубликуйте топ локаций
- [ ] Опубликуйте данные по дням недели
- [ ] Опубликуйте сравнение локаций

### Этап 3: Проверка отображения
- [ ] Карточки статистики заполнились данными
- [ ] График "Динамика проходов по дням" отрисовался
- [ ] Список "Топ-10 зданий" отображается с прогресс-барами
- [ ] График "Активность по дням недели" отрисовался
- [ ] График "Сравнение топ-5 локаций" отрисовался

### Этап 4: Функциональность
- [ ] Кнопка "Обновить" работает
- [ ] Кнопка "Экспорт" создает Excel файл
- [ ] Excel файл содержит все листы с данными
- [ ] При отключении MQTT появляется предупреждение

---

## 🔍 Отладка

### Проверка логов backend
```bash
# В консоли backend должно быть:
[MQTT] ✅ Подписка на топик аналитики: Skud/analytics/statistics
[MQTT] ✅ Подписка на топик аналитики: Skud/analytics/timeSeries
[MQTT] 📊 Получены статистические данные
[WebSocket] 📊 Рассылка обновления аналитики клиентам
```

### Проверка логов frontend (F12 → Console)
```javascript
[Analytics WebSocket] ✅ Подключено
[Analytics WebSocket] Получено: initial
[Analytics WebSocket] Получены начальные данные аналитики
[Analytics WebSocket] Обновление данных аналитики
```

### Подписка на топики для мониторинга
```bash
# Мониторинг всех топиков аналитики
mosquitto_sub -h localhost -p 1883 -t "Skud/analytics/#" -v
```

---

## 🚀 Автоматическая публикация данных (для постоянного обновления)

Создайте скрипт `publish_analytics.sh`:

```bash
#!/bin/bash

BROKER="localhost"
PORT="1883"

while true; do
  # Генерируем случайные данные
  TOTAL=$((RANDOM % 10000 + 100000))
  PEOPLE=$((RANDOM % 1000 + 5000))
  
  # Публикуем статистику
  mosquitto_pub -h $BROKER -p $PORT \
    -t "Skud/analytics/statistics" \
    -m "{\"totalPasses\":$TOTAL,\"uniquePeople\":$PEOPLE,\"uniqueLocations\":45,\"avgDailyPasses\":5000,\"dateRange\":{\"from\":\"2025-01-01\",\"to\":\"2025-01-31\"}}"
  
  echo "Published analytics data: $TOTAL passes, $PEOPLE people"
  
  # Ждем 10 секунд
  sleep 10
done
```

Запуск:
```bash
chmod +x publish_analytics.sh
./publish_analytics.sh
```

---

## 📚 Дополнительные возможности

### Интеграция с реальной системой СКУД

Для автоматической публикации данных из БД в MQTT можно создать сервис:

**Node.js пример:**
```javascript
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

const client = mqtt.connect('mqtt://localhost:1883');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'skud_user',
  password: 'password',
  database: 'skud_db'
});

// Публикация статистики каждые 5 минут
setInterval(async () => {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as totalPasses,
      COUNT(DISTINCT DisplayName) as uniquePeople,
      COUNT(DISTINCT PointFullName) as uniqueLocations
    FROM AcessEvent
    WHERE CAST(EventTime AS DATE) BETWEEN '2025-01-01' AND '2025-01-31'
  `);
  
  client.publish('Skud/analytics/statistics', JSON.stringify({
    ...stats[0],
    avgDailyPasses: Math.round(stats[0].totalPasses / 31),
    dateRange: { from: '2025-01-01', to: '2025-01-31' }
  }));
}, 300000);
```

---

**Готово! Система аналитики через MQTT полностью настроена! 🎉**
