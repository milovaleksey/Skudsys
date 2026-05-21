# ✅ РЕШЕНИЕ: Почему не появляются данные на странице Storage

## 🐛 Проблема:

Вы отправили сообщение:
```json
{
    "topic": "storage/k1/grbot1/status",
    "status": "active",
    "systemId": 1,
    "systemName": "Гардеробот",
    "timestamp": "2026-03-03T15:25:36.240Z"
}
```

Но на странице ничего не появилось!

---

## 🎯 Причина:

### **1. Неправильный порядок - сначала нужна КОНФИГУРАЦИЯ!**

Backend Storage MQTT работает так:
```
1️⃣ Сначала получить конфигурацию через топик "storage/config"
2️⃣ Backend подписывается на топики из конфигурации
3️⃣ Потом приходят обновления статуса и занятости
```

### **2. Неправильный формат сообщения**

❌ **Ваше сообщение (неправильно):**
```json
{
    "topic": "storage/k1/grbot1/status",
    "status": "active",
    "systemId": 1,
    "systemName": "Гардеробот",
    "timestamp": "2026-03-03T15:25:36.240Z"
}
```

✅ **Правильный формат для статуса:**
```bash
# Просто текст "active", без JSON!
mosquitto_pub -t "storage/k1/grbot1/status" -m "active"
```

✅ **Правильный формат для занятости:**
```bash
# Просто число, без JSON!
mosquitto_pub -t "storage/k1/grbot1/occupancy" -m "35"
```

### **3. Неправильные названия полей**

Backend ожидает:
- `mqtt_topic_status` (с подчеркиванием)
- `mqtt_topic_occupancy` (с подчеркиванием)
- `total_capacity` (с подчеркиванием)

А не:
- ~~`mqttTopicStatus`~~ (camelCase)
- ~~`totalCapacity`~~ (camelCase)

---

## 🚀 РЕШЕНИЕ: 3 шага

### **Шаг 1: Отправить конфигурацию**

```bash
cd /var/www/utmn-security/debug

# Сделать скрипт исполняемым
chmod +x send_garderobbot_config.sh

# Запустить
./send_garderobbot_config.sh
```

**Что делает скрипт:**
1. ✅ Отправляет конфигурацию в топик `storage/config`
2. ✅ Отправляет занятость: 35/100
3. ✅ Отправляет статус: active

---

### **Шаг 2: Проверить логи backend**

После запуска скрипта должны появиться логи:

```
[INFO] Storage MQTT message received on storage/config
📦 Received storage configuration with 1 systems
✅ Subscribed to storage topic: storage/k1/grbot1/status
✅ Subscribed to storage topic: storage/k1/grbot1/occupancy
✅ Storage configuration updated: 1 systems loaded
[INFO] Broadcasting storage config to 1 clients
```

---

### **Шаг 3: Проверить консоль браузера**

В консоли браузера (F12) должно появиться:

```javascript
[Storage WebSocket] Подключено
[Storage WebSocket] Получена конфигурация систем хранения: [...]
[Storage WebSocket] Обновление занятости: {occupiedCount: 35, ...}
[Storage WebSocket] Обновление статуса: {status: "active", ...}
```

И на странице появится карточка "Гардеробот"! 🎉

---

## 📋 Ручная отправка (если скрипт не работает)

### **1. Отправить конфигурацию:**

```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/config" \
  -m '[
    {
      "id": 1,
      "name": "Гардеробот",
      "type": "clothes",
      "building": "Корпус 1",
      "address": "1 этаж",
      "total_capacity": 100,
      "mqtt_topic_status": "storage/k1/grbot1/status",
      "mqtt_topic_occupancy": "storage/k1/grbot1/occupancy"
    }
  ]' \
  -r
```

⚠️ **Важно:** Флаг `-r` (retain) сохраняет сообщение на брокере

---

### **2. Отправить занятость:**

```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/occupancy" \
  -m "35"
```

---

### **3. Отправить статус:**

```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/status" \
  -m "active"
```

---

## 🔍 Как проверить, что конфигурация сохранена

```bash
# Подписаться на топик конфигурации
mosquitto_sub -h 10.101.221.232 -p 1883 \
  -t "storage/config" \
  -v
```

Должен вывести конфигурацию сразу (если был флаг `-r`)

---

## 📊 Формат данных

### **Конфигурация (`storage/config`):**

✅ **Правильно (массив объектов):**
```json
[
  {
    "id": 1,
    "name": "Гардеробот",
    "type": "clothes",
    "building": "Корпус 1",
    "address": "1 этаж",
    "total_capacity": 100,
    "mqtt_topic_status": "storage/k1/grbot1/status",
    "mqtt_topic_occupancy": "storage/k1/grbot1/occupancy"
  }
]
```

❌ **Неправильно (объект с полем storages):**
```json
{
  "storages": [...]
}
```

---

### **Статус (`storage/k1/grbot1/status`):**

✅ **Правильно (просто текст):**
```bash
mosquitto_pub -t "storage/k1/grbot1/status" -m "active"
```

Возможные значения: `active`, `inactive`, `maintenance`

❌ **Неправильно (JSON):**
```json
{
  "status": "active",
  ...
}
```

---

### **Занятость (`storage/k1/grbot1/occupancy`):**

✅ **Правильно (просто число):**
```bash
mosquitto_pub -t "storage/k1/grbot1/occupancy" -m "35"
```

❌ **Неправильно (JSON):**
```json
{
  "occupiedCount": 35,
  ...
}
```

---

## 🧪 Тестирование в реальном времени

После отправки конфигурации, можно менять данные:

```bash
# Увеличить занятость
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/occupancy" \
  -m "45"

# Изменить на "обслуживание"
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/status" \
  -m "maintenance"

# Вернуть в "активный"
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "storage/k1/grbot1/status" \
  -m "active"
```

**Страница должна обновляться мгновенно!** ⚡

---

## 🐛 Если не работает

### **Проблема: "Backend не получает конфигурацию"**

Проверить:
```bash
# Подписаться на топик и посмотреть, что там
mosquitto_sub -h 10.101.221.232 -p 1883 -t "storage/config" -v
```

Если пусто - отправить с флагом `-r`:
```bash
mosquitto_pub ... -r
```

---

### **Проблема: "Backend не подписывается на топики"**

Проверить логи backend:
```
✅ Subscribed to storage topic: storage/k1/grbot1/status
✅ Subscribed to storage topic: storage/k1/grbot1/occupancy
```

Если нет - проверить конфигурацию (правильные названия полей с подчеркиванием)

---

### **Проблема: "WebSocket не получает данные"**

Проверить консоль браузера:
```javascript
[Storage WebSocket] Получена конфигурация систем хранения: [...]
```

Если нет - перезапустить backend и frontend

---

## ✅ Быстрая команда для запуска всего

```bash
cd /var/www/utmn-security/debug

# Отправить конфигурацию и тестовые данные
chmod +x send_garderobbot_config.sh && ./send_garderobbot_config.sh

# Открыть страницу в браузере
# http://10.101.221.207:3000/storage-systems
```

---

## 🎉 Итого:

1. ✅ **Создан файл:** `/storage_config_garderobbot.json`
2. ✅ **Создан скрипт:** `/send_garderobbot_config.sh`
3. ✅ **Правильный формат:** Массив объектов с полями через подчеркивание
4. ✅ **Правильные данные:** Статус - текст, занятость - число
5. ✅ **Правильный порядок:** Сначала конфигурация, потом обновления

🚀 **Запустите скрипт и увидите Гардеробота на странице!**
