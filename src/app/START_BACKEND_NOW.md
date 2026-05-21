# 🚨 СРОЧНО: Как запустить backend

## Ваша ошибка:
```
WebSocket connection to 'ws://localhost:3000/ws/mqtt' failed: 
Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

## Причина:
**Backend сервер не запущен!**

---

## ✅ Решение за 3 команды:

### 1️⃣ Перейдите в директорию backend:
```bash
cd backend
```

### 2️⃣ Установите зависимости (если еще не установлены):
```bash
npm install
```

### 3️⃣ Запустите backend:
```bash
npm run dev
```

---

## 📊 Что вы должны увидеть:

```
✅ Подключено к MySQL
🔄 Обновление прав доступа...
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
📡 API: http://localhost:3000/v1
🏥 Health: http://localhost:3000/health
[WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
```

---

## ✅ После этого:

1. **Обновите страницу** в браузере (F5)
2. **Проверьте консоль** (F12):
   - Должны увидеть: `[WebSocket] ✅ Подключено`

---

## ❌ Всё ещё ошибки?

### Проблема с MySQL?
```bash
# Проверьте, что MySQL запущен
sudo systemctl status mysql     # Linux
brew services list | grep mysql # Mac
net start MySQL                 # Windows
```

### Проблема с портом 3000 (занят)?
```bash
# Linux/Mac - убить процесс на порту 3000
lsof -ti:3000 | xargs kill -9

# Windows
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a
```

### Нет файла .env?
```bash
cd backend
cp .env.example .env
nano .env  # или notepad .env на Windows
```

---

## 📚 Дополнительная помощь:

- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - Полное руководство
- **[QUICKSTART.md](QUICKSTART.md)** - Быстрый старт
- **Автоматический скрипт:**
  ```bash
  # Linux/Mac
  ./start-backend.sh
  
  # Windows
  start-backend.bat
  ```

---

**Готово! Backend запущен! 🎉**

Теперь обновите страницу frontend и проверьте, что WebSocket подключился.
