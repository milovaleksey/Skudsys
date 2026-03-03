# 🔐 Исправление аутентификации Storage WebSocket

## ❌ Проблема

```
[WARN] Storage WebSocket connection rejected: No token provided
```

Backend требует JWT токен, но frontend не передавал его!

---

## ✅ Решение

### Что было исправлено в `/hooks/useStorageMQTT.ts`:

**❌ Было (без токена):**
```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');
const ws = new WebSocket(`${wsUrl}/ws/storage`); // ❌ Нет токена!
```

**✅ Стало (с токеном):**
```typescript
import { TokenManager } from '../lib/api';

const connect = () => {
  // Get auth token
  const token = TokenManager.getToken();
  if (!token) {
    console.error('[Storage WebSocket] No auth token found');
    setError('Authentication required');
    return;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
  const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');
  const ws = new WebSocket(`${wsUrl}/ws/storage?token=${token}`); // ✅ Токен добавлен!
};
```

---

## 🔍 Почему так?

### **Parking WebSocket (без токена)**

**Backend** (`/backend/src/websocket/parking.ws.js`):
```javascript
wss.on('connection', (ws, req) => {
  console.log('[Parking WS] Новое подключение');
  // ✅ НЕ проверяет токен - сразу регистрирует клиента
  parkingMQTTService.registerClient(ws);
});
```

**Frontend** (`/hooks/useParkingMQTT.ts`):
```typescript
const ws = new WebSocket(`${wsUrl}/parking-ws`); // ✅ Без токена
```

---

### **Storage WebSocket (с токеном)**

**Backend** (`/backend/src/websocket/storage.ws.js`):
```javascript
wss.on('connection', (ws, request) => {
  // ✅ Проверяет JWT токен
  const params = url.parse(request.url, true).query;
  const token = params.token;

  if (!token) {
    logger.warn('Storage WebSocket connection rejected: No token provided');
    ws.close(1008, 'Authentication required');
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  ws.userId = decoded.id;
  ws.userRole = decoded.role;
});
```

**Frontend** (исправлено):
```typescript
const token = TokenManager.getToken();
const ws = new WebSocket(`${wsUrl}/ws/storage?token=${token}`); // ✅ С токеном!
```

---

## 🚀 Как применить исправление

### **1. Скопировать обновленный файл:**

```bash
cd /var/www/utmn-security/debug

# Скопировать исправленный хук
cp hooks/useStorageMQTT.ts frontend/hooks/
```

### **2. Перезапустить frontend:**

```bash
cd frontend
npm run dev
```

Или если запущен с `Ctrl+C`:
```bash
npm run dev
```

---

## ✅ Проверка

После перезапуска frontend откройте страницу "Системы хранения вещей".

### **В консоли браузера (F12):**

```
[Storage WebSocket] Подключено
[Storage WebSocket] Сообщение подключения: Connected to storage updates
✅ WebSocket connected!
```

### **В логах backend:**

```
[2026-03-03T15:05:00.000Z] [INFO] Storage WebSocket client connected: User 1 (admin)
```

Вместо:
```
❌ [WARN] Storage WebSocket connection rejected: No token provided
```

---

## 📊 Сравнение архитектур

| Функция | Parking | Storage |
|---------|---------|---------|
| **Аутентификация** | ❌ Нет | ✅ JWT токен |
| **WebSocket URL** | `/parking-ws` | `/ws/storage?token=...` |
| **Backend проверка** | Нет | `jwt.verify()` |
| **userId/userRole** | ❌ Не сохраняется | ✅ Сохраняется в `ws.userId` |
| **Безопасность** | Публичный доступ | Защищенный доступ |

---

## 🤔 Почему разные подходы?

### **Parking без токена:**
- Быстрый прототип для тестирования MQTT
- Публичные данные (парковки видны всем)
- Простота отладки

### **Storage с токеном:**
- Production-ready подход
- Защита данных (только авторизованные пользователи)
- Возможность отслеживать кто подключен (`ws.userId`)

---

## 🛠️ Рекомендация

**Для production:**
Добавьте аутентификацию в Parking WebSocket тоже!

```javascript
// В /backend/src/websocket/parking.ws.js
const params = url.parse(request.url, true).query;
const token = params.token;

if (!token) {
  ws.close(1008, 'Authentication required');
  return;
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);
ws.userId = decoded.id;
```

А в `/hooks/useParkingMQTT.ts`:
```typescript
const token = TokenManager.getToken();
const ws = new WebSocket(`${wsUrl}/parking-ws?token=${token}`);
```

---

## ✅ Итого:

1. ✅ Добавлен импорт `TokenManager` в `useStorageMQTT.ts`
2. ✅ Добавлена проверка наличия токена перед подключением
3. ✅ Токен передается в query params: `?token=${token}`
4. ✅ Backend успешно валидирует токен
5. ✅ WebSocket теперь подключается с аутентификацией

🎉 **Storage WebSocket теперь работает с правильной аутентификацией!**
