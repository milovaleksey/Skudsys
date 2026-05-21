# Foreign Students MQTT Configuration Guide

## Описание

Foreign Students MQTT сервис обрабатывает данные об иностранных студентах через MQTT брокер и предоставляет их через WebSocket.

## Архитектура

```
MQTT Broker (Mosquitto)
    ↓
Foreign Students MQTT Service (/backend/src/services/foreign-students-mqtt.service.js)
    ↓
Foreign Students WebSocket (/backend/src/websocket/foreign-students.ws.js)
    ↓
Frontend Hook (useForeignStudentsMQTT.ts)
```

## Топики MQTT

Сервис подписывается на следующие топики:

1. **Конфигурация карточек**: `Skud/foreign-students/config`
   - Формат: массив объектов StatCard
   - Пример:
   ```json
   [
     {
       "id": "total_foreign_students",
       "title": "Всего иностранных студентов",
       "valueTopic": "Skud/foreign-students/data/total_foreign_students",
       "unit": "",
       "icon": "users"
     }
   ]
   ```

2. **Статистика по странам**: `Skud/foreign-students/stats`
   - Формат: массив объектов CountryStats
   - Пример:
   ```json
   [
     {
       "country": "Китай",
       "students_count": 150
     },
     {
       "country": "Казахстан",
       "students_count": 89
     }
   ]
   ```

3. **Справочник стран**: `Skud/foreign-students/countries`
   - Формат: массив объектов Country
   - Пример:
   ```json
   [
     {
       "code": "CN",
       "name": "Китай"
     },
     {
       "code": "KZ",
       "name": "Казахстан"
     }
   ]
   ```

4. **Данные карточек**: `Skud/foreign-students/data/#`
   - Wildcard для всех значений карточек
   - Пример топика: `Skud/foreign-students/data/total_foreign_students`
   - Формат: строка или число

## Настройка Backend

### 1. Переменные окружения (.env)

Добавьте в файл `/backend/.env`:

```env
# Foreign Students MQTT Configuration
FOREIGN_STUDENTS_MQTT_ENABLED=true
FOREIGN_MQTT_BROKER=localhost
FOREIGN_MQTT_PORT=1883
FOREIGN_MQTT_USERNAME=
FOREIGN_MQTT_PASSWORD=

# Или используйте общие настройки MQTT
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

### 2. Запуск сервиса

Сервис автоматически запускается при старте backend сервера, если `FOREIGN_STUDENTS_MQTT_ENABLED` не установлен в `false`.

## Публикация конфигурации через MQTT

### Установка Mosquitto клиента

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto-clients

# macOS
brew install mosquitto

# Windows
# Скачайте с https://mosquitto.org/download/
```

### Публикация конфигурации карточек

```bash
mosquitto_pub -h localhost -t "Skud/foreign-students/config" -m '[
  {
    "id": "total_foreign_students",
    "title": "Всего иностранных студентов",
    "valueTopic": "Skud/foreign-students/data/total_foreign_students",
    "unit": "",
    "icon": "users"
  },
  {
    "id": "active_students",
    "title": "Активных студентов",
    "valueTopic": "Skud/foreign-students/data/active_students",
    "unit": "",
    "icon": "user-check"
  },
  {
    "id": "countries_count",
    "title": "Стран представлено",
    "valueTopic": "Skud/foreign-students/data/countries_count",
    "unit": "",
    "icon": "globe"
  }
]'
```

### Публикация статистики по странам

```bash
mosquitto_pub -h localhost -t "Skud/foreign-students/stats" -m '[
  {
    "country": "Китай",
    "students_count": 150
  },
  {
    "country": "Казахстан",
    "students_count": 89
  },
  {
    "country": "Узбекистан",
    "students_count": 67
  },
  {
    "country": "Таджикистан",
    "students_count": 45
  },
  {
    "country": "Туркменистан",
    "students_count": 23
  }
]'
```

### Публикация справочника стран

```bash
mosquitto_pub -h localhost -t "Skud/foreign-students/countries" -m '[
  {"code": "CN", "name": "Китай"},
  {"code": "KZ", "name": "Казахстан"},
  {"code": "UZ", "name": "Узбекистан"},
  {"code": "TJ", "name": "Таджикистан"},
  {"code": "TM", "name": "Туркменистан"}
]'
```

### Публикация значений карточек

```bash
# Всего иностранных студентов
mosquitto_pub -h localhost -t "Skud/foreign-students/data/total_foreign_students" -m "374"

# Активных студентов
mosquitto_pub -h localhost -t "Skud/foreign-students/data/active_students" -m "342"

# Стран представлено
mosquitto_pub -h localhost -t "Skud/foreign-students/data/countries_count" -m "15"
```

## Проверка работы

### 1. Проверка подключения к MQTT

Проверьте логи backend:

```bash
cd /backend
npm start

# Должны увидеть:
# [Foreign Students MQTT] Подключение к брокеру: mqtt://localhost:1883
# [Foreign Students MQTT] ✅ Успешно подключено к брокеру
# [Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/config
# [Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/stats
# [Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/countries
# [Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/data/#
```

### 2. Проверка WebSocket

Откройте консоль браузера на странице "Отчет по иностранным студентам":

```
[Foreign Students MQTT] WebSocket connected
[Foreign Students MQTT] Config loaded: 3 cards
[Foreign Students MQTT] Country stats loaded: 5 countries
[Foreign Students MQTT] Countries loaded: 5 countries
```

