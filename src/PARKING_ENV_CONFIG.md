# 🅿️ Конфигурация парковки в .env

## 📋 Текущая проблема:

**404 Not Found:**
```
GET http://10.101.221.207:3000/v1/parking/statistics 404 (Not Found)
GET http://10.101.221.207:3000/v1/employees/statistics 404 (Not Found)
```

**Причина:** Routes не зарегистрированы или отключены

---

## ✅ Правильная конфигурация `/backend/.env`

```bash
# ===================================
# СЕРВЕР
# ===================================
PORT=3000
API_VERSION=v1
NODE_ENV=development

# ===================================
# БАЗЫ ДАННЫХ
# ===================================

# Основная база данных (пользователи, роли, аудит)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=utmn_security

# База данных СКУД (карточки, проходы)
SKUD_DB_HOST=localhost
SKUD_DB_PORT=3306
SKUD_DB_USER=root
SKUD_DB_PASSWORD=your_mysql_password_here
SKUD_DB_NAME=skud_database

# ===================================
# JWT
# ===================================
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ===================================
# CORS
# ===================================
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://10.101.221.207:5173,http://10.101.221.207:3000
CORS_CREDENTIALS=true

# ===================================
# MQTT (Основной - для дашборда)
# ===================================
MQTT_BROKER=10.101.221.198
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CONFIG_TOPIC=Skud/main/stat
MQTT_ENABLED=true

# ===================================
# MQTT ПАРКОВКА (отдельный сервис)
# ===================================

# Брокер MQTT для парковки
PARKING_MQTT_BROKER=10.101.221.198
PARKING_MQTT_PORT=1883
PARKING_MQTT_USERNAME=
PARKING_MQTT_PASSWORD=

# Топики MQTT для парковки
PARKING_MQTT_CONFIG_TOPIC=Skud/parking/config
PARKING_MQTT_VEHICLES_TOPIC_PREFIX=Skud/parking/

# Включить/выключить парковку
PARKING_MQTT_ENABLED=true

# Таймаут переподключения (мс)
PARKING_MQTT_RECONNECT_TIMEOUT=5000

# Максимальное количество попыток переподключения
PARKING_MQTT_MAX_RECONNECT_ATTEMPTS=10

# ===================================
# RATE LIMITING
# ===================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5

# ===================================
# ЛОГИРОВАНИЕ
# ===================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

---

## 🔍 Объяснение переменных парковки:

### 1. **PARKING_MQTT_BROKER**
```bash
PARKING_MQTT_BROKER=10.101.221.198
```
- IP адрес или hostname MQTT брокера для парковки
- Может совпадать с основным MQTT_BROKER

### 2. **PARKING_MQTT_PORT**
```bash
PARKING_MQTT_PORT=1883
```
- Порт MQTT брокера (стандартный: 1883)
- Для SSL/TLS используйте 8883

### 3. **PARKING_MQTT_USERNAME** и **PARKING_MQTT_PASSWORD**
```bash
PARKING_MQTT_USERNAME=
PARKING_MQTT_PASSWORD=
```
- Оставьте пустыми если брокер без авторизации
- Заполните если требуется аутентификация

### 4. **PARKING_MQTT_CONFIG_TOPIC**
```bash
PARKING_MQTT_CONFIG_TOPIC=Skud/parking/config
```
- Топик для получения конфигурации парковок
- Формат сообщения:
```json
[
  {
    "id": "central",
    "name": "Центральная парковка",
    "address": "ул. Володарского, д. 6",
    "maxCapacity": 100,
    "vehiclesTopic": "Skud/parking/central/vehicles"
  }
]
```

### 5. **PARKING_MQTT_VEHICLES_TOPIC_PREFIX**
```bash
PARKING_MQTT_VEHICLES_TOPIC_PREFIX=Skud/parking/
```
- Префикс для топиков с данными о транспорте
- Backend подписывается на: `Skud/parking/{parkingId}/vehicles`

### 6. **PARKING_MQTT_ENABLED**
```bash
PARKING_MQTT_ENABLED=true
```
- `true` - включить парковку
- `false` - отключить парковку (WebSocket будет работать, но без данных)

### 7. **PARKING_MQTT_RECONNECT_TIMEOUT**
```bash
PARKING_MQTT_RECONNECT_TIMEOUT=5000
```
- Задержка между попытками переподключения (мс)
- По умолчанию: 5000 (5 секунд)

### 8. **PARKING_MQTT_MAX_RECONNECT_ATTEMPTS**
```bash
PARKING_MQTT_MAX_RECONNECT_ATTEMPTS=10
```
- Максимальное количество попыток переподключения
- После достижения лимита - прекращает попытки

---

## 📡 Структура MQTT топиков парковки:

### Топик конфигурации:
```
Skud/parking/config
```

**Формат сообщения:**
```json
[
  {
    "id": "central",
    "name": "Центральная парковка",
    "address": "ул. Володарского, д. 6",
    "maxCapacity": 100,
    "vehiclesTopic": "Skud/parking/central/vehicles"
  },
  {
    "id": "k1",
    "name": "Парковка К1",
    "address": "ул. Республики, д. 47",
    "maxCapacity": 50,
    "vehiclesTopic": "Skud/parking/k1/vehicles"
  }
]
```

### Топики транспорта:
```
Skud/parking/central/vehicles
Skud/parking/k1/vehicles
Skud/parking/k5/vehicles
```

**Формат сообщения:**
```json
[
  {
    "entryTime": "2026-03-02T10:30:00Z",
    "fullName": "Иванов Иван Иванович",
    "upn": "i.i.ivanov@utmn.ru",
    "carBrand": "Toyota Camry",
    "licensePlate": "А123БВ777"
  },
  {
    "entryTime": "2026-03-02T11:15:00Z",
    "fullName": "Петров Петр Петрович",
    "upn": "p.p.petrov@utmn.ru",
    "carBrand": "Hyundai Solaris",
    "licensePlate": "В456ГД777"
  }
]
```

---

## 🔄 Как это работает:

### 1. Backend запускается
```javascript
// Backend читает .env
const parkingMQTTService = require('./services/parking-mqtt.service');
parkingMQTTService.connect();
```

### 2. Подключение к MQTT
```
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.198:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

