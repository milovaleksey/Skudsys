# 📦 Система хранения вещей - MQTT интеграция

## 🎯 Концепция

Система полностью работает через MQTT без использования базы данных. Все данные (конфигурация систем хранения, занятость, статусы) приходят через MQTT и хранятся в памяти backend сервера.

---

## 📡 MQTT Топики

### 1. Конфигурация систем хранения

**Топик:** `storage/config`

**Назначение:** Отправка полной конфигурации всех систем хранения

**Формат:** JSON массив объектов

**Пример сообщения:**
```json
[
  {
    "id": 1,
    "name": "Гардероб 1",
    "type": "clothes",
    "building": "Корпус А",
    "address": "1 этаж, вход",
    "total_capacity": 50,
    "mqtt_topic_status": "storage/korpusA/wardrobe1/status",
    "mqtt_topic_occupancy": "storage/korpusA/wardrobe1/occupancy"
  },
  {
    "id": 2,
    "name": "Гардероб 2",
    "type": "clothes",
    "building": "Корпус А",
    "address": "2 этаж, рекреация",
    "total_capacity": 40,
    "mqtt_topic_status": "storage/korpusA/wardrobe2/status",
    "mqtt_topic_occupancy": "storage/korpusA/wardrobe2/occupancy"
  },
  {
    "id": 3,
    "name": "Камера хранения 1",
    "type": "items",
    "building": "Корпус А",
    "address": "Цокольный этаж",
    "total_capacity": 30,
    "mqtt_topic_status": "storage/korpusA/locker1/status",
    "mqtt_topic_occupancy": "storage/korpusA/locker1/occupancy"
  },
  {
    "id": 4,
    "name": "Гардероб 1",
    "type": "clothes",
    "building": "Корпус Б",
    "address": "1 этаж, холл",
    "total_capacity": 60,
    "mqtt_topic_status": "storage/korpusB/wardrobe1/status",
    "mqtt_topic_occupancy": "storage/korpusB/wardrobe1/occupancy"
  },
  {
    "id": 5,
    "name": "Камера хранения 1",
    "type": "items",
    "building": "Корпус Б",
    "address": "Подвал",
    "total_capacity": 25,
    "mqtt_topic_status": "storage/korpusB/locker1/status",
    "mqtt_topic_occupancy": "storage/korpusB/locker1/occupancy"
  },
  {
    "id": 6,
    "name": "Гардероб 1",
    "type": "clothes",
    "building": "Корпус В",
    "address": "1 этаж",
    "total_capacity": 45,
    "mqtt_topic_status": "storage/korpusV/wardrobe1/status",
    "mqtt_topic_occupancy": "storage/korpusV/wardrobe1/occupancy"
  },
  {
    "id": 7,
    "name": "Камера хранения 1",
    "type": "items",
    "building": "Корпус В",
    "address": "1 этаж, справа от входа",
    "total_capacity": 20,
    "mqtt_topic_status": "storage/korpusV/locker1/status",
    "mqtt_topic_occupancy": "storage/korpusV/locker1/occupancy"
  }
]
```

**Поля конфигурации:**

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | number | ✅ | Уникальный идентификатор системы |
| `name` | string | ✅ | Название системы (например, "Гардероб 1") |
| `type` | string | ✅ | Тип: `"clothes"` (одежда) или `"items"` (вещи) |
| `building` | string | ✅ | Корпус (например, "Корпус А") |
| `address` | string | ❌ | Адрес/местоположение внутри корпуса |
| `total_capacity` | number | ✅ | Общее количество мест |
| `mqtt_topic_status` | string | ✅ | MQTT топик для статуса системы |
| `mqtt_topic_occupancy` | string | ✅ | MQTT топик для занятости |

**Что происходит при получении конфигурации:**
1. Backend валидирует данные
2. Отписывается от старых топиков
3. Сохраняет новую конфигурацию в памяти
4. Подписывается на новые топики статуса и занятости
5. Отправляет обновление через WebSocket всем подключенным клиентам

---

### 2. Обновление занятости

**Топики:** Указываются в конфигурации (`mqtt_topic_occupancy`)

**Примеры:**
- `storage/korpusA/wardrobe1/occupancy`
- `storage/korpusA/locker1/occupancy`
- `storage/korpusB/wardrobe1/occupancy`

**Формат:** Число (количество занятых мест)

**Примеры сообщений:**
```
25
```
```
42
```
```
0
```

**Диапазон значений:** `0` до `total_capacity`

**Что происходит при получении занятости:**
1. Backend находит систему по топику
2. Обновляет `occupied_count`
3. Обновляет timestamp
4. Отправляет WebSocket обновление клиентам
5. Клиенты автоматически обновляют прогресс-бар

---

### 3. Обновление статуса

**Топики:** Указываются в конфигурации (`mqtt_topic_status`)

**Примеры:**
- `storage/korpusA/wardrobe1/status`
- `storage/korpusA/locker1/status`
- `storage/korpusB/wardrobe1/status`

**Формат:** Строка (статус системы)

