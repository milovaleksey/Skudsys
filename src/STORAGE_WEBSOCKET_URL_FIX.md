# 🌐 Исправление WebSocket URL для Storage

## 🎯 Проблема

WebSocket подключается к `ws://localhost:3000/ws/storage`, но должен подключаться к серверу!

```
ws://localhost:3000/ws/storage?token=... failed: ERR_CONNECTION_REFUSED
```

## ✅ Решение

### Что было исправлено:

**В `/hooks/useStorageWebSocket.ts`:**

❌ **Было (хардкод):**
```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const wsUrl = `${WS_URL}/ws/storage?token=${token}`;
```

✅ **Стало (динамический URL):**
```typescript
// Получаем базовый URL API из переменной окружения
const apiUrl = import.meta.env.VITE_API_URL || '';

// Если VITE_API_URL задан полностью (http://... или https://...)
if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
  const url = new URL(apiUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUrl = `${protocol}//${url.host}/ws/storage?token=${token}`;
} 
// Если не задан - используем текущий хост с портом 3000
else {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  wsUrl = `${protocol}//${hostname}:3000/ws/storage?token=${token}`;
}
```

---

## 🚀 Как использовать:

### **Вариант 1: С VITE_API_URL (рекомендуется для отдельных машин)**

Создайте файл `.env` в корне **frontend**:

```bash
cd /var/www/utmn-security/debug/frontend
nano .env
```

Добавьте (замените IP на реальный IP сервера):
```env
VITE_API_URL=http://192.168.1.100:3000/v1
```

**WebSocket автоматически будет:**
```
ws://192.168.1.100:3000/ws/storage
```

---

### **Вариант 2: Без .env (для одной машины или Nginx)**

Если не создавать `.env`, WebSocket использует:
```typescript
window.location.hostname + ':3000'
```

Например:
- Если открыто `http://192.168.1.100:5173` → WebSocket: `ws://192.168.1.100:3000/ws/storage`
- Если открыто `http://localhost:5173` → WebSocket: `ws://localhost:3000/ws/storage`

---

## 📋 Пример конфигурации

### Сценарий 1: Frontend и Backend на одной машине
**Не нужен `.env`**, WebSocket автоматически возьмет hostname!

### Сценарий 2: Frontend и Backend на разных машинах

**Frontend машина** (где запущен Vite):
```bash
cd /var/www/utmn-security/debug/frontend
echo "VITE_API_URL=http://192.168.1.100:3000/v1" > .env
```

**Backend машина** (где запущен Node.js):
```bash
cd /var/www/utmn-security/debug/backend
npm start
```

### Сценарий 3: Production с Nginx

В `.env`:
```env
VITE_API_URL=https://security.tyuiu.ru/v1
```

WebSocket будет: `wss://security.tyuiu.ru/ws/storage` (с SSL)

---

## 🔍 Проверка

После настройки проверьте в консоли браузера (F12):

```
[Storage WebSocket] DEBUG: VITE_API_URL = http://192.168.1.100:3000/v1
[Storage WebSocket] Используем WebSocket URL из VITE_API_URL: ws://192.168.1.100:3000/ws/storage
🔌 Connecting to Storage WebSocket: ws://192.168.1.100:3000/ws/storage?token=...
✅ Storage WebSocket connected
```

---

## 🛠️ Копирование файлов

Не забудьте скопировать обновленный файл в `/frontend`:

```bash
cd /var/www/utmn-security/debug

# Создать папки если не существуют
mkdir -p frontend/hooks

# Скопировать обновленный хук
cp hooks/useStorageWebSocket.ts frontend/hooks/
```

---

## 📝 Итого:

1. ✅ Исправлен `/hooks/useStorageWebSocket.ts` - динамический URL
2. ✅ Поддержка `VITE_API_URL` из `.env`
3. ✅ Автоматическое определение hostname если `.env` не задан
4. ✅ Поддержка SSL (`wss://`) для HTTPS

🎉 **WebSocket теперь подключается к правильному серверу!**
