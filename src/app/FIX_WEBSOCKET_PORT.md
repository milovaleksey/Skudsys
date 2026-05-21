# 🔧 ИСПРАВЛЕНИЕ: WebSocket подключается к неправильному порту

## Проблема
WebSocket подключался к порту 5173 (Vite dev server) вместо порта 3000 (backend сервер):
```
❌ ws://10.101.221.207:5173/ws/mqtt?
```

## Причина
В `/hooks/useMQTT.ts` строка 95 использовала `window.location.host`, который включает порт текущей страницы (5173), а не backend сервера.

## Что исправлено

### `/hooks/useMQTT.ts`
**БЫЛО:**
```typescript
// Если задан только путь или не задан - используем текущий хост
else {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // ❌ Использует порт 5173!
  wsUrl = `${protocol}//${host}/ws/mqtt?token=${token}`;
}
```

**СТАЛО:**
```typescript
// Если не задан или задан относительный путь - используем текущий хост с портом 3000
else {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname; // ✅ Только hostname без порта
  wsUrl = `${protocol}//${hostname}:3000/ws/mqtt?token=${token}`;
  console.log('[WebSocket] Используем дефолтный WebSocket URL (порт 3000):', wsUrl);
}
```

## Результат

Теперь WebSocket правильно определяет URL в двух сценариях:

### 1. Если задан VITE_API_URL (удаленный сервер)
```bash
# В файле .env
VITE_API_URL=http://10.101.221.207:3000/v1
```

WebSocket подключится к:
```
✅ ws://10.101.221.207:3000/ws/mqtt?token=...
```

### 2. Если VITE_API_URL не задан (локальная разработка)
```bash
# .env пустой или VITE_API_URL не задан
```

WebSocket подключится к:
```
✅ ws://localhost:3000/ws/mqtt?token=...
```

## Проверка

Откройте консоль браузера и найдите:
```
[WebSocket] Используем WebSocket URL из VITE_API_URL: ws://10.101.221.207:3000/ws/mqtt?token=...
[WebSocket] Подключение к ws://10.101.221.207:3000/ws/mqtt?token=...
[WebSocket] ✅ Подключено
```

## Примечания

- ✅ Теперь WebSocket всегда использует порт 3000 (backend)
- ✅ Автоматически определяет протокол (ws/wss) на основе HTTPS
- ✅ Правильно извлекает хост и порт из `VITE_API_URL`
- ✅ Добавлены debug логи для отладки

## Связанные файлы
- `/hooks/useMQTT.ts` - исправлена логика определения WebSocket URL
- `/lib/api.ts` - правильная настройка API URL
- `/.env` - переменная окружения `VITE_API_URL`
