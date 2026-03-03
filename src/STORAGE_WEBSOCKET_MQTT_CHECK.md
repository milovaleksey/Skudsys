# ✅ Storage WebSocket подключен! Проверяем MQTT данные

## 🎉 Что уже работает:

```
✅ [Storage WebSocket] Подключено
✅ [Storage WebSocket] Сообщение подключения: Connected to storage updates
✅ WebSocket подключается и переподключается
```

---

## 🔍 Следующий шаг: Проверить MQTT брокер

### **1. Проверить логи backend при запуске**

Ищите в логах:

**✅ Успешное подключение:**
```
🔌 Подключение к Storage MQTT брокеру...
Connecting to Storage MQTT broker: mqtt://10.101.221.232:1883
✅ Connected to Storage MQTT broker
📡 Subscribed to storage configuration topic: storage/config
```

**❌ Если нет подключения:**
```
⚠️ Storage MQTT отключен в конфигурации
```
или
```
Storage MQTT connection error: ...
```

---

### **2. Проверить переменные окружения**

В `/backend/.env` должно быть:

```bash
# Storage MQTT Configuration
STORAGE_MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://10.101.221.232:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

**Или** (если используется общий MQTT брокер):
```bash
# Общий MQTT Configuration
MQTT_BROKER=10.101.221.232
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

**Проверить какой используется:**
```bash
cd /var/www/utmn-security/debug/backend
cat .env | grep MQTT
```

---

### **3. Проверить Storage MQTT Service**

Откройте `/backend/src/services/storage-mqtt.service.js`:

```javascript
connect() {
  // ⚠️ Использует MQTT_BROKER_URL
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  
  // ✅ Если переменная не задана, использует localhost (это неправильно!)
}
```

**Решение:** Установить правильный `MQTT_BROKER_URL` в `.env`:

```bash
# В /backend/.env добавить:
MQTT_BROKER_URL=mqtt://10.101.221.232:1883
```

---

### **4. Проверить топик конфигурации**

Storage слушает топик: `storage/config`

**Структура сообщения:**
```json
{
  "timestamp": "2026-03-03T15:10:00.000Z",
  "storages": [
    {
      "id": "storage_k1_clothes",
      "name": "Гардероб Корпус 1",
      "type": "clothes",
      "building": "Корпус 1",
      "address": "ул. Ленина, 38",
      "totalCapacity": 200,
      "occupiedCount": 45,
      "status": "active",
      "mqttTopicStatus": "storage/k1/clothes/status",
      "mqttTopicOccupancy": "storage/k1/clothes/occupancy"
    }
  ]
}
```

---

### **5. Протестировать отправку конфигурации**

#### **Вариант A: Использовать готовый скрипт**

```bash
cd /var/www/utmn-security/debug

# Проверить есть ли скрипт
ls -la test_storage_mqtt.sh

# Если есть, запустить:
chmod +x test_storage_mqtt.sh
./test_storage_mqtt.sh
```

#### **Вариант B: Отправить вручную через mosquitto_pub**

```bash
# Отправить конфигурацию
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/config" \
  -m '{
    "timestamp": "2026-03-03T15:10:00.000Z",
    "storages": [
      {
        "id": "storage_k1_clothes",
        "name": "Гардероб Корпус 1",
        "type": "clothes",
        "building": "Корпус 1",
        "totalCapacity": 200,
        "occupiedCount": 45,
        "status": "active",
        "mqttTopicStatus": "storage/k1/clothes/status",
        "mqttTopicOccupancy": "storage/k1/clothes/occupancy"
      }
    ]
  }'
```

#### **Вариант C: Использовать Node.js скрипт**

```bash
cd /var/www/utmn-security/debug/backend
node -e "
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://10.101.221.232:1883');

client.on('connect', () => {
  const config = {
    timestamp: new Date().toISOString(),
    storages: [
      {
        id: 'storage_k1_clothes',
        name: 'Гардероб Корпус 1',
        type: 'clothes',
        building: 'Корпус 1',
        totalCapacity: 200,
        occupiedCount: 45,
        status: 'active',
        mqttTopicStatus: 'storage/k1/clothes/status',
        mqttTopicOccupancy: 'storage/k1/clothes/occupancy'
      }
    ]
  };
  
  client.publish('storage/config', JSON.stringify(config), () => {
    console.log('✅ Конфигурация отправлена');
    client.end();
  });
});
"
```

---

### **6. Проверить получение данных**

#### **В консоли браузера (F12):**

После отправки конфигурации должно появиться:
```
[Storage WebSocket] Получена конфигурация систем хранения: [{...}]
```

#### **В логах backend:**

```
[INFO] Storage MQTT message on storage/config: {"storages": [...]}
[INFO] Broadcasting storage config to 1 clients
```

---

### **7. Отправить обновление занятости**

```bash
# Обновить занятость
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/clothes/occupancy" \
  -m '{
    "systemId": "storage_k1_clothes",
    "occupiedCount": 50,
    "timestamp": "2026-03-03T15:15:00.000Z"
  }'
```

**В консоли браузера:**
```
[Storage WebSocket] Обновление занятости: {systemId: "storage_k1_clothes", occupiedCount: 50, ...}
```

---

### **8. Отправить обновление статуса**

```bash
# Изменить статус на "maintenance"
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/clothes/status" \
  -m '{
    "systemId": "storage_k1_clothes",
    "status": "maintenance",
    "timestamp": "2026-03-03T15:20:00.000Z"
  }'
```

**В консоли браузера:**
```
[Storage WebSocket] Обновление статуса: {systemId: "storage_k1_clothes", status: "maintenance", ...}
```

---

## 🐛 Возможные проблемы

### **Проблема 1: Нет данных в Storage**

**Причина:** MQTT брокер не подключен или топик `storage/config` не получен

**Решение:**
1. Проверить `MQTT_BROKER_URL` в `.env`
2. Перезапустить backend: `cd backend && npm start`
3. Отправить конфигурацию через `mosquitto_pub` или скрипт

---

### **Проблема 2: "Storage WebSocket" подключен, но нет данных**

**Причина:** WebSocket подключен, но MQTT не отправил конфигурацию

**Решение:**
Отправить конфигурацию вручную:
```bash
./test_storage_mqtt.sh
```

---

### **Проблема 3: Backend логи показывают "MQTT_BROKER_URL not set"**

**Решение:**
```bash
cd /var/www/utmn-security/debug/backend
echo "MQTT_BROKER_URL=mqtt://10.101.221.232:1883" >> .env
npm start
```

---

## ✅ Финальная проверка

После выполнения всех шагов:

### **1. Backend логи:**
```
✅ Connected to Storage MQTT broker
📡 Subscribed to storage configuration topic: storage/config
```

### **2. Консоль браузера:**
```
[Storage WebSocket] Подключено
[Storage WebSocket] Получена конфигурация систем хранения: [...]
```

### **3. Страница "Системы хранения вещей":**
- Должны появиться карточки систем хранения
- Должны обновляться в real-time при изменении MQTT

---

## 🚀 Быстрые команды

```bash
# 1. Проверить .env
cd /var/www/utmn-security/debug/backend
cat .env | grep MQTT

# 2. Добавить MQTT_BROKER_URL если нет
echo "MQTT_BROKER_URL=mqtt://10.101.221.232:1883" >> .env

# 3. Перезапустить backend
npm start

# 4. Отправить тестовые данные
cd /var/www/utmn-security/debug
./test_storage_mqtt.sh
```

---

🎉 **Готово! Storage WebSocket подключен, теперь нужны данные из MQTT!**
