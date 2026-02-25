# 🚗 Динамическая система парковок через MQTT

## 🎯 Что это?

Система позволяет динамически настраивать парковки через MQTT. Парковки и список транспорта обновляются в реальном времени без перезагрузки страницы!

## 📡 Формат конфигурации

### Топик: `Skud/parking/config`

```json
{
  "parkings": [
    {
      "id": "parking_k1",
      "name": "Парковка К1",
      "address": "ул. Володарского, 6",
      "maxCapacity": 50,
      "vehiclesTopic": "Skud/parking/k1/vehicles"
    }
  ]
}
```

**Поля:**
- `id` - уникальный идентификатор парковки
- `name` - название парковки
- `address` - адрес парковки
- `maxCapacity` - максимальное количество мест
- `vehiclesTopic` - топик MQTT где будет список транспорта

### Топик с транспортом: `vehiclesTopic`

```json
[
  {
    "entryTime": "2026-02-25 08:15:32",
    "fullName": "Иванов Иван Иванович",
    "upn": "ivanov@utmn.ru",
    "carBrand": "Toyota Camry",
    "licensePlate": "А123АА72"
  }
]
```

**Поля:**
- `entryTime` - время заезда
- `fullName` - ФИО владельца
- `upn` - логин/email
- `carBrand` - марка автомобиля
- `licensePlate` - государственный регистрационный знак

---

## 🚀 Быстрый старт

### Шаг 1: Сделайте скрипты исполняемыми

```bash
chmod +x parking-publish.sh
chmod +x parking-simulator.sh
```

### Шаг 2: Опубликуйте конфигурацию

```bash
./parking-publish.sh
```

**Результат:**
- 3 парковки настроены
- Парковка К1: 8 автомобилей
- Парковка К5: 6 автомобилей
- Центральная: 10 автомобилей

### Шаг 3: Откройте страницу

Перейдите в раздел **"Парковочная система"** и увидите:
- ✅ "Система парковок подключена" 🟢
- 📊 3 парковки с данными
- 🚗 Списки транспорта с поиском

---

## 🔄 Live обновления

### Запустите симулятор

```bash
./parking-simulator.sh
```

Каждые 5 секунд:
- Случайно добавляются/удаляются автомобили
- Карточки обновляются автоматически ⚡
- Процент загрузки пересчитывается

```
[15:30:15] 🚗 Обновлено:
           К1: 10/50 | К5: 7/40 | Центральная: 12/75
           Всего: 29/165 (17.6% загрузка)

[15:30:20] 🚗 Обновлено:
           К1: 9/50 | К5: 8/40 | Центральная: 11/75
           Всего: 28/165 (17.0% загрузка)
```

---

## 📝 Примеры использования

### Добавить новую парковку

1. Отредактируйте `parking-config.json`:

```json
{
  "parkings": [
    {
      "id": "parking_new",
      "name": "Новая парковка",
      "address": "ул. Ваша, 1",
      "maxCapacity": 30,
      "vehiclesTopic": "Skud/parking/new/vehicles"
    }
  ]
}
```

2. Опубликуйте конфигурацию:

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/parking/config" \
  -f parking-config.json
```

3. Опубликуйте транспорт:

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/parking/new/vehicles" \
  -m '[{"entryTime":"2026-02-25 15:00:00","fullName":"Тестовый пользователь","upn":"test@utmn.ru","carBrand":"Test Car","licensePlate":"Т123ТТ72"}]'
```

### Обновить транспорт на парковке

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/parking/k1/vehicles" \
  -f parking-k1-vehicles.json
```

### Очистить парковку (все выехали)

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/parking/k1/vehicles" \
  -m '[]'
```

---

## 🔌 Интеграция

### Python пример

```python
import paho.mqtt.publish as publish
import json

# Конфигурация парковок
config = {
    "parkings": [
        {
            "id": "parking_k1",
            "name": "Парковка К1",
            "address": "ул. Володарского, 6",
            "maxCapacity": 50,
            "vehiclesTopic": "Skud/parking/k1/vehicles"
        }
    ]
}

# Публикуем конфигурацию
publish.single(
    "Skud/parking/config",
    json.dumps(config, ensure_ascii=False),
    hostname="localhost"
)

# Публикуем транспорт
vehicles = [
    {
        "entryTime": "2026-02-25 15:00:00",
        "fullName": "Иванов И.И.",
        "upn": "ivanov@utmn.ru",
        "carBrand": "Toyota Camry",
        "licensePlate": "А123АА72"
    }
]

publish.single(
    "Skud/parking/k1/vehicles",
    json.dumps(vehicles, ensure_ascii=False),
    hostname="localhost"
)
```

