# ❌ Ошибка: WebSocket ERR_CONNECTION_REFUSED

## 🔍 Диагностика

Ошибка `WebSocket connection to 'ws://localhost:3000/ws/mqtt' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED` означает, что **backend сервер не запущен или недоступен**.

---

## ✅ Решение (пошагово)

### Шаг 1: Проверьте, запущен ли backend

#### Linux/Mac:
```bash
lsof -i :3000
```

#### Windows:
```cmd
netstat -ano | findstr :3000
```

**Если ничего не выводится** → backend не запущен, переходите к Шагу 2.

**Если процесс найден** → backend должен работать. Проверьте логи.

---

### Шаг 2: Запустите backend

#### Вариант A: Автоматический запуск (рекомендуется)

**Linux/Mac:**
```bash
chmod +x start-backend.sh
./start-backend.sh
```

**Windows:**
```cmd
start-backend.bat
```

Скрипт автоматически:
- ✅ Проверит наличие зависимостей
- ✅ Проверит подключение к MySQL
- ✅ Остановит зависший процесс (если есть)
- ✅ Запустит backend сервер

#### Вариант B: Ручной запуск

```bash
cd backend

# Установите зависимости (если еще не установлены)
npm install

# Проверьте .env файл
ls -la .env  # Linux/Mac
dir .env     # Windows

# Запустите сервер
npm run dev
```

---

### Шаг 3: Проверьте вывод консоли

**Успешный запуск выглядит так:**

```
✅ Подключено к MySQL
🔄 Обновление прав доступа...
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
📡 API: http://localhost:3000/v1
🏥 Health: http://localhost:3000/health
[WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
🔌 Подключение к MQTT брокеру...
```

**Если видите ошибки:**

#### ❌ `Error: connect ECONNREFUSED` (MySQL)
```bash
# Проверьте, запущен ли MySQL
sudo systemctl status mysql     # Linux
brew services list              # Mac
net start MySQL                 # Windows

# Проверьте настройки в backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=utmn_security
```

#### ❌ `Error: ER_ACCESS_DENIED_ERROR`
```bash
# Неверные учетные данные MySQL
# Проверьте DB_USER и DB_PASSWORD в .env
```

#### ❌ `Error: ER_BAD_DB_ERROR`
```bash
# База данных не существует
# Создайте базу данных:
mysql -u root -p
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

#### ⚠️ `MQTT ❌ Ошибка подключения: connect ECONNREFUSED 127.0.0.1:1883`
Это **нормально** если у вас не установлен MQTT брокер.
- Система будет работать в режиме REST API
- WebSocket всё равно подключится
- Для установки Mosquitto см. ниже

---

### Шаг 4: Проверьте подключение

#### A. Проверьте Health endpoint

```bash
curl http://localhost:3000/health
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "API работает",
  "timestamp": "2026-02-25T...",
  "version": "v1"
}
```

#### B. Откройте frontend

```bash
# В новом терминале
npm run dev
```

Откройте http://localhost:5173

#### C. Проверьте консоль браузера (F12)

**Успешное подключение:**
```
[WebSocket] Подключение к ws://localhost:3000/ws/mqtt?token=...
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

**Если всё равно ошибка:**
```
[WebSocket] ❌ Ошибка: Event {type: 'error', ...}
```

Переходите к Шагу 5.

---

### Шаг 5: Расширенная диагностика

#### Проверьте firewall/антивирус

**Windows:**
```cmd
# Разрешите Node.js через Windows Defender Firewall
# Настройки → Обновление и безопасность → Безопасность Windows → Брандмауэр
```

**Linux:**
```bash
# Проверьте ufw
sudo ufw status
sudo ufw allow 3000/tcp
```

#### Проверьте CORS настройки

В `/backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
CORS_CREDENTIALS=true
```

#### Проверьте порт frontend

В `/vite.config.ts` или консоли Vite должен быть порт 5173.

Если другой порт (например 5174), обновите CORS_ORIGIN.

#### Проверьте API_URL в frontend

В `/lib/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
```

Должен указывать на `http://localhost:3000/v1` или `/v1` для production.

---

## 🔧 Установка MQTT брокера (опционально)

MQTT брокер нужен только для live обновлений из внешних систем.

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### macOS:
```bash
brew install mosquitto
brew services start mosquitto
```

### Windows:
1. Скачайте: https://mosquitto.org/download/
2. Установите
3. Запустите: `net start mosquitto`

### Проверка:
```bash
mosquitto_pub -h localhost -t "test" -m "hello"
mosquitto_sub -h localhost -t "test"
```

---

## 📝 Чеклист

- [ ] Backend запущен на порту 3000
- [ ] MySQL подключена и база данных существует
- [ ] Файл `/backend/.env` настроен правильно
- [ ] `npm install` выполнен в `/backend`
- [ ] Health endpoint отвечает: http://localhost:3000/health
- [ ] Frontend запущен и открыт в браузере
- [ ] В консоли браузера видно `[WebSocket] ✅ Подключено`

---

## 🆘 Всё ещё не работает?

### Полный перезапуск

```bash
# 1. Остановите всё
# Ctrl+C в терминале backend
# Ctrl+C в терминале frontend

# 2. Убейте процессы на портах
# Linux/Mac:
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows:
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %a

# 3. Очистите node_modules (если нужно)
cd backend
rm -rf node_modules package-lock.json
npm install

cd ..
rm -rf node_modules package-lock.json
npm install

# 4. Перезапустите
./start-backend.sh  # или start-backend.bat
# В новом терминале:
npm run dev
```

### Логи для отладки

**Backend логи:**
```bash
cd backend
npm run dev 2>&1 | tee backend.log
```

**Frontend консоль браузера:**
- Нажмите F12
- Вкладка Console
- Скопируйте все ошибки красного цвета

### Где искать помощь

1. **QUICKSTART.md** - Быстрый старт
2. **MQTT_FIXES.md** - Подробная документация исправлений
3. **README_MQTT.md** - Архитектура системы

---

**Успехов! 🚀**
