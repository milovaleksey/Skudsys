# Диагностика проблем с системой хранения вещей

## Проблема: "Иногда пропадает отображение данных"

### Исправления (5 марта 2026)

#### 1. **Race Condition при переподписке на MQTT топики**
- **Файл**: `/backend/src/services/storage-mqtt.service.js`
- **Проблема**: При получении новой конфигурации backend отписывался от топиков асинхронно, но сразу пытался подписаться на новые - это приводило к блокировке подписок
- **Решение**: 
  - Удаляем топики из Set **до** вызова `unsubscribe()` 
  - Вычисляем разницу между старыми и новыми топиками
  - Отписываемся только от удаленных топиков
  - Подписываемся только на новые топики

#### 2. **Поддержка разных форматов данных**
- **Файл**: `/backend/src/services/storage-mqtt.service.js`
- **Проблема**: Конфигурация может приходить в snake_case (`mqtt_topic_status`) или camelCase (`mqttTopicStatus`)
- **Решение**: Добавлена поддержка обоих форматов при чтении топиков

#### 3. **Защита от потери данных при переподключении**
- **Файл**: `/hooks/useStorageMQTT.ts`
- **Проблема**: При переподключении WebSocket данные пропадали до получения новой конфигурации
- **Решение**: 
  - Используем `useRef` для хранения последних данных
  - При переподключении восстанавливаем данные из кеша
  - Обновляем кеш при каждом изменении данных

#### 4. **Улучшенное логирование**
- **Файл**: `/backend/src/websocket/storage.ws.js`
- **Проблема**: Недостаточно информации для отладки
- **Решение**: Добавлено детальное логирование с количеством систем и клиентов

## Как проверить, что все работает

### 1. Перезапустить backend
```bash
cd /var/www/utmn-security/debug/backend
npm start
```

### 2. Запустить тестовый скрипт MQTT
В новом терминале:
```bash
cd /var/www/utmn-security/debug/backend
node scripts/test-storage-mqtt.js
```

Этот скрипт будет:
- Публиковать конфигурацию с 3 системами хранения
- Обновлять значения занятости каждые 5 секунд
- Периодически менять статусы систем
- Работать 2 минуты и автоматически завершится

### 3. Проверить логи backend

Вы должны увидеть:
```
✅ Connected to Storage MQTT broker
📡 Subscribed to storage configuration topic: storage/config
📦 Received storage configuration with 3 systems
Topics to remove: 0, Topics to add: 6
✅ Subscribed to storage topic: storage/korpusA/wardrobe1/status
✅ Subscribed to storage topic: storage/korpusA/wardrobe1/occupancy
✅ Subscribed to storage topic: storage/korpusB/locker1/status
✅ Subscribed to storage topic: storage/korpusB/locker1/occupancy
✅ Subscribed to storage topic: storage/korpusA/wardrobe2/status
✅ Subscribed to storage topic: storage/korpusA/wardrobe2/occupancy
✅ Storage configuration updated: 3 systems, 6 data topics
✅ Broadcasted storage_config (3 systems) to X clients
```

### 4. Проверить frontend

Откройте страницу "Хранение вещей" и проверьте:
- ✅ Карточки систем отображаются
- ✅ Значения занятости обновляются в реальном времени
- ✅ Статусы меняются
- ✅ При обновлении страницы данные не пропадают

### 5. Проверить консоль браузера

Вы должны увидеть:
```
[Storage WebSocket] Подключено
[Storage WebSocket] Сообщение подключения: Connected to storage updates
[Storage WebSocket] Получена конфигурация систем хранения: (3) [{...}]
[Storage WebSocket] Обновление занятости: {systemId: "storage1", occupiedCount: 15, ...}
```

## Что смотреть при проблемах

### Проблема: Конфигурация не приходит
1. Проверьте, что MQTT broker запущен
2. Проверьте переменные окружения `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`
3. Проверьте логи: `✅ Connected to Storage MQTT broker`

### Проблема: Данные пропадают при переподключении
1. Проверьте консоль браузера на ошибки WebSocket
2. Должно быть сообщение: `[Storage WebSocket] Восстановлены данные после переподключения: X`
3. Проверьте, что backend отправляет конфигурацию при подключении клиента

### Проблема: Занятость не обновляется
1. Проверьте логи MQTT: должны быть сообщения `Storage MQTT message received on storage/.../occupancy`
2. Проверьте, что топики в конфигурации совпадают с топиками в MQTT
3. Проверьте формат данных (должно быть число, не строка)

### Проблема: Постоянная переподписка на топики
1. Если видите циклическую переподписку, проверьте:
   - Не публикуется ли конфигурация слишком часто
   - Не меняется ли конфигурация на каждой публикации
2. Должно быть `Topics to remove: 0, Topics to add: 0` если конфигурация не менялась

## Дополнительные команды

### Проверить подключение к MQTT
```bash
mosquitto_sub -h localhost -t "storage/#" -v
```

### Опубликовать тестовую конфигурацию вручную
```bash
mosquitto_pub -h localhost -t "storage/config" -m '[{"id":"test1","name":"Test","type":"clothes","building":"A","mqtt_topic_status":"storage/test/status","mqtt_topic_occupancy":"storage/test/occupancy","total_capacity":50,"occupied_count":10,"status":"active"}]'
```

### Опубликовать обновление занятости
```bash
mosquitto_pub -h localhost -t "storage/test/occupancy" -m "25"
```

### Проверить WebSocket подключения
```bash
ss -tnp | grep :3000
```

## Контакты для поддержки
При возникновении проблем проверьте:
1. Логи backend: `/var/www/utmn-security/debug/backend/logs/`
2. Логи MQTT broker: зависит от установки
3. Консоль браузера (F12)
