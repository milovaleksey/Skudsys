# ✅ MQTT Аналитика - Чеклист настройки

## Перед запуском

### Backend ENV файл

В `/backend/.env` добавьте:

```env
# MQTT Broker
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_ENABLED=true

# Analytics MQTT (опционально, если нужны другие значения)
ANALYTICS_MQTT_ENABLED=true
ANALYTICS_MQTT_CONFIG_TOPIC=Skud/analytics/config
ANALYTICS_MQTT_DATA_TOPIC=Skud/analytics/data
ANALYTICS_MQTT_STATUS_TOPIC=Skud/analytics/status
ANALYTICS_MQTT_UPDATE_INTERVAL=300000
```

### Проверьте MQTT брокер

```bash
# Установка Mosquitto (если еще нет)
# Ubuntu/Debian:
sudo apt install mosquitto mosquitto-clients

# MacOS:
brew install mosquitto

# Запуск брокера
mosquitto -v

# Или как сервис
sudo systemctl start mosquitto
```

## Запуск

### 1. Backend
```bash
cd backend
npm install  # если нужно
npm start
```

**✅ Проверьте логи:**
- `✅ Analytics WebSocket initialized`
- `[Analytics MQTT] ✅ Connected to broker`
- `[Analytics MQTT] 📤 Published default config`

### 2. Frontend
```bash
npm run dev
```

### 3. Откройте браузер
- Авторизуйтесь в системе
- Перейдите на страницу "Аналитика"
- Проверьте индикатор "MQTT подключен" (зеленый)

## Тестирование

### 1. Проверка статуса через API

```bash
# Получите токен после авторизации
TOKEN="your_jwt_token"

# Проверка статуса
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/v1/analytics/mqtt/status
```

### 2. Запрос обновления данных

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/v1/analytics/mqtt/update
```

### 3. Проверка конфигурации

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/v1/analytics/mqtt/config
```

## Что должно работать

- ✅ Страница "Аналитика" загружается
- ✅ Индикатор "MQTT подключен" зеленый
- ✅ Отображаются 3 карточки метаданных (проходов, зданий, период)
- ✅ Отображаются 5 виджетов:
  1. Общая динамика проходов (Area chart)
  2. Топ-10 зданий (Bar chart)
  3. Сравнение корпусов (Line chart)
  4. Распределение по типам (Pie chart)
  5. Активность по дням недели (Bar chart)
- ✅ Кнопка "Обновить" работает
- ✅ Кнопка "Экспорт" создает Excel файл

## Возможные проблемы

### WebSocket не подключается

**Симптомы:** Индикатор "MQTT отключен" (серый)

**Решение:**
1. Проверьте backend логи
2. Проверьте `VITE_API_URL` в frontend `.env`
3. Проверьте firewall/CORS

### Нет данных в графиках

**Симптомы:** Виджеты пустые, "Нет данных"

**Решение:**
1. Проверьте БД СКУД содержит данные в таблице `AcessEvent`
2. Проверьте backend логи на SQL ошибки
3. Нажмите "Обновить" на странице

### MQTT брокер не подключается

**Симптомы:** Backend логи показывают ошибки MQTT

**Решение:**
1. Запустите: `mosquitto -v`
2. Проверьте порт 1883 открыт: `netstat -an | grep 1883`
3. Проверьте `MQTT_BROKER` в `.env`

## Структура файлов

```
backend/
├── src/
│   ├── services/
│   │   └── analytics-mqtt.service.js  ✅ Новый
│   ├── websocket/
│   │   └── analytics.ws.js            ✅ Новый
│   ├── routes/
│   │   └── analytics.routes.js        ✅ Обновлен
│   └── server.js                       ✅ Обновлен
├── .env.example                        ✅ Новый
└── ANALYTICS_MQTT_README.md            ✅ Новый

frontend/
├── hooks/
│   └── useAnalyticsMQTT.ts             ✅ Новый
└── components/
    └── AnalyticsPage.tsx                ✅ Обновлен
```

## 🎯 Готово!

Если все пункты выполнены - система работает корректно!
