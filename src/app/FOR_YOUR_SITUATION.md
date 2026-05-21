# 🎯 Для вашей ситуации: Backend на удалённом сервере

## ✅ Что было сделано:

1. **Исправлен код WebSocket** в `/hooks/useMQTT.ts`
   - Теперь использует `VITE_API_URL` вместо жёсткого `localhost`
   - Автоматически определяет правильный протокол (ws/wss)
   - Работает с любым расположением backend

2. **Создан пример `.env.example`**
   - Показывает как настроить переменную окружения

---

## 🚀 Что нужно сделать СЕЙЧАС:

### 1️⃣ Узнайте IP-адрес вашего backend сервера

На машине где работает backend, выполните:

```bash
# Linux
hostname -I

# Windows
ipconfig

# Mac
ifconfig | grep "inet "
```

Например, получите: `192.168.1.100`

---

### 2️⃣ Создайте файл `.env` на машине с frontend

```bash
# В корневой папке проекта (где находится package.json)
nano .env
```

Добавьте:

```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

**Замените `192.168.1.100` на реальный IP вашего backend!**

---

### 3️⃣ Перезапустите frontend

```bash
# Остановите текущий процесс (Ctrl+C)

# Запустите заново
npm run dev
```

---

### 4️⃣ Проверьте в консоли браузера

Откройте консоль (F12) и проверьте:

```javascript
// 1. Проверьте переменную окружения
console.log(import.meta.env.VITE_API_URL);
// Должно вывести: http://192.168.1.100:3000/v1
```

Затем посмотрите логи WebSocket:

```
[WebSocket] Подключение к ws://192.168.1.100:3000/ws/mqtt?token=...
[WebSocket] ✅ Подключено
```

**Теперь должен быть ваш IP вместо localhost!**

---

## ✅ Готово!

WebSocket теперь будет подключаться к правильному серверу!

---

## 📚 Дополнительная информация:

- **[FIX_REMOTE_BACKEND.md](FIX_REMOTE_BACKEND.md)** - Подробное руководство
- **[DO_THIS_NOW.md](DO_THIS_NOW.md)** - Быстрый старт
- **[WEBSOCKET_ERROR_FIX.md](WEBSOCKET_ERROR_FIX.md)** - Все ошибки WebSocket

---

## ⚠️ Возможные проблемы:

### CORS ошибка?

На backend машине, в файле `/backend/.env`:

```env
# Добавьте IP frontend машины
CORS_ORIGIN=http://192.168.1.101:5173,http://localhost:5173
CORS_CREDENTIALS=true
```

Перезапустите backend.

### Firewall блокирует?

На backend машине:

```bash
# Linux
sudo ufw allow 3000/tcp

# Windows - откройте порт 3000 в Windows Defender Firewall
```

### Backend не доступен?

Проверьте с frontend машины:

```bash
# Проверьте доступность
ping 192.168.1.100

# Проверьте API
curl http://192.168.1.100:3000/health
```

---

**Теперь всё должно работать! 🎉**
