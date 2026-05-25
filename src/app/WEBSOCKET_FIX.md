# Исправление WebSocket подключений для работы через HTTPS

## Что было исправлено

### Backend (пути WebSocket)
1. **parking.ws.js**: путь изменен с `/parking-ws` на `/ws/parking`
2. **foreign-students.ws.js**: путь изменен с `/ws` на `/ws/foreign-students`

Все WebSocket endpoints теперь используют единый формат: `/ws/*`
- `/ws/mqtt` - MQTT данные (Analytics, Engineering)
- `/ws/parking` - парковки
- `/ws/storage` - системы хранения
- `/ws/foreign-students` - иностранные студенты

### Frontend (логика формирования URL)
Исправлены все хуки для правильного формирования WebSocket URL с учетом HTTPS:
1. **useParkingMQTT.ts** - исправлена логика формирования URL
2. **useStorageMQTT.ts** - исправлена логика формирования URL
3. **useForeignStudentsMQTT.ts** - исправлена логика формирования URL
4. **EngineeringPage.tsx** - исправлена логика формирования URL

Теперь все используют единую логику:
```typescript
const apiUrl = import.meta.env.VITE_API_URL || '';

if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
  const url = new URL(apiUrl);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUrl = `${protocol}//${url.host}/ws/path`;
} else {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUrl = `${protocol}//${window.location.host}/ws/path`;
}
```

Это правильно определяет:
- `https://report.utmn.ru` → `wss://report.utmn.ru/ws/*`
- `http://localhost:3000` → `ws://localhost:3000/ws/*`

## Инструкции для применения на сервере

### 1. Копирование исправленных файлов

```bash
# На сервере перейти в рабочую директорию
cd /opt/utmn-security/src/app

# Backend файлы
cp backend/src/websocket/parking.ws.js backend/src/websocket/parking.ws.js.backup
cp backend/src/websocket/foreign-students.ws.js backend/src/websocket/foreign-students.ws.js.backup

# Применить изменения через sed (или скопировать файлы вручную)
cd backend/src/websocket
sed -i "s|'/parking-ws'|'/ws/parking'|g" parking.ws.js
sed -i "s|для /parking-ws|для /ws/parking|g" parking.ws.js
sed -i "s|path: '/ws'|path: '/ws/foreign-students'|g" foreign-students.ws.js
sed -i "s|для /ws|для /ws/foreign-students|g" foreign-students.ws.js
```

### 2. Обновление frontend

Скопируйте исправленные файлы:
- `hooks/useParkingMQTT.ts`
- `hooks/useStorageMQTT.ts`
- `hooks/useForeignStudentsMQTT.ts`
- `components/EngineeringPage.tsx`

### 3. Убедитесь что Nginx настроен для WebSocket

Проверьте конфигурацию Nginx `/etc/nginx/sites-available/report.utmn.ru`:

```nginx
# API и WebSocket прокси
location /v1/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# WebSocket endpoints
location /ws/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # WebSocket support (обязательно!)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Увеличенные таймауты для WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### 4. Пересобрать frontend

```bash
cd /opt/utmn-security/src/app/frontend
VITE_CJS_IGNORE_WARNING=true npx vite build
```

### 5. Перезапустить backend

```bash
pm2 restart all
# или
pm2 delete all
cd /opt/utmn-security/src/app/backend
pm2 start src/server.js --name utmn-backend
```

### 6. Перезагрузить Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Проверка

После применения изменений откройте консоль браузера (F12) и проверьте:

1. Должны появиться логи подключения к WebSocket:
```
[Parking WS] Подключение к wss://report.utmn.ru/ws/parking
[Storage WS] Подключение к wss://report.utmn.ru/ws/storage
[Foreign Students MQTT] Подключение к: wss://report.utmn.ru/ws/foreign-students
```

2. Не должно быть ошибок типа:
```
WebSocket connection to 'wss://report.utmn.ru/ws/mqtt' failed
```

3. Backend логи должны показать успешные подключения:
```
[Parking WS] Новое подключение
[Storage WebSocket] Новое подключение
```
