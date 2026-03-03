# ✅ ИСПРАВЛЕНО: Storage WebSocket теперь получает конфигурацию!

## 🎯 Что было исправлено:

### **Проблема 1: Backend не отправлял конфигурацию при подключении клиента**
❌ Раньше: Клиент подключался, но не получал текущую конфигурацию
✅ Теперь: При подключении клиента backend сразу отправляет текущую конфигурацию из памяти

### **Проблема 2: Backend отправлял неполную конфигурацию через MQTT**
❌ Раньше: При получении конфигурации через MQTT, backend отправлял только количество систем
✅ Теперь: Backend отправляет полную конфигурацию со всеми данными

### **Проблема 3: Frontend не мог обработать разные форматы данных**
❌ Раньше: Frontend ожидал только один формат данных
✅ Теперь: Frontend обрабатывает оба формата: `{storages: [...]}` и `{data: {storages: [...]}}`

---

## 🔄 Что нужно сделать СЕЙЧАС:

### **1. Перезапустить Backend**

```bash
cd /var/www/utmn-security/debug/backend

# Остановить текущий процесс (Ctrl+C если запущен)
# Затем запустить заново:
npm start
```

**Ожидайте в логах:**
```
✅ Connected to Storage MQTT broker
📡 Subscribed to storage configuration topic: storage/config
✅ Storage WebSocket server initialized on /ws/storage
```

---

### **2. Отправить конфигурацию (если еще не отправляли)**

```bash
cd /var/www/utmn-security/debug

# Запустить скрипт
chmod +x send_garderobbot_config.sh
./send_garderobbot_config.sh
```

**В логах backend должно появиться:**
```
📦 Received storage configuration with 1 systems
✅ Storage configuration updated: 1 systems loaded
✅ Subscribed to storage topic: storage/k1/grbot1/status
✅ Subscribed to storage topic: storage/k1/grbot1/occupancy
Broadcasting storage_config to 1 clients
```

---

### **3. Обновить страницу frontend (F5)**

После перезагрузки страницы в консоли браузера (F12) должно появиться:

```javascript
[Storage WebSocket] Подключено ✅
[Storage WebSocket] Сообщение подключения: Connected to storage updates
[Storage WebSocket] Получена конфигурация систем хранения: [Object] ✅
```

И на странице появится карточка "Гардеробот"!

---

## 📊 Что изменилось в файлах:

### **1. `/backend/src/websocket/storage.ws.js`**
```javascript
// Добавлено: Отправка конфигурации при подключении клиента
wss.on('connection', (ws, request) => {
  // ... existing code ...
  
  // NEW: Send current configuration to newly connected client
  const storageController = require('../controllers/storageController');
  const currentSystems = storageController.getAllSystemsInternal();
  if (currentSystems && currentSystems.length > 0) {
    ws.send(JSON.stringify({
      type: 'storage_config',
      storages: currentSystems,
      timestamp: new Date().toISOString()
    }));
    logger.info(`Sent current storage configuration to new client: ${currentSystems.length} systems`);
  }
});
```

### **2. `/backend/src/services/storage-mqtt.service.js`**
```javascript
// Изменено: Отправка полной конфигурации
broadcastToWebSocket(event, data) {
  if (event === 'storage_config') {
    // Оборачиваем массив систем в объект {storages: [...]
    broadcastStorageUpdate(event, { storages: data });
  } else {
    broadcastStorageUpdate(event, data);
  }
}
```

### **3. `/hooks/useStorageMQTT.ts`**
```javascript
// Изменено: Обработка обоих форматов данных
if (data.type === 'storage_config') {
  // Поддержка обоих форматов:
  // 1. {type: 'storage_config', storages: [...]}
  // 2. {type: 'storage_config', data: {storages: [...]}}
  const storages = data.storages || data.data?.storages || [];
  
  // Маппинг полей snake_case -> camelCase
  const initialStorages = storages.map((config) => ({
    id: String(config.id),
    totalCapacity: config.total_capacity || 0,
    occupiedCount: config.occupied_count || 0,
    mqttTopicStatus: config.mqtt_topic_status || '',
    mqttTopicOccupancy: config.mqtt_topic_occupancy || '',
    // ... etc
  }));
  
  setStorages(initialStorages);
}
```

---

## ✅ Ожидаемый результат:

### **В консоли браузера:**
```javascript
[Storage WebSocket] Подключено
[Storage WebSocket] Получена конфигурация систем хранения: Array(1)
  0: {id: "1", name: "Гардеробот", type: "clothes", ...}
[Storage WebSocket] Обновление занятости: {occupiedCount: 35, ...}
[Storage WebSocket] Обновление статуса: {status: "active", ...}
```

### **На странице появится:**
```
┌─────────────────────────────────┐
│ 🧥 Гардеробот                   │
│ Корпус 1, 1 этаж                │
│ 35 / 100 занято                 │
│ ████████░░░░░░░░░░ 35%          │
│ Статус: ● Активна               │
└─────────────────────────────────┘
```

---

## 🧪 Тестирование real-time обновлений:

После того как карточка появится, протестируйте обновления:

### **Изменить занятость:**
```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/occupancy" \
  -m "50"
```

**Результат:** Прогресс-бар должен обновиться на 50/100 (50%)

### **Изменить статус на "обслуживание":**
```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/status" \
  -m "maintenance"
```

**Результат:** Статус должен измениться на "🔧 На обслуживании"

### **Вернуть статус в "активный":**
```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/status" \
  -m "active"
```

**Результат:** Статус должен вернуться на "● Активна"

---

## 🚀 Быстрые команды для запуска:

```bash
# 1. Перезапустить backend
cd /var/www/utmn-security/debug/backend
npm start

# 2. В другом терминале - отправить конфигурацию
cd /var/www/utmn-security/debug
./send_garderobbot_config.sh

# 3. Открыть браузер и обновить страницу (F5)
# http://10.101.221.207:5173/storage-systems
```

---

## 🎉 Готово!

После перезапуска backend:
1. ✅ WebSocket будет отправлять конфигурацию при подключении
2. ✅ Frontend получит и отобразит карточку "Гардеробот"
3. ✅ Real-time обновления будут работать

Если что-то не работает, проверьте логи backend и консоль браузера!
