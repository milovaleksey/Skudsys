# ⚡ БЫСТРОЕ РЕШЕНИЕ

## Ваша ошибка:
```
❌ Unexpected token '<', "<!DOCTYPE "... is not valid JSON
❌ Login error: Не удалось подключиться к серверу
```

---

## ✅ Решение за 3 шага:

### 1️⃣ Backend запущен?

```bash
# Терминал 1: Запустите backend
cd backend
npm run dev

# Должно быть:
# ✅ Подключено к MySQL
# 🚀 Сервер запущен на порту 3000
```

✅ **Backend запущен** → Переходите к шагу 3  
❌ **Backend НЕ запущен** → Запустите и переходите к шагу 3

---

### 2️⃣ Backend на другой машине?

**Если backend работает на другой машине (не localhost):**

```bash
# Узнайте IP backend (на машине с backend)
hostname -I

# Создайте .env в корне frontend
echo "VITE_API_URL=http://IP_BACKEND:3000/v1" > .env

# Отредактируйте IP
nano .env
```

**Пример `.env`:**
```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

---

### 3️⃣ Перезапустите frontend

```bash
# Остановите (Ctrl+C)
# Запустите снова
npm run dev
```

---

## 🔍 Проверка (F12 в браузере):

Консоль должна показать:

```
✅ Правильно:
🌐 Using API URL from env: http://192.168.1.100:3000/v1
🌐 Full URL: http://192.168.1.100:3000/v1/auth/login
📡 Response status: 200
📡 Response content-type: application/json

❌ Неправильно:
📡 Response status: 404
📡 Response content-type: text/html
```

Если **text/html** → Backend не доступен!

---

## 🆘 Не помогло?

### Проверьте API вручную:

```bash
# С той машины где frontend
curl http://localhost:3000/health
  (или)
curl http://IP_BACKEND:3000/health

# Должно вернуть JSON:
# {"success":true,"message":"API is running"}
```

**Получили HTML или ошибку?**

1. Backend не запущен → Запустите `cd backend && npm run dev`
2. Firewall блокирует → `sudo ufw allow 3000/tcp` (Linux)
3. Неправильный IP в `.env` → Проверьте IP командой `hostname -I`

---

## 📚 Подробная документация:

- **[FIX_JSON_ERROR.md](FIX_JSON_ERROR.md)** - Полное руководство
- **[FIX_REMOTE_BACKEND.md](FIX_REMOTE_BACKEND.md)** - Backend на другой машине
- **[START_BACKEND_NOW.md](START_BACKEND_NOW.md)** - Запуск backend

---

## 🎯 Итого:

1. ✅ Backend запущен → `cd backend && npm run dev`
2. ✅ Если на другой машине → Создайте `.env` с `VITE_API_URL`
3. ✅ Перезапустите frontend → `npm run dev`
4. ✅ Проверьте в консоли (F12) → Должен быть JSON, не HTML

**Готово! 🎉**
