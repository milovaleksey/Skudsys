# 🚨 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ - WebSocket и Rate Limiting

## ✅ Что было исправлено

### 1. WebSocket конфликт (Invalid frame header)
**Проблема:** Два WebSocket сервера (MQTT и Parking) конфликтовали друг с другом

**Решение:**
- ✅ Оба используют `noServer: true`
- ✅ Единый обработчик `upgrade` в server.js маршрутизирует по путям
- ✅ `/ws/mqtt` → MQTT WebSocket
- ✅ `/parking-ws` → Parking WebSocket

### 2. Rate Limiting (429 Too Many Requests)
**Проблема:** Слишком агрессивные лимиты (100 запросов за 15 минут)

**Решение:**
- ✅ Увеличен лимит: 1000 запросов за 1 минуту
- ✅ Health check и WebSocket исключены из лимитов
- ✅ Auth rate limiter остался без изменений (5 попыток за 15 минут)

## 🚀 НЕМЕДЛЕННО ПЕРЕЗАПУСТИТЕ BACKEND

```bash
cd /var/www/utmn-security/debug/backend

# Убить все процессы node
pkill -f node

# Или найти и убить
ps aux | grep node
kill -9 <PID>

# Запустить
npm start
```

**Ожидаемый вывод:**
```
✅ Подключено к MySQL
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
[MQTT WebSocket] Инициализирован для /ws/mqtt
[Parking WS] ✅ WebSocket инициализирован для /parking-ws
🔌 Подключение к MQTT брокеру...
[MQTT] ✅ Успешно подключено к брокеру
🔌 Подключение к Parking MQTT брокеру...
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

## 🌐 Обновите браузер

1. **Откройте приложение**
2. **Нажмите Ctrl+Shift+R** (жесткая перезагрузка)
3. **Откройте консоль** (F12)

**Ожидаемый результат:**
```
✅ НЕТ ошибок 429
✅ НЕТ "Invalid frame header"
✅ [WebSocket] ✅ Подключено
✅ [Parking WebSocket] Подключено
```

## 📡 Опубликуйте парковки

```bash
cd /var/www/utmn-security/debug
export MQTT_HOST=10.101.221.232
./parking-publish.sh
```

## ✅ Проверка

### Backend логи

Откройте **новое** подключение в консоли:
```
[MQTT WebSocket] Новое подключение
[WebSocket] ✅ Аутентифицирован: admin
[Parking WS] Новое подключение
[Parking WS] Клиент зарегистрирован, всего: 1
```

### Frontend консоль

```
[WebSocket] ✅ Подключено
[WebSocket] Получены начальные данные
[Parking WebSocket] Подключено
[Parking WebSocket] Получена конфигурация парковок: 3
```

### Страницы

1. **Главная страница** → Карточки с данными ✅
2. **Парковочная система** → 3 парковки с транспортом ✅

## 🔧 Структура WebSocket

```
server.on('upgrade') → Центральный маршрутизатор
    ↓
    ├─ /ws/mqtt      → MQTT WebSocket (с JWT auth)
    └─ /parking-ws   → Parking WebSocket (без auth)
```

## ⚙️ Настройка Rate Limiter в .env

Если нужно изменить лимиты:

```bash
# /backend/.env
RATE_LIMIT_WINDOW_MS=60000        # 1 минута
RATE_LIMIT_MAX_REQUESTS=1000      # 1000 запросов
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5    # 5 попыток авторизации
```

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| Всё равно 429 | Подождите 1 минуту или перезапустите backend |
| Invalid frame header | Убедитесь что backend перезапущен с новым кодом |
| WebSocket не подключается | Проверьте что в логах: "WebSocket инициализирован" |
| Parking не работает | Опубликуйте конфигурацию: `./parking-publish.sh` |

## 📊 Что дальше?

1. ✅ Backend перезапущен
2. ✅ Браузер обновлен (Ctrl+Shift+R)
3. ✅ Парковки опубликованы
4. ✅ Проверьте обе страницы

**Теперь всё должно работать!** 🎉

---

## 🎯 Технические детали

### Почему noServer: true?

- Позволяет одному HTTP серверу обслуживать несколько WebSocket серверов
- Избегает конфликтов путей
- Даёт контроль над upgrade событиями

### Почему увеличили rate limit?

- React useEffect может делать повторные запросы
- WebSocket reconnect создаёт всплески запросов
- Разработка требует более мягких лимитов
- Production можно ужесточить через .env

### Порядок подключения

1. HTTP сервер получает `upgrade` запрос
2. Проверяет pathname
3. Передаёт в соответствующий WebSocket Server
4. WebSocket Server обрабатывает подключение
5. Клиент получает подтверждение
