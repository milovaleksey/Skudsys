# 🔧 WebSocket исправлен - Перезапустите backend!

## ✅ Что исправлено

Parking WebSocket теперь использует правильный подход (как MQTT WebSocket):
- Убран `noServer: true`
- Убран обработчик `upgrade`
- Используется прямое подключение: `new WebSocket.Server({ server, path: '/parking-ws' })`

## 🚀 Перезапустите backend ПРЯМО СЕЙЧАС

```bash
cd /var/www/utmn-security/debug/backend

# Остановить старый процесс
pkill -f "node.*server.js"

# Или найти и убить
ps aux | grep node
kill -9 <PID>

# Запустить новый
npm start
```

**Ожидаемый вывод:**
```
✅ Подключено к MySQL
🚀 Сервер запущен на порту 3000
[MQTT WebSocket] MQTT WebSocket сервер запущен на /ws/mqtt
[Parking WS] ✅ WebSocket сервер запущен на /parking-ws
🔌 Подключение к MQTT брокеру...
🔌 Подключение к Parking MQTT брокеру...
[MQTT] ✅ Успешно подключено к брокеру
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

## 🌐 Проверьте frontend

После перезапуска backend:

1. **Обновите страницу** (F5 или Ctrl+R)
2. **Откройте "Парковочная система"**
3. **Откройте консоль** (F12 → Console)

Должно быть:
```
[Parking WebSocket] Подключено
[Parking WebSocket] Получена конфигурация парковок: 3
```

## 📡 Опубликуйте парковки

```bash
cd /var/www/utmn-security/debug
export MQTT_HOST=10.101.221.232
./parking-publish.sh
```

## ✅ Готово!

Теперь WebSocket должен подключаться без ошибки 400!

---

## 🐛 Если всё равно ошибка 400

1. Проверьте что backend перезапущен:
   ```bash
   ps aux | grep node
   ```

2. Проверьте логи backend:
   ```bash
   cd /var/www/utmn-security/debug/backend
   npm start 2>&1 | tee backend.log
   ```

3. Проверьте URL в браузере:
   - Должен быть: `ws://10.101.221.207:3000/parking-ws`
   - В console.log: `apiUrl = http://10.101.221.207:3000/v1`

4. Проверьте что WebSocket сервер запущен:
   ```
   [Parking WS] ✅ WebSocket сервер запущен на /parking-ws
   ```
