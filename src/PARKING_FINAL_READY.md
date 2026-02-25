# 🎉 Parking MQTT - Готово к использованию!

## ✅ Что исправлено

1. ✅ Parking MQTT теперь подключается к **внешнему серверу** (использует `MQTT_BROKER`)
2. ✅ Скрипты обновлены для работы с переменными окружения

## 🚀 Запуск (3 шага)

### 1. Перезапустите backend

```bash
cd /var/www/utmn-security/debug/backend
npm start
```

**Проверьте вывод:**
```
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

### 2. Опубликуйте парковки на внешнем MQTT

```bash
cd /var/www/utmn-security/debug

# Экспортируйте адрес MQTT сервера
export MQTT_HOST=10.101.221.232
export MQTT_PORT=1883

# Опубликуйте
chmod +x parking-publish.sh
./parking-publish.sh
```

**Результат:**
```
🚗 Публикация конфигурации парковок...
   Сервер: 10.101.221.232:1883

✅ Конфигурация опубликована (3 парковки)!
✅ Парковка К1: 8 автомобилей
✅ Парковка К5: 6 автомобилей
✅ Центральная парковка: 10 автомобилей
```

### 3. Откройте страницу

Перейдите в **"Парковочная система"** и увидите:
- ✅ "Система парковок подключена" 🟢
- 📊 3 парковки с данными
- 🚗 24 автомобиля

## 🔄 Live обновления

```bash
export MQTT_HOST=10.101.221.232
export MQTT_PORT=1883

./parking-simulator.sh
```

**Эффект:**
```
🔄 Запуск симулятора парковок...
   Сервер: 10.101.221.232:1883

[16:30:15] 🚗 Обновлено:
           К1: 10/50 | К5: 7/40 | Центральная: 12/75
           Всего: 29/165 (17.6% загрузка)
```

## 📝 Использование без переменных окружения

Если хотите hardcode адрес сервера, отредактируйте скрипты:

```bash
nano parking-publish.sh
```

Измените:
```bash
MQTT_HOST="${MQTT_HOST:-10.101.221.232}"  # ваш сервер
MQTT_PORT="${MQTT_PORT:-1883}"
```

## 🎯 Альтернативные способы публикации

### Прямая команда

```bash
mosquitto_pub -h 10.101.221.232 -p 1883 \
  -t "Skud/parking/config" \
  -f parking-config.json
```

### Через переменные окружения

```bash
MQTT_HOST=10.101.221.232 MQTT_PORT=1883 ./parking-publish.sh
```

### Один раз для всей сессии

```bash
# Добавьте в ~/.bashrc
export MQTT_HOST=10.101.221.232
export MQTT_PORT=1883

# Применить
source ~/.bashrc

# Теперь просто:
./parking-publish.sh
```

## 🔍 Проверка подключения

### Backend логи

```bash
cd /var/www/utmn-security/debug/backend
npm start | grep -i parking
```

Должно быть:
```
[Parking WS] ✅ WebSocket сервер для парковок инициализирован
[Parking MQTT] Подключение к брокеру: mqtt://10.101.221.232:1883
[Parking MQTT] ✅ Подключено к брокеру
[Parking MQTT] ✅ Подписка на Skud/parking/config
```

### MQTT топики (на сервере 10.101.221.232)

```bash
# Смотрим все топики парковок
mosquitto_sub -v -t "Skud/parking/#"

# Только конфигурация
mosquitto_sub -v -t "Skud/parking/config"

# Только транспорт
mosquitto_sub -v -t "Skud/parking/+/vehicles"
```

### Frontend консоль (F12)

```
[Parking WebSocket] Подключено
[Parking WebSocket] Получена конфигурация парковок: 3
[Parking WebSocket] Обновление транспорта: parking_k1 8
```

## ⚙️ Конфигурация в .env

Backend использует эти переменные из `/backend/.env`:

```bash
# MQTT брокер (используется для обоих: основного MQTT и Parking MQTT)
MQTT_BROKER=10.101.221.232
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Опционально: отключить Parking MQTT
# PARKING_MQTT_ENABLED=false
```

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| ECONNREFUSED 127.0.0.1:1883 | Проверьте `MQTT_BROKER` в `/backend/.env` |
| Парковки не отображаются | Опубликуйте: `MQTT_HOST=10.101.221.232 ./parking-publish.sh` |
| WebSocket не подключается | Перезапустите backend |
| Нет обновлений | Запустите симулятор: `MQTT_HOST=10.101.221.232 ./parking-simulator.sh` |

## 📊 Структура топиков

```
Skud/
└── parking/
    ├── config                      # Конфигурация всех парковок
    ├── k1/
    │   └── vehicles                # Транспорт на К1
    ├── k5/
    │   └── vehicles                # Транспорт на К5
    └── central/
        └── vehicles                # Транспорт на Центральной
```

## 🎉 Готово!

Теперь система парковок:
- ⚡ Подключается к внешнему MQTT серверу
- 📊 Получает данные в реальном времени
- 🔄 Автоматически обновляется
- 🎨 Сохраняет фирменный стиль ТюмГУ

**Всё работает!** 💪
