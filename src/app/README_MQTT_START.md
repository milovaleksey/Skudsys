# 🚀 MQTT WebSocket - Быстрый старт

> **⚡ Текущая проблема:** `WebSocket ERR_CONNECTION_REFUSED`  
> **✅ Решение:** Backend не запущен. Запустите за 3 команды!

---

## 🎯 Быстрое решение (3 команды):

```bash
# 1. Перейдите в backend
cd backend

# 2. Установите зависимости (если нужно)
npm install

# 3. Запустите backend
npm run dev
```

**Вы должны увидеть:**
```
✅ Подключено к MySQL
🚀 Сервер запущен на порту 3000
[WebSocket] MQTT WebSocket сервер запущен
```

**После этого:** Обновите страницу в браузере (F5)

---

## 📚 Полная документация

| Документ | Описание |
|----------|----------|
| **[DO_THIS_NOW.md](DO_THIS_NOW.md)** ⚡ | Что делать прямо сейчас (начните здесь!) |
| **[START_BACKEND_NOW.md](START_BACKEND_NOW.md)** 🚨 | Подробная инструкция запуска backend |
| **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** 🔧 | Полное руководство по устранению ошибок |
| **[QUICKSTART.md](QUICKSTART.md)** 🚀 | Быстрый старт всего проекта |
| **[NAVIGATION_MAP.md](NAVIGATION_MAP.md)** 🗺️ | Карта навигации по документации |
| **[README_SUMMARY.md](README_SUMMARY.md)** ✅ | Краткое резюме изменений |

---

## 🛠️ Автоматические скрипты

**Linux/Mac:**
```bash
chmod +x start-backend.sh
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

Скрипты автоматически:
- ✅ Проверят зависимости
- ✅ Проверят MySQL подключение  
- ✅ Остановят зависшие процессы
- ✅ Запустят backend

---

## ❌ Всё ещё не работает?

### MySQL не подключается?
```bash
# Проверьте, запущена ли MySQL
sudo systemctl status mysql     # Linux
brew services list | grep mysql # Mac
net start MySQL                 # Windows
```

### Порт 3000 занят?
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a
```

### Нет файла .env?
```bash
cd backend
cp .env.example .env
nano .env  # отредактируйте настройки БД
```

---

## ✅ Проверка работы

После запуска backend откройте в браузере:
- **Health Check:** http://localhost:3000/health
- **API:** http://localhost:3000/v1
- **Frontend:** http://localhost:5173

Консоль браузера (F12) должна показать:
```
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

---

## 📞 Дополнительная помощь

- **Навигация:** [NAVIGATION_MAP.md](NAVIGATION_MAP.md)
- **Все документы:** [DOCS_INDEX.md](DOCS_INDEX.md)
- **История изменений:** [CHANGELOG_MQTT.md](CHANGELOG_MQTT.md)

---

**Готово! Backend запущен, WebSocket подключен! 🎉**
