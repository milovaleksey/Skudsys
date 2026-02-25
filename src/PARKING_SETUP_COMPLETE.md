# ✅ Динамическая система парковок - Готово!

## 🎉 Что создано

### Frontend
- ✅ `/hooks/useParkingMQTT.ts` - хук для работы с MQTT парковок
- ✅ `/components/ParkingPage.tsx` - обновленная страница с MQTT

### Backend
- ✅ `/backend/src/services/parking-mqtt.service.js` - MQTT сервис для парковок
- ✅ `/backend/src/websocket/parking.ws.js` - WebSocket обработчик
- ✅ `/backend/src/server.js` - обновлен для поддержки parking WebSocket

### Конфигурация и данные
- ✅ `parking-config.json` - конфигурация 3 парковок
- ✅ `parking-k1-vehicles.json` - 8 автомобилей на К1
- ✅ `parking-k5-vehicles.json` - 6 автомобилей на К5
- ✅ `parking-central-vehicles.json` - 10 автомобилей на Центральной

### Скрипты
- ✅ `parking-publish.sh` - публикация конфигурации (Linux/Mac)
- ✅ `parking-publish.bat` - публикация конфигурации (Windows)
- ✅ `parking-simulator.sh` - live симулятор обновлений
- ✅ `make-parking-executable.sh` - установка прав доступа

### Документация
- ✅ `PARKING_MQTT_GUIDE.md` - полное руководство
- ✅ `PARKING_SETUP_COMPLETE.md` - этот файл

---

## 🚀 Быстрый старт (3 шага)

### 1. Перезапустите backend

```bash
cd backend
npm start
```

**Проверьте в логах:**
```
✅ Подключено к MySQL
🚀 Сервер запущен на порту 3000
[Parking WS] ✅ WebSocket сервер для парковок инициализирован
🔌 Подключение к Parking MQTT брокеру...
[Parking MQTT] ✅ Подключено к брокеру
```

### 2. Опубликуйте конфигурацию

```bash
# Сделайте скрипты исполняемыми
chmod +x make-parking-executable.sh
./make-parking-executable.sh

# Опубликуйте парковки
./parking-publish.sh
```

**Результат:**
```
✅ Конфигурация опубликована (3 парковки)!
✅ Парковка К1: 8 автомобилей
✅ Парковка К5: 6 автомобилей
✅ Центральная парковка: 10 автомобилей
```

### 3. Откройте страницу

Перейдите в раздел **"Парковочная система"** и увидите:

```
✅ Система парковок подключена 🟢

Всего парковок: 3
Всего мест: 165
Занято мест: 24 / 165

┌─────────────────────────────────────────┐
│ 🚗 Парковка К1                          │
│    📍 ул. Володарского, 6               │
│                                         │
│    8 / 50                               │
│    ▓▓░░░░░░░░ 16.0% загрузка           │
│    [Поиск...] [Развернуть таблицу (8)] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🚗 Парковка К5                          │
│    📍 ул. Ленина, 25                    │
│                                         │
│    6 / 40                               │
│    ▓▓░░░░░░░░ 15.0% загрузка           │
│    [Поиск...] [Развернуть таблицу (6)] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🚗 Центральная парковка                 │
│    📍 ул. Республики, 47                │
│                                         │
│    10 / 75                              │
│    ▓▓░░░░░░░░ 13.3% загрузка           │
│    [Поиск...] [Развернуть таблицу (10)]│
└─────────────────────────────────────────┘
```

---

## 🔄 Live демонстрация

Запустите симулятор для живых обновлений:

```bash
./parking-simulator.sh
```

**Эффект:**
- Каждые 5 секунд обновляются данные
- Количество автомобилей меняется случайным образом
- Карточки обновляются без перезагрузки ⚡
- Процент загрузки пересчитывается автоматически

```
[16:00:00] 🚗 Обновлено:
           К1: 10/50 | К5: 7/40 | Центральная: 12/75
           Всего: 29/165 (17.6% загрузка)

[16:00:05] 🚗 Обновлено:
           К1: 9/50 | К5: 8/40 | Центральная: 11/75
           Всего: 28/165 (17.0% загрузка)
```

---

## 📊 Формат данных

### Конфигурация парковок
**Топик:** `Skud/parking/config`

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

### Транспорт на парковке
**Топик:** `Skud/parking/k1/vehicles` (из vehiclesTopic)

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

---

## 🎨 Возможности страницы

### Карточки парковок
- ✅ Название и адрес парковки
- ✅ Текущая загрузка (X / Y мест)
- ✅ Прогресс-бар с цветом:
  - 🟢 < 50% - зеленый
  - 🟡 50-80% - желтый
  - 🔴 > 80% - красный
- ✅ Процент загрузки
- ✅ Количество свободных мест

### Таблица транспорта
- ⏰ Время заезда
- 👤 ФИО владельца
- 📧 UPN (email)
- 🚗 Марка автомобиля
- 🚙 ГРЗ с фирменным фоном #00aeef