**Возможные значения:**
- `active` - Система активна и работает нормально
- `inactive` - Система неактивна/выключена
- `maintenance` - Система на обслуживании/ремонте

**Примеры сообщений:**
```
active
```
```
maintenance
```
```
inactive
```

**Что происходит при получении статуса:**
1. Backend находит систему по топику
2. Обновляет `status`
3. Обновляет timestamp
4. Отправляет WebSocket обновление клиентам
5. Клиенты обновляют иконку и бэдж статуса

---

## 🔧 Примеры использования с mosquitto

### Отправить конфигурацию

```bash
mosquitto_pub -t "storage/config" -m '[
  {
    "id": 1,
    "name": "Гардероб 1",
    "type": "clothes",
    "building": "Корпус А",
    "address": "1 этаж, вход",
    "total_capacity": 50,
    "mqtt_topic_status": "storage/korpusA/wardrobe1/status",
    "mqtt_topic_occupancy": "storage/korpusA/wardrobe1/occupancy"
  },
  {
    "id": 2,
    "name": "Камера хранения 1",
    "type": "items",
    "building": "Корпус А",
    "address": "Цокольный этаж",
    "total_capacity": 30,
    "mqtt_topic_status": "storage/korpusA/locker1/status",
    "mqtt_topic_occupancy": "storage/korpusA/locker1/occupancy"
  }
]'
```

### Обновить занятость

```bash
# Гардероб 1 - занято 25 из 50 мест
mosquitto_pub -t "storage/korpusA/wardrobe1/occupancy" -m "25"

# Камера хранения 1 - занято 12 из 30 мест
mosquitto_pub -t "storage/korpusA/locker1/occupancy" -m "12"
```

### Обновить статус

```bash
# Гардероб 1 - активен
mosquitto_pub -t "storage/korpusA/wardrobe1/status" -m "active"

# Камера хранения 1 - на обслуживании
mosquitto_pub -t "storage/korpusA/locker1/status" -m "maintenance"

# Гардероб 1 - неактивен
mosquitto_pub -t "storage/korpusA/wardrobe1/status" -m "inactive"
```

### Симуляция работы системы

```bash
#!/bin/bash
# Скрипт для симуляции работы гардероба

while true; do
  # Генерируем случайную занятость от 0 до 50
  OCCUPIED=$((RANDOM % 51))
  
  echo "Обновление занятости гардероба: $OCCUPIED/50"
  mosquitto_pub -t "storage/korpusA/wardrobe1/occupancy" -m "$OCCUPIED"
  
  # Ждем 5 секунд
  sleep 5
done
```

---

## 🌐 WebSocket обновления

Backend автоматически отправляет WebSocket сообщения клиентам при любом обновлении.

### Типы WebSocket событий:

#### 1. `storage-config-update`
Отправляется при обновлении конфигурации
```json
{
  "type": "storage-config-update",
  "data": {
    "systemsCount": 7,
    "timestamp": "2026-03-03T14:35:22.000Z"
  },
  "timestamp": "2026-03-03T14:35:22.000Z"
}
```

#### 2. `storage-occupancy`
Отправляется при обновлении занятости
```json
{
  "type": "storage-occupancy",
  "data": {
    "topic": "storage/korpusA/wardrobe1/occupancy",
    "occupiedCount": 25,
    "systemId": 1,
    "systemName": "Гардероб 1",
    "timestamp": "2026-03-03T14:35:22.000Z"
  },
  "timestamp": "2026-03-03T14:35:22.000Z"
}
```

#### 3. `storage-status`
Отправляется при обновлении статуса
```json
{
  "type": "storage-status",
  "data": {
    "topic": "storage/korpusA/wardrobe1/status",
    "status": "active",
    "systemId": 1,
    "systemName": "Гардероб 1",
    "timestamp": "2026-03-03T14:35:22.000Z"
  },
  "timestamp": "2026-03-03T14:35:22.000Z"
}
```

---

## 🚀 Настройка и запуск

### 1. Переменные окружения

В файле `/backend/.env`:

```env
# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Storage MQTT (включено по умолчанию)
STORAGE_MQTT_ENABLED=true
```

### 2. Запуск backend

```bash
cd backend
npm start
```

Вы должны увидеть:
```
✅ Подключено к MySQL
✅ Подключено к базе данных SKUD
✅ Права доступа обновлены
🚀 Сервер запущен на порту 3000
📡 API: http://localhost:3000/v1
🏥 Health: http://localhost:3000/health
✅ Storage WebSocket server initialized on /ws/storage
🔌 Подключение к Storage MQTT брокеру...
✅ Connected to Storage MQTT broker
📡 Subscribed to storage configuration topic: storage/config
```

### 3. Отправка тестовой конфигурации

```bash
mosquitto_pub -t "storage/config" -f storage_config.json
```

Где `storage_config.json`:
```json
[
  {
    "id": 1,
    "name": "Гардероб 1",
    "type": "clothes",
    "building": "Корпус А",
    "address": "1 этаж, вход",
    "total_capacity": 50,
    "mqtt_topic_status": "storage/korpusA/wardrobe1/status",
    "mqtt_topic_occupancy": "storage/korpusA/wardrobe1/occupancy"
  }
]
```