### 3. Получение конфигурации
```
[Parking MQTT] 📊 Получена конфигурация: 3 парковок
[Parking MQTT] 📝 Парковки: central, k1, k5
[Parking MQTT] ✅ Подписка на Skud/parking/central/vehicles
[Parking MQTT] ✅ Подписка на Skud/parking/k1/vehicles
[Parking MQTT] ✅ Подписка на Skud/parking/k5/vehicles
```

### 4. Получение данных о транспорте
```
[Parking MQTT] 🚗 Обновление транспорта [central]: 15 автомобилей
[Parking MQTT] 🚗 Обновление транспорта [k1]: 8 автомобилей
```

### 5. Передача данных через WebSocket
```
[Parking WS] 📤 Отправка конфигурации клиентам
[Parking WS] 📤 Отправка транспорта [central] клиентам
```

---

## 🧪 Тестирование конфигурации:

### 1. Проверьте файл .env
```bash
cd /var/www/utmn-security/debug/backend
cat .env | grep PARKING
```

**Должно быть:**
```
PARKING_MQTT_BROKER=10.101.221.198
PARKING_MQTT_PORT=1883
PARKING_MQTT_USERNAME=
PARKING_MQTT_PASSWORD=
PARKING_MQTT_CONFIG_TOPIC=Skud/parking/config
PARKING_MQTT_VEHICLES_TOPIC_PREFIX=Skud/parking/
PARKING_MQTT_ENABLED=true
```

### 2. Перезапустите backend
```bash
npm start
```

### 3. Проверьте логи
**Должно быть:**
```
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.198:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

### 4. Проверьте API endpoint
```bash
curl http://localhost:3000/v1/parking/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "parkingsCount": 3,
    "totalVehicles": 23
  }
}
```

---

## ⚠️ Возможные проблемы:

### Проблема 1: Backend не читает .env
**Симптом:**
```
[Parking MQTT] Подключение к брокеру: mqtt://localhost:1883
```

**Решение:**
1. Убедитесь, что файл `/backend/.env` существует
2. Перезапустите backend (Ctrl+C → npm start)
3. Проверьте права доступа: `chmod 644 /backend/.env`

---

### Проблема 2: MQTT недоступен
**Симптом:**
```
[Parking MQTT] ❌ Ошибка подключения: connect ECONNREFUSED 10.101.221.198:1883
```

**Решение:**
1. Проверьте доступность MQTT:
   ```bash
   telnet 10.101.221.198 1883
   # или
   nc -zv 10.101.221.198 1883
   ```

2. Проверьте firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 1883/tcp
   ```

3. Если MQTT требует авторизацию:
   ```bash
   PARKING_MQTT_USERNAME=your_username
   PARKING_MQTT_PASSWORD=your_password
   ```

---

### Проблема 3: 404 Not Found для /parking/statistics
**Симптом:**
```
GET http://10.101.221.207:3000/v1/parking/statistics 404 (Not Found)
```

**Решение:**
Проверьте, что routes зарегистрированы в `/backend/src/server.js`:
```javascript
const parkingRoutes = require('./routes/parking.routes');
app.use('/v1/parking', parkingRoutes);
```

---

## 📁 Связанные файлы:

- `/backend/.env` - конфигурация (этот файл)
- `/backend/.env.example` - шаблон
- `/backend/src/services/parking-mqtt.service.js` - MQTT сервис
- `/backend/src/controllers/mqtt.controller.js` - API контроллер
- `/backend/src/routes/parking.routes.js` - API routes
- `/backend/src/websocket/parking.ws.js` - WebSocket сервер

---

## ✅ Итоговый чеклист:

- [ ] Файл `/backend/.env` создан
- [ ] Переменные `PARKING_MQTT_*` заполнены
- [ ] `PARKING_MQTT_ENABLED=true`
- [ ] Backend перезапущен
- [ ] В логах `mqtt://10.101.221.198:1883`
- [ ] MQTT топик `Skud/parking/config` публикует данные
- [ ] WebSocket подключается на `/parking-ws`
- [ ] Frontend получает данные

---

## 🚀 Быстрый старт:

```bash
# 1. Отредактируйте .env
nano /var/www/utmn-security/debug/backend/.env

# 2. Добавьте переменные парковки (см. выше)

# 3. Перезапустите backend
cd /var/www/utmn-security/debug/backend
npm start

# 4. Проверьте логи - должно быть:
# [Parking MQTT] Подключение к брокеру: mqtt://10.101.221.198:1883
```

🎉 **Парковка должна заработать!**
