# 🧪 Тестирование MQTT парковки

## ✅ Backend исправлен!

**Что было исправлено:**
1. ✅ Добавлен обработчик `client.on('message')` - теперь MQTT сообщения обрабатываются
2. ✅ Использование правильных переменных `PARKING_MQTT_*` из `.env`
3. ✅ Поддержка двух форматов JSON: `[...]` и `{ parkings: [...] }`
4. ✅ Детальное логирование для отладки

---

## 🚀 Перезапустите backend:

```bash
cd /var/www/utmn-security/debug/backend
# Ctrl+C
npm start
```

**Теперь в логах должно появиться:**
```
[Parking MQTT] 📨 Получено сообщение из топика: Skud/parking/config
[Parking MQTT] 📦 Payload: [{"id":"central"...
[Parking MQTT] 📊 Получена конфигурация: 3 парковок
[Parking MQTT] 📝 Парковки: central, k1, k5
[Parking MQTT] ✅ Подписка на Skud/parking/central/vehicles
```

---

## 📨 Тестовые сообщения MQTT

### 1. Конфигурация парковок (топик: `Skud/parking/config`)

**Формат 1 (массив):**
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
  },
  {
    "id": "k5",
    "name": "Парковка К5",
    "address": "ул. Мельникайте, д. 70",
    "maxCapacity": 80,
    "vehiclesTopic": "Skud/parking/k5/vehicles"
  }
]
```

**Формат 2 (объект с массивом):**
```json
{
  "parkings": [
    {
      "id": "central",
      "name": "Центральная парковка",
      "address": "ул. Володарского, д. 6",
      "maxCapacity": 100,
      "vehiclesTopic": "Skud/parking/central/vehicles"
    }
  ]
}
```

---

### 2. Транспорт парковки (топик: `Skud/parking/central/vehicles`)

```json
[
  {
    "entryTime": "2026-03-02T08:30:00Z",
    "fullName": "Иванов Иван Иванович",
    "upn": "i.i.ivanov@utmn.ru",
    "carBrand": "Toyota Camry",
    "licensePlate": "А123БВ777"
  },
  {
    "entryTime": "2026-03-02T09:15:00Z",
    "fullName": "Петров Петр Петрович",
    "upn": "p.p.petrov@utmn.ru",
    "carBrand": "Hyundai Solaris",
    "licensePlate": "В456ГД777"
  },
  {
    "entryTime": "2026-03-02T10:00:00Z",
    "fullName": "Сидорова Анна Сергеевна",
    "upn": "a.s.sidorova@utmn.ru",
    "carBrand": "Kia Rio",
    "licensePlate": "С789ЕЖ777"
  }
]
```

---

## 🔧 Как отправить через MQTT:

### Вариант 1: mosquitto_pub (командная строка)

**1. Отправить конфигурацию:**
```bash
mosquitto_pub -h 10.101.221.198 -p 1883 \
  -t "Skud/parking/config" \
  -m '[{"id":"central","name":"Центральная парковка","address":"ул. Володарского, д. 6","maxCapacity":100,"vehiclesTopic":"Skud/parking/central/vehicles"}]'
```

**2. Отправить транспорт:**
```bash
mosquitto_pub -h 10.101.221.198 -p 1883 \
  -t "Skud/parking/central/vehicles" \
  -m '[{"entryTime":"2026-03-02T08:30:00Z","fullName":"Иванов Иван Иванович","upn":"i.i.ivanov@utmn.ru","carBrand":"Toyota Camry","licensePlate":"А123БВ777"}]'
```

---

### Вариант 2: MQTT Explorer (GUI)

1. Подключитесь к `10.101.221.198:1883`
2. Нажмите "Publish"
3. Topic: `Skud/parking/config`
4. Message: (вставьте JSON из примера)
5. Нажмите "Publish"

---

### Вариант 3: Python скрипт

```python
import paho.mqtt.client as mqtt
import json

