# ✅ Исправления выполнены!

## Что было исправлено:

### 1. Добавлена функция `apiRequest` в `/lib/api.ts`
- Создана универсальная функция для выполнения API запросов
- Поддерживает авторизацию через JWT токен
- Обработка ошибок сети и сервера

### 2. Добавлен `mqttApi` в `/lib/api.ts`
- `getCards()` - получить карточки со значениями
- `getValues()` - получить только значения
- `getStatus()` - статус MQTT подключения
- `publish()` - публикация сообщений (admin only)

### 3. Исправлены пути в `/hooks/useMQTT.ts`
- Изменено с `/api/mqtt/cards` на `/mqtt/cards`
- Изменено с `/api/mqtt/publish` на `/mqtt/publish`
- API_URL уже содержит нужный префикс

### 4. Исправлен токен в WebSocket
- Использует правильный ключ `auth_token` вместо `token`

## 🚀 Как протестировать:

### 1. Запустите Backend

```bash
cd backend
npm install  # если еще не установлены зависимости
npm run dev
```

Вы должны увидеть:
```
✅ Подключено к MySQL
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
[WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
🔌 Подключение к MQTT брокеру...
```

Если MQTT брокер не запущен:
```
[MQTT] ❌ Ошибка подключения: connect ECONNREFUSED 127.0.0.1:1883
```

### 2. Запустите Mosquitto (опционально для MQTT)

```bash
# Ubuntu/Debian
sudo apt install mosquitto
sudo systemctl start mosquitto

# macOS
brew install mosquitto
brew services start mosquitto
```

### 3. Запустите Frontend

```bash
npm install  # если еще не установлены зависимости
npm run dev
```

Откройте в браузере http://localhost:5173 (или другой порт, который укажет Vite)

### 4. Проверьте работу

#### Авторизуйтесь в системе

#### Откройте главную страницу
- Вы должны увидеть статистические карточки (fallback из API)
- Индикатор "MQTT отключен (используются API данные)"

#### Проверьте консоль браузера (F12)
Вы должны видеть:
```
[WebSocket] Подключение к ws://localhost:3000/ws/mqtt?token=...
[WebSocket] ✅ Подключено
[WebSocket] Получено: initial
```

Если видите ошибку:
```
[WebSocket] ❌ Отклонено: отсутствует токен
```
Значит проблема с авторизацией - перелогиньтесь.

### 5. Протестируйте MQTT (если брокер запущен)

```bash
# Опубликуйте конфигурацию карточек
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "test1",
    "label": "Тестовая карточка 1",
    "icon": "users",
    "valueTopic": "test/value1",
    "color": "#00aeef",
    "unit": "шт."
  },
  {
    "id": "test2",
    "label": "Тестовая карточка 2",
    "icon": "activity",
    "valueTopic": "test/value2",
    "color": "#10b981"
  }
]'

# Опубликуйте значения
mosquitto_pub -h localhost -t "test/value1" -m "42"
mosquitto_pub -h localhost -t "test/value2" -m "100"
```

На дашборде вы должны увидеть:
- ✅ Индикатор "MQTT подключен" с зеленой точкой
- 📊 Две динамические карточки с live данными

### 6. Проверьте live обновления

Откройте второй терминал:
```bash
while true; do
  mosquitto_pub -h localhost -t "test/value1" -m "$((RANDOM % 100))"
  sleep 2
done
```

Карточка должна обновляться каждые 2 секунды!

## 📊 API Endpoints для тестирования

```bash
# Получить статус MQTT
curl http://localhost:3000/api/mqtt/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Получить карточки
curl http://localhost:3000/api/mqtt/cards \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ❌ Возможные ошибки

### "MQTT_ENABLED is not defined"
Добавьте в `/backend/.env`:
```env
MQTT_ENABLED=true
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### "Cannot find module 'mqtt'"
```bash
cd backend
npm install
```

### WebSocket не подключается
1. Проверьте, что backend запущен на порту 3000
2. Проверьте токен в localStorage (должен быть `auth_token`)
3. Проверьте CORS настройки backend

### Карточки не обновляются
1. Проверьте, что конфигурация опубликована в топик `Skud/main/stat`
2. Проверьте логи backend: `[MQTT] 📊 Получена конфигурация`
3. Проверьте WebSocket подключение в консоли браузера

## 📚 Документация

Полная документация доступна в:
- **README_MQTT.md** - Архитектура, API, примеры
- **MQTT_SETUP.md** - Пошаговая настройка
- **MQTT_CHEATSHEET.md** - Быстрая шпаргалка

Готово! 🎉