### Node.js пример

```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  // Публикуем конфигурацию
  const config = {
    parkings: [{
      id: 'parking_k1',
      name: 'Парковка К1',
      address: 'ул. Володарского, 6',
      maxCapacity: 50,
      vehiclesTopic: 'Skud/parking/k1/vehicles'
    }]
  };
  
  client.publish('Skud/parking/config', JSON.stringify(config));
  
  // Публикуем транспорт
  const vehicles = [{
    entryTime: '2026-02-25 15:00:00',
    fullName: 'Иванов И.И.',
    upn: 'ivanov@utmn.ru',
    carBrand: 'Toyota Camry',
    licensePlate: 'А123АА72'
  }];
  
  client.publish('Skud/parking/k1/vehicles', JSON.stringify(vehicles));
  
  client.end();
});
```

### Автоматическое обновление из БД

```bash
#!/bin/bash
# parking-updater.sh

# Получаем список парковочных сессий из БД
VEHICLES=$(mysql -u root -pPASSWORD -D utmn_security -se "
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'entryTime', DATE_FORMAT(entry_time, '%Y-%m-%d %H:%i:%s'),
      'fullName', full_name,
      'upn', upn,
      'carBrand', car_brand,
      'licensePlate', license_plate
    )
  )
  FROM parking_sessions
  WHERE exit_time IS NULL AND parking_id = 'k1'
")

# Публикуем в MQTT
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/parking/k1/vehicles" \
  -m "$VEHICLES"
```

Добавьте в cron (каждую минуту):
```bash
* * * * * /opt/parking-updater.sh
```

---

## 🎨 Возможности страницы

### Отображение
- ✅ Динамические карточки парковок
- ✅ Название и адрес парковки
- ✅ Загрузка с цветовым индикатором:
  - 🟢 Зеленый: < 50%
  - 🟡 Желтый: 50-80%
  - 🔴 Красный: > 80%
- ✅ Свободные места
- ✅ Процент загрузки

### Таблица транспорта
- ✅ Время заезда
- ✅ ФИО владельца
- ✅ UPN (логин)
- ✅ Марка автомобиля
- ✅ ГРЗ (с фирменным фоном #00aeef)

### Функции
- 🔍 Поиск по ФИО или ГРЗ
- ↕️ Разворачивание/сворачивание таблицы
- 📊 Общая статистика по всем парковкам
- 🔄 Кнопка переподключения
- ⚡ Live обновления

---

## 🐛 Отладка

### Проверить конфигурацию

```bash
mosquitto_sub -h localhost -p 1883 -t "Skud/parking/config" -C 1
```

### Проверить транспорт

```bash
mosquitto_sub -h localhost -p 1883 -t "Skud/parking/+/vehicles" -v
```

### Проверить все топики парковок

```bash
mosquitto_sub -h localhost -p 1883 -t "Skud/parking/#" -v
```

### Проверить WebSocket

Откройте консоль браузера (F12) и найдите:
```
[Parking WebSocket] Подключено
[Parking WebSocket] Получена конфигурация парковок: 3
```

---

## 📊 Структура топиков

```
Skud/
└── parking/
    ├── config                    # Конфигурация всех парковок
    ├── k1/
    │   └── vehicles              # Транспорт на К1
    ├── k5/
    │   └── vehicles              # Транспорт на К5
    └── central/
        └── vehicles              # Транспорт на Центральной
```

---

## ✅ Чеклист

- [ ] Backend запущен
- [ ] Mosquitto запущен
- [ ] Скрипты исполняемые (`chmod +x parking-publish.sh`)
- [ ] Конфигурация опубликована (`./parking-publish.sh`)
- [ ] Страница показывает "Система парковок подключена"
- [ ] Парковки отображаются с данными
- [ ] Таблицы разворачиваются
- [ ] Поиск работает

---

## 🎉 Готово!

Теперь у вас динамическая система парковок:
- ⚡ Real-time обновления через WebSocket
- 📊 Автоматический подсчет загрузки
- 🔍 Поиск по транспорту
- 🎨 Фирменный стиль ТюмГУ (#00aeef)
- 🚗 Неограниченное количество парковок

**Файлы:**
- `parking-config.json` - конфигурация
- `parking-*-vehicles.json` - примеры транспорта
- `parking-publish.sh` - скрипт публикации
- `parking-simulator.sh` - live симулятор