# Подключение
client = mqtt.Client()
client.connect("10.101.221.198", 1883, 60)

# Конфигурация
config = [
    {
        "id": "central",
        "name": "Центральная парковка",
        "address": "ул. Володарского, д. 6",
        "maxCapacity": 100,
        "vehiclesTopic": "Skud/parking/central/vehicles"
    }
]

client.publish("Skud/parking/config", json.dumps(config))

# Транспорт
vehicles = [
    {
        "entryTime": "2026-03-02T08:30:00Z",
        "fullName": "Иванов Иван Иванович",
        "upn": "i.i.ivanov@utmn.ru",
        "carBrand": "Toyota Camry",
        "licensePlate": "А123БВ777"
    }
]

client.publish("Skud/parking/central/vehicles", json.dumps(vehicles))

client.disconnect()
```

---

## 🧪 Проверка результата:

### 1. Логи backend должны показать:

```
[Parking MQTT] 📨 Получено сообщение из топика: Skud/parking/config
[Parking MQTT] 📦 Payload: [{"id":"central","name":"Центральная парковка"...
[Parking MQTT] 📊 Получена конфигурация: 1 парковок
[Parking MQTT] 📝 Парковки: central
[Parking MQTT] ✅ Подписка на Skud/parking/central/vehicles
[Parking MQTT] Отправлено 2 клиентам (ошибок: 0)
```

```
[Parking MQTT] 📨 Получено сообщение из топика: Skud/parking/central/vehicles
[Parking MQTT] 📦 Payload: [{"entryTime":"2026-03-02T08:30:00Z"...
[Parking MQTT] 🚗 Обновление Центральная парковка: 1 автомобилей
[Parking MQTT] Отправлено 2 клиентам (ошибок: 0)
```

---

### 2. В консоли браузера (F12):

```
[Parking WebSocket] Получена конфигурация парковок: (1) [{…}]
[Parking WebSocket] Обновление транспорта: central 1
```

---

### 3. На странице парковки:

Должна появиться карточка "Центральная парковка" с одним автомобилем!

---

## ⚠️ Если ничего не происходит:

### 1. Проверьте, что backend получает сообщения:

В логах должно быть:
```
[Parking MQTT] 📨 Получено сообщение из топика: ...
```

**Если этого НЕТ:**
- Backend не подписан на топик
- MQTT брокер не передает сообщения
- Проверьте топик (возможно опечатка)

---

### 2. Проверьте формат JSON:

**Backend покажет ошибку если JSON невалидный:**
```
[Parking MQTT] ❌ Ошибка обработки сообщения: SyntaxError: Unexpected token
[Parking MQTT] Payload: {...}
```

**Проверьте JSON:**
```bash
echo '[{"id":"test"}]' | jq .
```

---

### 3. Проверьте топики:

**Конфигурация должна иметь правильный `vehiclesTopic`:**
```json
{
  "id": "central",
  "vehiclesTopic": "Skud/parking/central/vehicles"  ← ВАЖНО!
}
```

Если `vehiclesTopic` неправильный - backend не подпишется на него!

---

## 📁 Файлы для тестирования:

Сохраните JSON в файлы:

**config.json:**
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

**vehicles.json:**
```json
[
  {
    "entryTime": "2026-03-02T08:30:00Z",
    "fullName": "Иванов Иван Иванович",
    "upn": "i.i.ivanov@utmn.ru",
    "carBrand": "Toyota Camry",
    "licensePlate": "А123БВ777"
  }
]
```

**Отправьте:**
```bash
mosquitto_pub -h 10.101.221.198 -t "Skud/parking/config" -f config.json
mosquitto_pub -h 10.101.221.198 -t "Skud/parking/central/vehicles" -f vehicles.json
```

---

## ✅ Готово!

После отправки сообщений вы должны увидеть:

1. ✅ Логи в backend
2. ✅ Данные в консоли браузера
3. ✅ Карточки парковок на странице
4. ✅ Список автомобилей

🎉 **Парковка работает!**