Backend лог:
```
📦 Received storage configuration with 1 systems
✅ Storage configuration updated: 1 systems loaded
✅ Subscribed to storage topic: storage/korpusA/wardrobe1/status
✅ Subscribed to storage topic: storage/korpusA/wardrobe1/occupancy
```

### 4. Тестирование обновлений

```bash
# Занятость
mosquitto_pub -t "storage/korpusA/wardrobe1/occupancy" -m "25"

# Статус
mosquitto_pub -t "storage/korpusA/wardrobe1/status" -m "active"
```

---

## 📊 API Endpoints

Все API endpoints работают в режиме read-only:

### Получить все системы
```http
GET /v1/storage/systems
Authorization: Bearer YOUR_TOKEN
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Гардероб 1",
      "type": "clothes",
      "building": "Корпус А",
      "address": "1 этаж, вход",
      "total_capacity": 50,
      "occupied_count": 25,
      "status": "active",
      "mqtt_topic_status": "storage/korpusA/wardrobe1/status",
      "mqtt_topic_occupancy": "storage/korpusA/wardrobe1/occupancy",
      "updated_at": "2026-03-03T14:35:22.000Z"
    }
  ],
  "total": 1,
  "lastConfigUpdate": "2026-03-03T14:30:00.000Z"
}
```

### Получить систему по ID
```http
GET /v1/storage/systems/1
Authorization: Bearer YOUR_TOKEN
```

### Получить статистику
```http
GET /v1/storage/statistics
Authorization: Bearer YOUR_TOKEN
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_systems": 7,
      "total_capacity": 270,
      "total_occupied": 155,
      "total_available": 115,
      "active_systems": 6,
      "inactive_systems": 1
    },
    "byType": [
      {
        "type": "clothes",
        "count": 4,
        "total_capacity": 195,
        "occupied_count": 120,
        "available_count": 75
      },
      {
        "type": "items",
        "count": 3,
        "total_capacity": 75,
        "occupied_count": 35,
        "available_count": 40
      }
    ],
    "byBuilding": [
      {
        "building": "Корпус А",
        "count": 3,
        "total_capacity": 120,
        "occupied_count": 55,
        "available_count": 65
      }
    ]
  }
}
```

---

## 🎨 Frontend интеграция

Frontend автоматически:
1. Загружает начальную конфигурацию через REST API
2. Подключается к WebSocket `/ws/storage?token=JWT_TOKEN`
3. Получает real-time обновления занятости и статусов
4. Обновляет UI без перезагрузки страницы

### Хук useStorageWebSocket

```typescript
const { isConnected } = useStorageWebSocket({
  onOccupancyUpdate: (data) => {
    // Обновить состояние системы
  },
  onStatusUpdate: (data) => {
    // Обновить статус системы
  }
});
```

---

## ✨ Преимущества MQTT-подхода

✅ **Нет базы данных** - не нужно создавать таблицы, миграции
✅ **Real-time** - мгновенные обновления через MQTT + WebSocket
✅ **Легко масштабируется** - просто добавьте новую систему в конфигурацию
✅ **Гибкость** - можно изменить конфигурацию без рестарта backend
✅ **Простота** - один топик для конфигурации, динамические топики для данных

---

## 🔍 Отладка

### Логи backend

Backend логирует все MQTT события:
- Подключение к брокеру
- Подписки на топики
- Получение сообщений
- Обновления данных
- Отправку WebSocket сообщений

### Мониторинг MQTT

```bash
# Подписка на все топики storage
mosquitto_sub -t "storage/#" -v

# Подписка только на конфигурацию
mosquitto_sub -t "storage/config" -v

# Подписка на занятость всех систем
mosquitto_sub -t "storage/+/+/occupancy" -v

# Подписка на статусы всех систем
mosquitto_sub -t "storage/+/+/status" -v
```

### WebSocket отладка

В браузере (DevTools → Console):
```javascript
// Проверка подключения
console.log('WebSocket connected:', isConnected);

// Последнее сообщение
console.log('Last message:', lastMessage);
```

---

## 📝 Примечания

1. **Данные хранятся только в памяти** - при рестарте backend нужно заново отправить конфигурацию через MQTT
2. **Retain флаг** - рекомендуется использовать retain для топика `storage/config`, чтобы новые клиенты сразу получали конфигурацию
3. **QoS уровень** - используется QoS 1 для гарантии доставки
4. **Валидация** - backend валидирует все обязательные поля конфигурации
5. **Автоматическая подписка** - backend автоматически подписывается/отписывается при обновлении конфигурации

---

## 🎯 Итого

Система полностью работает через MQTT:
- **Конфигурация** → `storage/config` (JSON массив)
- **Занятость** → `storage/{building}/{name}/occupancy` (число)
- **Статус** → `storage/{building}/{name}/status` (строка)

Никаких таблиц в MySQL, никаких миграций - просто отправьте MQTT сообщение и система заработает! 🚀