### 3. Мониторинг MQTT сообщений

```bash
# Подписка на все топики Foreign Students
mosquitto_sub -h localhost -t "Skud/foreign-students/#" -v
```

## Устранение проблем

### Backend молчит при публикации конфигурации

1. **Проверьте, что MQTT брокер запущен:**
   ```bash
   sudo systemctl status mosquitto
   # или
   ps aux | grep mosquitto
   ```

2. **Проверьте подключение к брокеру:**
   ```bash
   mosquitto_pub -h localhost -t "test" -m "hello"
   ```

3. **Проверьте логи backend:**
   ```bash
   # Должны увидеть сообщение о подключении
   [Foreign Students MQTT] ✅ Успешно подключено к брокеру
   ```

4. **Проверьте переменные окружения:**
   ```bash
   # В /backend/.env должно быть:
   FOREIGN_STUDENTS_MQTT_ENABLED=true
   MQTT_BROKER=localhost
   ```

5. **Проверьте, что сервис запущен:**
   ```bash
   # В логах при старте должно быть:
   🔌 Подключение к Foreign Students MQTT брокеру...
   ```

### WebSocket не подключается

1. **Проверьте, что WebSocket сервер инициализирован:**
   ```bash
   # В логах должно быть:
   [Foreign Students WebSocket] Инициализирован для /ws
   ```

2. **Проверьте путь WebSocket в frontend:**
   ```typescript
   // В useForeignStudentsMQTT.ts должно быть:
   const wsUrl = `${protocol}//${window.location.host}/ws`;
   ```

3. **Проверьте, что backend обрабатывает путь /ws:**
   ```bash
   # В логах при подключении должно быть:
   [Foreign Students WebSocket] Новое подключение
   ```

## Пример полной настройки

### Шаг 1: Запустите MQTT брокер

```bash
sudo systemctl start mosquitto
```

### Шаг 2: Настройте backend

Добавьте в `/backend/.env`:
```env
FOREIGN_STUDENTS_MQTT_ENABLED=true
MQTT_BROKER=localhost
MQTT_PORT=1883
```

### Шаг 3: Запустите backend

```bash
cd /backend
npm start
```

### Шаг 4: Опубликуйте конфигурацию

```bash
# Создайте файл config.json
cat > /tmp/foreign-students-config.json << 'EOF'
[
  {
    "id": "total_foreign_students",
    "title": "Всего иностранных студентов",
    "valueTopic": "Skud/foreign-students/data/total_foreign_students",
    "unit": "",
    "icon": "users"
  },
  {
    "id": "active_students",
    "title": "Активных студентов",
    "valueTopic": "Skud/foreign-students/data/active_students",
    "unit": "",
    "icon": "user-check"
  },
  {
    "id": "countries_count",
    "title": "Стран представлено",
    "valueTopic": "Skud/foreign-students/data/countries_count",
    "unit": "",
    "icon": "globe"
  }
]
EOF

# Опубликуйте
mosquitto_pub -h localhost -t "Skud/foreign-students/config" -f /tmp/foreign-students-config.json
```

### Шаг 5: Опубликуйте данные

```bash
mosquitto_pub -h localhost -t "Skud/foreign-students/data/total_foreign_students" -m "374"
mosquitto_pub -h localhost -t "Skud/foreign-students/data/active_students" -m "342"
mosquitto_pub -h localhost -t "Skud/foreign-students/data/countries_count" -m "15"
```

### Шаг 6: Откройте frontend

Откройте страницу "Отчет по иностранным студентам" и проверьте, что данные отображаются.

## Автоматизация публикации

Вы можете создать скрипт для автоматической публикации конфигурации:

```bash
#!/bin/bash
# /backend/scripts/publish-foreign-students-config.sh

MQTT_HOST="localhost"
MQTT_PORT=1883

echo "Публикация конфигурации Foreign Students MQTT..."

# Конфигурация карточек
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/foreign-students/config" \
  -f /path/to/config.json

# Статистика по странам
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/foreign-students/stats" \
  -f /path/to/stats.json

# Справочник стран
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/foreign-students/countries" \
  -f /path/to/countries.json

echo "Готово!"
```

## Интеграция с базой данных

Для автоматического обновления данных можно создать скрипт, который периодически запрашивает данные из базы СКУД и публикует их в MQTT:

```javascript
// /backend/scripts/update-foreign-students-data.js
const foreignStudentsMQTTService = require('../src/services/foreign-students-mqtt.service');
const { getSkudConnection } = require('../src/config/skudDatabase');

async function updateForeignStudentsData() {
  const connection = getSkudConnection();
  
  // Получаем общее количество иностранных студентов
  const [totalResult] = await connection.query(
    'SELECT COUNT(*) as total FROM students WHERE is_foreign = 1'
  );
  
  // Публикуем
  foreignStudentsMQTTService.publish(
    'Skud/foreign-students/data/total_foreign_students',
    totalResult[0].total.toString()
  );
  
  // ... аналогично для других метрик
}

// Запускаем каждую минуту
setInterval(updateForeignStudentsData, 60000);
```

## Поддержка

Если возникли проблемы, проверьте:
1. Логи backend (`npm start`)
2. Логи MQTT брокера (`sudo journalctl -u mosquitto -f`)
3. Консоль браузера (F12)
