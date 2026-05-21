# 🚨 Исправление ошибки "Unexpected token '<', "<!DOCTYPE "..."

## ❌ Ошибка:
```
API Request Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
❌ Login error: Error: Не удалось подключиться к серверу
```

## 🎯 Причина:
Сервер возвращает **HTML страницу** вместо **JSON API ответа**.

Это происходит когда:
1. **Backend не запущен** - API не отвечает, браузер получает 404 HTML страницу
2. **Неправильный API URL** - запрос идёт не на тот адрес
3. **Backend на другой машине** - но `.env` файл не настроен

---

## ✅ Решение (проверяйте по порядку):

### Шаг 1: Проверьте консоль браузера (F12)

Откройте **Developer Tools (F12)** → вкладка **Console**.

Найдите строки:
```
🌐 Using API URL from env: ...
🌐 Full URL: ...
📡 Response status: ...
📡 Response content-type: ...
```

**Что вы видите?**

#### Вариант А: `🌐 Using relative API URL: /v1`
```
🌐 Using relative API URL: /v1
🌐 Full URL: /v1/auth/login
📡 Response status: 404
📡 Response content-type: text/html
```

**Проблема:** Backend не запущен или работает на другой машине!

**Решение:** → Переходите к **Шагу 2**

---

#### Вариант Б: `🌐 Using API URL from env: http://...`
```
🌐 Using API URL from env: http://192.168.1.100:3000/v1
🌐 Full URL: http://192.168.1.100:3000/v1/auth/login
📡 Response status: 0 (или ошибка CORS)
```

**Проблема:** Backend недоступен по указанному адресу!

**Решение:** → Переходите к **Шагу 3**

---

### Шаг 2: Настройте API URL (Backend на другой машине)

#### 2.1. Узнайте IP backend сервера

На машине где запущен backend, выполните:

```bash
# Linux/Mac
hostname -I

# Windows
ipconfig

# Найдите IPv4 адрес, например: 192.168.1.100
```

#### 2.2. Создайте файл `.env` в корне frontend

```bash
# В корневой папке проекта (где package.json)
nano .env
```

Добавьте:

```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

**Замените `192.168.1.100` на реальный IP вашего backend!**

#### 2.3. Перезапустите frontend

```bash
# Остановите (Ctrl+C)
npm run dev
```

#### 2.4. Проверьте снова в консоли (F12)

Должно быть:
```
🌐 Using API URL from env: http://192.168.1.100:3000/v1
🌐 Full URL: http://192.168.1.100:3000/v1/auth/login
📡 Response status: 200
📡 Response content-type: application/json
```

✅ **Если status: 200 и content-type: application/json** - всё работает!

❌ **Если status: 0 или ошибка** - переходите к **Шагу 3**

---

### Шаг 3: Проверьте что backend запущен и доступен

#### 3.1. На машине с backend

```bash
# Проверьте что процесс запущен
ps aux | grep node   # Linux/Mac
tasklist | findstr node   # Windows

# Или проверьте что порт 3000 занят
lsof -i :3000   # Linux/Mac
netstat -ano | findstr :3000   # Windows
```

**Ничего не найдено?** → Backend не запущен!

```bash
cd backend
npm run dev
```

#### 3.2. С машины frontend - проверьте доступность

```bash
# Проверьте что сервер доступен
ping 192.168.1.100

# Проверьте API
curl http://192.168.1.100:3000/health

# Должен вернуть JSON:
# {"success":true,"message":"API is running"}
```

**Получили ошибку?** → Проблема с сетью или firewall!

---

### Шаг 4: Настройте firewall и CORS (если нужно)

#### 4.1. Откройте порт на backend машине

**Linux:**
```bash
sudo ufw allow 3000/tcp
sudo ufw status
```

**Windows:**
1. Откройте **Windows Defender Firewall**
2. **Advanced Settings** → **Inbound Rules**
3. **New Rule** → **Port** → **TCP 3000**

#### 4.2. Настройте CORS на backend

В `/backend/.env`:

```env
# Добавьте IP frontend машины
CORS_ORIGIN=http://192.168.1.101:5173,http://localhost:5173
CORS_CREDENTIALS=true
```

Перезапустите backend:

```bash
cd backend
npm run dev
```

---

### Шаг 5: Проверьте nginx/reverse proxy (если используется)

Если вы используете Nginx для проксирования:

```nginx
# /etc/nginx/sites-available/tyumgu-security
location /v1/ {
    proxy_pass http://localhost:3000/v1/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Перезагрузите nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Диагностическая таблица

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Using relative API URL: /v1` + status 404 | Backend не запущен | Шаг 3.1 |
| `Using relative API URL: /v1` + status 404 | Backend на другой машине | Шаг 2 |
| `Using API URL from env` + status 0 | Backend недоступен | Шаг 3.2 + 4 |
| `Using API URL from env` + CORS error | CORS не настроен | Шаг 4.2 |
| `Response content-type: text/html` | Nginx возвращает 404 | Шаг 5 |
| `Response content-type: application/json` | ✅ Всё работает! | 🎉 |

---

## 🔍 Полезные команды для диагностики

### Проверка API с curl:

```bash
# Health check
curl http://localhost:3000/health
curl http://192.168.1.100:3000/health

# Login test
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Должен вернуть JSON с token
```

### Проверка WebSocket:

```bash
# Установите websocat
cargo install websocat  # или brew install websocat

# Подключитесь
websocat ws://localhost:3000/ws/mqtt?token=YOUR_TOKEN
```

### Проверка портов:

```bash
# Linux/Mac
netstat -tulpn | grep 3000
lsof -i :3000

# Windows
netstat -ano | findstr 3000
```

---

## 🎯 Быстрое решение (копировать и выполнить)

```bash
# 1. Узнайте IP backend
hostname -I   # Linux/Mac
ipconfig      # Windows

# 2. Создайте .env
echo "VITE_API_URL=http://ВАШ_BACKEND_IP:3000/v1" > .env

# 3. Замените IP
nano .env

# 4. Перезапустите frontend
npm run dev

# 5. Проверьте backend запущен
cd backend
npm run dev

# 6. Проверьте доступность API
curl http://ВАШ_BACKEND_IP:3000/health
```

---

## ✅ Контрольный чек-лист:

- [ ] Backend запущен (`npm run dev` в `/backend`)
- [ ] Порт 3000 открыт (firewall)
- [ ] Файл `.env` создан с правильным `VITE_API_URL`
- [ ] Frontend перезапущен после создания `.env`
- [ ] Консоль показывает правильный API URL
- [ ] curl возвращает JSON (не HTML)
- [ ] CORS настроен (если backend на другой машине)

---

## 📚 Связанные документы:

- **[FIX_REMOTE_BACKEND.md](FIX_REMOTE_BACKEND.md)** - Полное руководство для удалённого backend
- **[FOR_YOUR_SITUATION.md](FOR_YOUR_SITUATION.md)** - Краткая инструкция
- **[START_BACKEND_NOW.md](START_BACKEND_NOW.md)** - Как запустить backend
- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - WebSocket ошибки

---

**После выполнения всех шагов ошибка должна исчезнуть! 🎉**
