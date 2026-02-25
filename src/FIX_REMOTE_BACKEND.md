# 🔧 РЕШЕНИЕ: Backend на другой машине

## 🎯 Проблема

WebSocket пытается подключиться к `ws://localhost:3000/ws/mqtt`, но backend находится на **другой машине**.

## ✅ Решение (2 шага)

### Шаг 1: Создайте файл `.env` в корне проекта

```bash
# В корневой папке проекта (где package.json)
nano .env
```

### Шаг 2: Добавьте URL вашего backend сервера

```env
# Замените IP-адрес на адрес вашего backend сервера
VITE_API_URL=http://192.168.1.100:3000/v1
```

**Примеры:**

```env
# Локальная сеть
VITE_API_URL=http://192.168.1.100:3000/v1

# Доменное имя
VITE_API_URL=https://api.tyumgu.ru/v1

# Localhost (для разработки на одной машине)
VITE_API_URL=http://localhost:3000/v1
```

### Шаг 3: Перезапустите frontend

```bash
# Остановите текущий процесс (Ctrl+C)
# Запустите заново
npm run dev
```

---

## 🔍 Как это работает?

### До исправления:
- WebSocket всегда подключался к `localhost:3000`
- Не работало если backend на другой машине

### После исправления:
- WebSocket берет URL из переменной `VITE_API_URL`
- Автоматически определяет протокол (ws/wss)
- Работает с любым расположением backend

---

## 📝 Примеры конфигураций

### 1. Backend и frontend на разных машинах (локальная сеть)

**Backend машина:** `192.168.1.100:3000`  
**Frontend машина:** `192.168.1.101:5173`

**Файл `.env` на frontend:**
```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

### 2. Production с доменным именем

**Backend:** `api.tyumgu.ru` (HTTPS на порту 443)  
**Frontend:** `security.tyumgu.ru`

**Файл `.env`:**
```env
VITE_API_URL=https://api.tyumgu.ru/v1
```

### 3. Production с Nginx reverse proxy

**Nginx проксирует `/api/*` на backend**

**Файл `.env`:**
```env
# Пустое значение = использовать относительный путь
VITE_API_URL=
```

Или просто не создавайте `.env` файл.

### 4. Разработка на одной машине

**Backend:** `localhost:3000`  
**Frontend:** `localhost:5173`

**Файл `.env`:**
```env
VITE_API_URL=http://localhost:3000/v1
```

---

## ✅ Проверка

### 1. Проверьте переменную окружения

Откройте консоль браузера (F12) и выполните:

```javascript
console.log(import.meta.env.VITE_API_URL);
```

Должен вывести ваш URL, например: `http://192.168.1.100:3000/v1`

### 2. Проверьте WebSocket URL

В консоли должны увидеть:

```
[WebSocket] Подключение к ws://192.168.1.100:3000/ws/mqtt?token=...
```

Вместо `localhost` должен быть IP вашего сервера.

### 3. Проверьте подключение

Если всё правильно:

```
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

---

## ❌ Типичные ошибки

### Ошибка 1: Файл .env не читается

**Причина:** Файл создан в неправильном месте

**Решение:** Убедитесь что `.env` находится в **корневой папке проекта**, рядом с `package.json`

```
/
├── .env                    ← ЗДЕСЬ!
├── package.json
├── vite.config.ts
├── backend/
└── components/
```

### Ошибка 2: Изменения не применяются

**Причина:** Vite не перезагрузил переменные

**Решение:** 
1. Остано��ите dev сервер (Ctrl+C)
2. Запустите снова: `npm run dev`

### Ошибка 3: CORS ошибка

**Причина:** Backend не разрешает запросы с вашего frontend

**Решение:** Настройте CORS на backend

В `/backend/.env`:
```env
CORS_ORIGIN=http://192.168.1.101:5173,http://localhost:5173
CORS_CREDENTIALS=true
```

Перезапустите backend.

### Ошибка 4: ERR_CONNECTION_REFUSED

**Причины:**
1. Backend не запущен
2. Firewall блокирует порт 3000
3. Неправильный IP-адрес

**Решение:**

```bash
# 1. Проверьте что backend запущен
curl http://192.168.1.100:3000/health

# 2. Проверьте firewall (на машине с backend)
# Linux:
sudo ufw allow 3000/tcp

# 3. Проверьте правильность IP
ping 192.168.1.100
```

---

## 🔥 Быстрое решение (копировать и выполнить)

```bash
# 1. Узнайте IP вашего backend сервера
# На машине с backend выполните:
hostname -I   # Linux
ipconfig      # Windows

# 2. Создайте .env файл
cat > .env << 'EOF'
VITE_API_URL=http://ВАШ_IP:3000/v1
EOF

# 3. Замените ВАШ_IP на реальный IP
nano .env

# 4. Перезапустите frontend
npm run dev
```

---

## 📞 Дополнительная информация

- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - Другие проблемы с WebSocket
- **[QUICKSTART.md](QUICKSTART.md)** - Полный запуск проекта
- **[DO_THIS_NOW.md](DO_THIS_NOW.md)** - Быстрая помощь

---

**Теперь WebSocket подключится к правильному серверу! 🎉**
