# 🎯 ЧТО ДЕЛАТЬ ПРЯМО СЕЙЧАС

## Какая у вас проблема?

### ❌ Ошибка: "Unexpected token '<', "<!DOCTYPE"... is not valid JSON"

→ См. **[FIX_JSON_ERROR.md](FIX_JSON_ERROR.md)** 📋

**Краткое решение:**
1. Backend запущен? → `cd backend && npm run dev`
2. Backend на другой машине? → Создайте `.env` с `VITE_API_URL=http://IP:3000/v1`
3. Перезапустите frontend: `npm run dev`

---

### ❌ Ошибка: WebSocket connection failed: ERR_CONNECTION_REFUSED

→ См. **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** 🔧

---

## ⚠️ ВАЖНО: Backend на другой машине?

**Если ваш backend сервер находится на другой машине (не localhost):**

→ См. **[FIX_REMOTE_BACKEND.md](FIX_REMOTE_BACKEND.md)** 🌐

**Краткое решение:**
1. Создайте файл `.env` в корне проекта
2. Добавьте: `VITE_API_URL=http://IP_ВАШЕГО_СЕРВЕРА:3000/v1`
3. Перезапустите frontend: `npm run dev`

---

## Решение для localhost (3 команды):

### 1️⃣ Откройте новый терминал

### 2️⃣ Перейдите в backend:
```bash
cd backend
```

### 3️⃣ Запустите backend:
```bash
npm run dev
```

## Ожидайте этот вывод:
```
✅ Подключено к MySQL
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
[WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
```

## После этого:
1. Вернитесь в браузер
2. Обновите страницу (F5)
3. Откройте консоль (F12)
4. Должны увидеть: `[WebSocket] ✅ Подключено`

---

## ❌ Ошибка при запуске?

### MySQL не подключается?
```bash
# Проверьте, что MySQL запущена
sudo systemctl status mysql
```

### Порт 3000 занят?
```bash
# Убейте процесс
lsof -ti:3000 | xargs kill -9
# Попробуйте снова
npm run dev
```

### Нет файла .env?
```bash
# В папке backend
cp .env.example .env
nano .env
# Настройте DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
```

---

## 📚 Полная документация:
- [START_BACKEND_NOW.md](START_BACKEND_NOW.md) - Подробная инструкция
- [WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md) - Полное руководство
- [DOCS_INDEX.md](DOCS_INDEX.md) - Вся документация

---

**Просто запустите backend!** 🚀