### Функции
- 🔍 Поиск по ФИО или ГРЗ
- ↕️ Разворачивание/сворачивание таблицы
- 📊 Общая статистика по всем парковкам
- 🔄 Кнопка переподключения
- ⚡ Real-time обновления

---

## 📝 Примеры использования

### Добавить парковку

```bash
# 1. Добавьте в parking-config.json
{
  "id": "parking_new",
  "name": "Новая парковка",
  "address": "ул. Новая, 1",
  "maxCapacity": 30,
  "vehiclesTopic": "Skud/parking/new/vehicles"
}

# 2. Опубликуйте
mosquitto_pub -t "Skud/parking/config" -f parking-config.json

# 3. Добавьте транспорт
mosquitto_pub -t "Skud/parking/new/vehicles" -m '[]'
```

### Обновить транспорт

```bash
mosquitto_pub -t "Skud/parking/k1/vehicles" -f parking-k1-vehicles.json
```

### Очистить парковку

```bash
mosquitto_pub -t "Skud/parking/k1/vehicles" -m '[]'
```

---

## 🔌 Интеграция с системой

### Python автообновление

```python
import paho.mqtt.publish as publish
import mysql.connector
import json

# Подключение к БД
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="utmn_security"
)

cursor = db.cursor(dictionary=True)

# Получаем активные сессии для К1
cursor.execute("""
    SELECT 
        DATE_FORMAT(entry_time, '%Y-%m-%d %H:%i:%s') as entryTime,
        full_name as fullName,
        upn,
        car_brand as carBrand,
        license_plate as licensePlate
    FROM parking_sessions
    WHERE parking_id = 'k1' AND exit_time IS NULL
""")

vehicles = cursor.fetchall()

# Публикуем в MQTT
publish.single(
    "Skud/parking/k1/vehicles",
    json.dumps(vehicles, ensure_ascii=False),
    hostname="localhost"
)

print(f"✅ Опубликовано {len(vehicles)} автомобилей")
```

### Cron для автообновления

```bash
# /opt/parking-updater.sh
#!/bin/bash
for parking in k1 k5 central; do
    VEHICLES=$(mysql -u root -pPASSWORD -D utmn_security -se "
        SELECT JSON_ARRAYAGG(JSON_OBJECT(...))
        FROM parking_sessions
        WHERE parking_id = '$parking' AND exit_time IS NULL
    ")
    
    mosquitto_pub -t "Skud/parking/$parking/vehicles" -m "$VEHICLES"
done
```

Добавить в crontab (каждую минуту):
```bash
* * * * * /opt/parking-updater.sh
```

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| WebSocket не подключается | Перезапустите backend, проверьте логи |
| Парковки не отображаются | Опубликуйте конфигурацию: `./parking-publish.sh` |
| Транспорт не обновляется | Проверьте mosquitto: `systemctl status mosquitto` |
| Ошибка CORS | Проверьте `/backend/.env`, должен быть `CORS_ORIGIN` |

### Отладка

```bash
# Смотрим конфигурацию
mosquitto_sub -t "Skud/parking/config" -C 1

# Смотрим весь транспорт
mosquitto_sub -t "Skud/parking/+/vehicles" -v

# Смотрим все топики парковок
mosquitto_sub -t "Skud/parking/#" -v
```

---

## 📋 Чеклист готовности

- [x] ✅ Frontend компоненты созданы
- [x] ✅ Backend сервис создан
- [x] ✅ WebSocket настроен
- [x] ✅ Конфигурационные файлы готовы
- [x] ✅ Скрипты публикации созданы
- [x] ✅ Симулятор готов
- [x] ✅ Документация написана
- [ ] 🔧 Backend перезапущен
- [ ] 📡 Конфигурация опубликована
- [ ] 🌐 Страница показывает парковки
- [ ] ⚡ WebSocket подключен

---

## 🎯 Следующие шаги

1. **Перезапустите backend** для загрузки нового кода
2. **Опубликуйте конфигурацию** `./parking-publish.sh`
3. **Проверьте страницу** "Парковочная система"
4. **Запустите симулятор** `./parking-simulator.sh` для демо
5. **Интегрируйте с БД** для автообновления

---

## 📖 Документация

Читайте **PARKING_MQTT_GUIDE.md** для:
- Детального описания формата
- Примеров интеграции
- Продвинутых сценариев
- Troubleshooting

---

## 🎉 Готово к использованию!

Система парковок полностью готова:
- ⚡ Real-time обновления через WebSocket
- 📊 Автоматический подсчет загрузки
- 🔍 Поиск по ФИО и ГРЗ
- 🎨 Фирменный дизайн ТюмГУ (#00aeef)
- 🚗 Неограниченное количество парковок
- 📱 Адаптивная верстка

**Запускайте и наслаждайтесь!** 💪
