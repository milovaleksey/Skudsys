# 📖 Навигация по документации

## 🚨 Срочно нужна помощь?

### ❌ Backend не запускается / WebSocket не подключается?
→ **[START_BACKEND_NOW.md](START_BACKEND_NOW.md)** ⚡ Решение за 3 команды!

### ❌ ERR_CONNECTION_REFUSED?
→ **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** 🔧 Полное руководство

---

## 📚 Документация по разделам

### 🚀 Быстрый старт
- **[QUICKSTART.md](QUICKSTART.md)** - Запуск за 4 шага
- **[START_BACKEND_NOW.md](START_BACKEND_NOW.md)** - Только backend за 3 команды

### 🔧 Устранение неполадок
- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - Ошибки WebSocket подключения
- **[MQTT_FIXES.md](MQTT_FIXES.md)** - Все исправления с примерами тестирования

### 📋 Справочная информация
- **[CHANGELOG_MQTT.md](CHANGELOG_MQTT.md)** - Детальный лист изменений
- **[README_MQTT.md](README_MQTT.md)** - Архитектура и API (если есть)
- **[MQTT_SETUP.md](MQTT_SETUP.md)** - Настройка MQTT брокера (если есть)

---

## 🎯 Что нового?

### ✅ Исправлено (25.02.2026):
1. ✅ Импорты middleware в backend
2. ✅ Экспорт `apiRequest` в API
3. ✅ Пути к MQTT API
4. ✅ Права доступа `mqtt-publish`
5. ✅ Автоматические скрипты запуска

### ✨ Добавлено:
- 🤖 Автоматический скрипт `start-backend.sh` (Linux/Mac)
- 🤖 Автоматический скрипт `start-backend.bat` (Windows)
- 📝 Подробная документация troubleshooting
- 🔧 Скрипт добавления прав доступа

---

## 📦 Структура проекта

```
/
├── backend/                        # Backend сервер (Node.js + Express)
│   ├── src/
│   │   ├── controllers/           # API контроллеры
│   │   ├── routes/                # API маршруты
│   │   ├── services/              # Бизнес-логика
│   │   ├── middleware/            # Express middleware
│   │   ├── websocket/             # WebSocket сервер
│   │   └── server.js              # Точка входа
│   ├── add-mqtt-permissions.js    # Скрипт прав доступа
│   ├── .env.example               # Пример конфигурации
│   └── .env.mqtt.example          # Пример MQTT конфигурации
│
├── lib/                            # Frontend утилиты
│   └── api.ts                     # API клиент
│
├── hooks/                          # React hooks
│   └── useMQTT.ts                 # MQTT WebSocket hook
│
├── components/                     # React компоненты
│
├── start-backend.sh               # Автозапуск (Linux/Mac)
├── start-backend.bat              # Автозапуск (Windows)
│
└── Документация:
    ├── START_BACKEND_NOW.md       # 🚨 Срочная помощь
    ├── WEBSOCKET_ERROR_FIX.md     # 🔧 Troubleshooting
    ├── QUICKSTART.md              # 🚀 Быстрый старт
    ├── MQTT_FIXES.md              # 📝 Детальное описание
    ├── CHANGELOG_MQTT.md          # 📋 История изменений
    └── DOCS_INDEX.md              # 📖 Этот файл
```

---

## ⚡ Быстрые команды

### Запуск всего проекта:

```bash
# Терминал 1: Backend
cd backend
npm install
npm run dev

# Терминал 2: Frontend
npm install
npm run dev

# Или автоматически:
./start-backend.sh    # Linux/Mac
start-backend.bat     # Windows
```

### Добавить MQTT права:
```bash
cd backend
node add-mqtt-permissions.js
```

### Проверка здоровья:
```bash
# API
curl http://localhost:3000/health

# MySQL
mysql -u root -p -e "SELECT 1"

# MQTT (если установлен)
mosquitto_pub -h localhost -t "test" -m "hello"
```

---

## 🔍 Поиск по документации

| Ищете... | Документ |
|----------|----------|
| Как запустить backend | [START_BACKEND_NOW.md](START_BACKEND_NOW.md) |
| Backend не подключается | [WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md) |
| Быстрый старт всего проекта | [QUICKSTART.md](QUICKSTART.md) |
| Что было исправлено | [CHANGELOG_MQTT.md](CHANGELOG_MQTT.md) |
| Тестирование MQTT | [MQTT_FIXES.md](MQTT_FIXES.md) |
| Структура API | [README_MQTT.md](README_MQTT.md) |
| Установка Mosquitto | [WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md) |

---

## 💡 Полезные ссылки

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/v1
- **Health Check**: http://localhost:3000/health
- **WebSocket**: ws://localhost:3000/ws/mqtt

---

## 🆘 Часто задаваемые вопросы

### Q: Backend не запускается?
**A:** См. [START_BACKEND_NOW.md](START_BACKEND_NOW.md) - решение за 3 команды.

### Q: WebSocket не подключается?
**A:** Убедитесь, что backend запущен. См. [WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)

### Q: Нужен ли MQTT брокер?
**A:** Нет, система работает без него через REST API. MQTT нужен только для live обновлений.

### Q: Как добавить права доступа?
**A:** Запустите `node backend/add-mqtt-permissions.js`

### Q: Порт 3000 занят?
**A:** 
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a
```

---

## 📞 Техподдержка

Если документация не помогла:

1. Проверьте логи backend (терминал где запущен `npm run dev`)
2. Проверьте консоль браузера (F12 → Console)
3. Убедитесь что MySQL запущена
4. Проверьте `.env` файлы в `/backend`

---

**Удачи! 🚀**
