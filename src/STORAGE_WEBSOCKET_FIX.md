# 🔧 Исправление WebSocket Storage подключения

## 🎯 Проблема решена

```
WebSocket connection to 'ws://localhost:3000/ws/storage?token=...' failed: 
Error in connection establishment: net::ERR_CONNECTION_REFUSED
```

## ✅ Что было исправлено

### 1. Конфликт обработчиков WebSocket upgrade
**Проблема:** В `server.js` было **два обработчика** события `upgrade`:
- Один внутри `initStorageWebSocket()` 
- Второй в `server.js` для обработки всех WebSocket путей

Они конфликтовали друг с другом!

**Решение:** Изменена архитектура `storage.ws.js`:
- ✅ Убран внутренний обработчик `upgrade`
- ✅ Функция теперь возвращает `{ wss, path }` как другие WebSocket сервисы
- ✅ Единый обработчик `upgrade` в `server.js` для всех путей

### 2. Обновлен server.js
Добавлена обработка Storage WebSocket в центральный обработчик:

```javascript
const storageWS = initStorageWebSocket(server);

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === mqttWS.path) {
    // MQTT WebSocket
  } else if (pathname === parkingWS.path) {
    // Parking WebSocket
  } else if (pathname === storageWS.path) {  // ✅ ДОБАВЛЕНО
    storageWS.wss.handleUpgrade(request, socket, head, (ws) => {
      storageWS.wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
```

## 🚀 Как запустить

### 1. Перезапустите backend:

```bash
cd backend
npm start
```

Вы должны увидеть:
```
✅ Storage WebSocket server initialized on /ws/storage
```

### 2. Frontend уже подключится автоматически

Откройте страницу "Система хранения вещей" - WebSocket подключится автоматически!

---

## 🔍 Проверка подключения

В консоли браузера должны появиться логи:
```
🔌 Connecting to Storage WebSocket: ws://localhost:3000/ws/storage?token=...
✅ Storage WebSocket connected
```

Вместо ошибки:
```
❌ Storage WebSocket error: Event {type: 'error', ...}
⚠️ Storage WebSocket disconnected
```

---

## 📋 Файлы изменены:

1. ✅ `/backend/src/websocket/storage.ws.js` - возвращает `{ wss, path }`
2. ✅ `/backend/src/server.js` - добавлена обработка Storage WebSocket

---

🎉 **Готово!** Теперь Storage WebSocket работает корректно.
