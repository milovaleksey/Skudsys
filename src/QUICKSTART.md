# 🚀 Быстрый старт после исправлений

## ✅ Что исправлено

1. **Экспорт `apiRequest`** в `/lib/api.ts`
2. **MQTT API методы** добавлены в `/lib/api.ts`
3. **Пути к API** исправлены в `/hooks/useMQTT.ts`
4. **Импорты middleware** исправлены в `/backend/src/routes/mqtt.routes.js`
5. **Права доступа** - скрипт для добавления `mqtt-publish`

## 📦 Установка и запуск

### Шаг 1: Добавьте права доступа MQTT

```bash
cd backend
node add-mqtt-permissions.js
```

### Шаг 2: Запустите Backend

```bash
cd backend
npm install  # если нужно
npm run dev
```

Должны увидеть:
```
✅ Подключено к MySQL
🚀 Сервер запущен на порту 3000
[WebSocket] MQTT WebSocket сервер запущен
```

### Шаг 3: Запустите Frontend

```bash
npm install  # если нужно
npm run dev
```

### Шаг 4: Откройте приложение

Перейдите по адресу: http://localhost:5173

## 🧪 Быстрый тест

### 1. Авторизуйтесь
- Логин/пароль вашего пользователя

### 2. Откройте консоль браузера (F12)

Должны увидеть:
```
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

### 3. (Опционально) Тест MQTT

Если установлен Mosquitto:

```bash
# Терминал 1: Публикация конфигурации
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "test1",
    "label": "Тест",
    "icon": "activity",
    "valueTopic": "test/value1",
    "color": "#00aeef"
  }
]'

# Терминал 2: Публикация значений
mosquitto_pub -h localhost -t "test/value1" -m "42"
```

Карточка появится на дашборде!

## ❓ Проблемы?

### ❌ WebSocket ERR_CONNECTION_REFUSED?

Это означает, что backend не запущен. См. **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** для подробного решения.

**Быстрое решение:**
```bash
# Linux/Mac
./start-backend.sh

# Windows
start-backend.bat
```

### ❌ Другие проблемы?

См. подробную документацию:
- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - Ошибки подключения WebSocket
- **MQTT_FIXES.md** - Полное описание исправлений и troubleshooting
- **README_MQTT.md** - Архитектура и API
- **MQTT_SETUP.md** - Детальная настройка

## 📞 Основные команды

```bash
# Backend
cd backend
npm run dev          # Запуск в режиме разработки
npm start            # Запуск в production
node add-mqtt-permissions.js  # Добавить права

# Frontend
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для production
npm run preview      # Предпросмотр production build

# MQTT (если установлен)
mosquitto_pub -h localhost -t "topic" -m "message"  # Публикация
mosquitto_sub -h localhost -t "topic"               # Подписка
```

---

**Готово! Система работает! 🎉**