# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ

## 🔴 Проблемы
- ❌ Invalid frame header (WebSocket конфликт)
- ❌ 429 Too Many Requests (rate limiting)

## ✅ Исправлено
- ✅ WebSocket роутинг через единый upgrade handler
- ✅ Rate limit: 1000 req/min (было 100 req/15min)

## 🚀 ПЕРЕЗАПУСК (3 команды)

```bash
# 1. Перезапустить backend
cd /var/www/utmn-security/debug/backend
pkill -f node && npm start

# 2. Обновить браузер (жесткая перезагрузка)
# Нажмите Ctrl+Shift+R

# 3. Опубликовать парковки
cd /var/www/utmn-security/debug
export MQTT_HOST=10.101.221.232
./parking-publish.sh
```

## ✅ Проверка

**Консоль backend:**
```
[MQTT WebSocket] Инициализирован для /ws/mqtt
[Parking WS] ✅ WebSocket инициализирован для /parking-ws
[Parking MQTT] ✅ Подключено к брокеру
```

**Консоль браузера (F12):**
```
✅ [WebSocket] ✅ Подключено
✅ [Parking WebSocket] Подключено
✅ НЕТ ошибок 429
✅ НЕТ "Invalid frame header"
```

## 🎯 Результат

- ✅ Главная страница работает
- ✅ Парковочная система работает
- ✅ WebSocket подключены
- ✅ Нет rate limit ошибок

**Готово!** 🎉

---

📖 Подробности: `CRITICAL_FIX_WEBSOCKET_RATELIMIT.md`
