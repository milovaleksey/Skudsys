# Тестирование MQTT аномальных событий

## Описание
Этот документ описывает, как протестировать систему мониторинга аномальных событий СКУД через MQTT топик `Skud/baddialsevent`.

## Архитектура
```
MQTT Broker (mosquitto)
    ↓ (топик: Skud/baddialsevent)
MQTT Service (mqtt.service.js)
    ↓ (событие: 'bad-event')
WebSocket Server (mqtt.ws.js)
    ↓ (WebSocket: ws://localhost:3000/ws/mqtt)
Frontend (EngineeringPage.tsx)
```

## Предварительные требования
1. MQTT брокер должен быть запущен (mosquitto на порту 1883)
2. Backend сервер должен быть запущен (`npm run dev` в `/backend`)
3. Frontend должен быть запущен (`npm run dev` в `/frontend`)

## Тестирование

### Вариант 1: Использование тестового скрипта

#### Одиночное событие:
```bash
cd backend
node test-mqtt-bad-events.js
```

#### Множественные события (5 событий с интервалом 2 секунды):
```bash
cd backend
node test-mqtt-bad-events.js --multiple
```

### Вариант 2: Использование mosquitto_pub

#### Одиночное событие:
```bash
mosquitto_pub -h localhost -p 1883 -t "Skud/baddialsevent" -m '{"time_label":"2025-03-12T10:30:00.000Z","Тип_события":"Проход запрещен","ФИО_пользователя":"Иванов Иван Иванович","UPN":"ivanov@utmn.ru","Zone":"Главное здание","Child_Zone":"Вход А","Device":"Турникет №1","identificator":123456}'
```

#### С авторизацией (если требуется):
```bash
mosquitto_pub -h localhost -p 1883 -u username -P password -t "Skud/baddialsevent" -m '{"time_label":"2025-03-12T10:30:00.000Z","Тип_события":"Карта не найдена","ФИО_пользователя":"Петров Петр Петрович","UPN":"petrov@utmn.ru","Zone":"Учебный корпус 1","Child_Zone":"Вход Б","Device":"Турникет №2","identificator":654321}'
```

### Вариант 3: Использование MQTT Explorer (GUI)
1. Скачайте и установите MQTT Explorer: http://mqtt-explorer.com/
2. Подключитесь к брокеру (localhost:1883)
3. Опубликуйте сообщение в топик `Skud/baddialsevent` с JSON-данными

## Структура данных события

```json
{
  "time_label": "2025-03-12T10:30:00.000Z",
  "Тип_события": "Проход запрещен",
  "ФИО_пользователя": "Иванов Иван Иванович",
  "UPN": "ivanov@utmn.ru",
  "Zone": "Главное здание",
  "Child_Zone": "Вход А",
  "Device": "Турникет №1",
  "identificator": 123456
}
```

### Поля:
- `time_label` (string, ISO 8601): Дата и время события
- `Тип_события` (string): Тип аномального события (например: "Проход запрещен", "Карта не найдена", "Истекший срок доступа")
- `ФИО_пользователя` (string): ФИО пользователя
- `UPN` (string | null): UPN (user principal name)
- `Zone` (string | null): Зона прохода
- `Child_Zone` (string | null): Подзона прохода
- `Device` (string): Название устройства СКУД
- `identificator` (number): ID карты/идентификатора

## Проверка работы

### Backend логи
При получении события в логах backend должны появиться строки:
```
[MQTT] 🚨 Получено аномальное событие из топика Skud/baddialsevent
[MQTT] 🚨 Испускаем событие 'bad-event' для WebSocket клиентов
[WebSocket] 🚨 Рассылка аномальных событий СКУД клиентам
```

### Frontend логи (консоль браузера)
На странице "Инженерный раздел" в консоли браузера должны появиться:
```
[Engineering] Получено WebSocket сообщение: {type: "mqtt-message", topic: "Skud/baddialsevent", data: {...}}
🚨 [Engineering] Получено аномальное событие: {...}
```

### Визуальная проверка
1. Откройте страницу "Инженерный раздел" в браузере
2. Проверьте, что индикатор "MQTT подключен (online)" горит зеленым
3. Опубликуйте тестовое событие (любым из способов выше)
4. Новое событие должно появиться в таблице "Аномальные события СКУД" в реальном времени

## Отладка

### MQTT брокер не подключается
```bash
# Проверьте, запущен ли mosquitto
sudo systemctl status mosquitto

# Проверьте порт
netstat -tuln | grep 1883
```

### WebSocket не подключается
1. Проверьте логи backend на наличие строки: `[MQTT WebSocket] Инициализирован для /ws/mqtt`
2. Проверьте, что токен авторизации есть в localStorage: `localStorage.getItem('auth_token')`
3. Проверьте URL WebSocket в консоли браузера

### События не отображаются на frontend
1. Проверьте, что фильтры не блокируют события (сбросьте фильтры)
2. Проверьте, что события за сегодняшнюю дату (`time_label`)
3. Проверьте консоль браузера на наличие ошибок парсинга JSON

## Переменные окружения

В файле `/backend/.env`:
```env
MQTT_ENABLED=true
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=your_username  # опционально
MQTT_PASSWORD=your_password  # опционально
```

## Известные проблемы

1. **События не приходят в реальном времени**
   - Решение: Перезапустите backend сервер и убедитесь, что MQTT брокер запущен

2. **WebSocket отключается через некоторое время**
   - Решение: Heartbeat отправляется каждые 30 секунд, проверьте сетевые настройки

3. **События дублируются**
   - Решение: Проверьте, что нет нескольких экземпляров backend сервера

## Дополнительные ресурсы

- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
