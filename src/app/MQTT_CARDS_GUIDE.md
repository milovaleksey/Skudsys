# 📊 Настройка карточек для общежитий, студентов и сотрудников

## 🎯 Что мы настроим

- ✅ **2 общие карточки**: Всего студентов, Всего сотрудников
- ✅ **6 карточек общежитий**: Общежития №1-6 с количеством проживающих

## 📋 Формат конфигурации

### Структура карточки

```json
{
  "id": "уникальный_идентификатор",
  "title": "Заголовок карточки",
  "subtitle": "Подзаголовок",
  "icon": "иконка",
  "color": "#цвет_HEX",
  "topic": "MQTT/топик/для/значения"
}
```

### Доступные иконки

- `users` - группа людей
- `briefcase` - портфель (сотрудники)
- `building` - здание (общежития)
- `home` - дом
- `school` - школа
- `user` - один человек
- `user-check` - человек с галочкой
- `map-pin` - локация
- `car` - машина
- `package` - пакет

### Цвета (примеры)

- `#00aeef` - синий (фирменный ТюмГУ)
- `#10b981` - зеленый
- `#f59e0b` - оранжевый
- `#8b5cf6` - фиолетовый
- `#ec4899` - розовый
- `#06b6d4` - голубой
- `#f97316` - оранжево-красный
- `#14b8a6` - бирюзовый

## 🚀 Быстрый запуск

### Вариант 1: Автоматический скрипт

**Linux/Mac:**
```bash
chmod +x mqtt-publish-config.sh
./mqtt-publish-config.sh
```

**Windows:**
```bash
mqtt-publish-config.bat
```

### Вариант 2: Вручную через mosquitto_pub

#### Шаг 1: Публикация конфигурации

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/main/stat" \
  -f mqtt-config-example.json
```

#### Шаг 2: Публикация значений

```bash
# Общая статистика
mosquitto_pub -h localhost -p 1883 -t "Skud/stats/students/total" -m "15234"
mosquitto_pub -h localhost -p 1883 -t "Skud/stats/employees/total" -m "2847"

# Общежития
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/1/residents" -m "456"
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/2/residents" -m "523"
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/3/residents" -m "398"
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/4/residents" -m "612"
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/5/residents" -m "487"
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/6/residents" -m "541"
```

## 🔄 Обновление значений в реальном времени

Значения обновляются автоматически при публикации в соответствующий топик:

```bash
# Изменить количество студентов
mosquitto_pub -h localhost -p 1883 -t "Skud/stats/students/total" -m "15250"

# Изменить количество в общежитии №1
mosquitto_pub -h localhost -p 1883 -t "Skud/dorms/1/residents" -m "460"
```

Карточки на дашборде обновятся **мгновенно**! ⚡

## 📝 Настройка для ваших общежитий

Отредактируйте `mqtt-config-example.json` под ваши нужды:

```json
{
  "cards": [
    {
      "id": "dorm_polevaya",
      "title": "Общежитие на Полевой",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#f59e0b",
      "topic": "Skud/dorms/polevaya/residents"
    },
    {
      "id": "dorm_melnikaite",
      "title": "Общежитие на Мельникайте",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#8b5cf6",
      "topic": "Skud/dorms/melnikaite/residents"
    }
  ]
}
```

## 🔗 Интеграция с вашей системой

### Python пример

```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("localhost", 1883, 60)

# Публикация конфигурации
with open('mqtt-config-example.json', 'r', encoding='utf-8') as f:
    config = f.read()
    client.publish("Skud/main/stat", config)

# Публикация значений
client.publish("Skud/stats/students/total", "15234")
client.publish("Skud/stats/employees/total", "2847")
client.publish("Skud/dorms/1/residents", "456")

client.disconnect()
```

### Node.js пример

```javascript
const mqtt = require('mqtt');
const fs = require('fs');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  // Публикация конфигурации
  const config = fs.readFileSync('mqtt-config-example.json', 'utf8');
  client.publish('Skud/main/stat', config);

  // Публикация значений
  client.publish('Skud/stats/students/total', '15234');
  client.publish('Skud/stats/employees/total', '2847');
  client.publish('Skud/dorms/1/residents', '456');

  client.end();
});
```

### Bash скрипт для периодического обновления

```bash
#!/bin/bash
# update-stats.sh - Обновление каждые 5 минут

while true; do
  # Получаем данные из вашей си��темы
  STUDENTS=$(mysql -u root -p'password' -D utmn_security -se "SELECT COUNT(*) FROM students")
  EMPLOYEES=$(mysql -u root -p'password' -D utmn_security -se "SELECT COUNT(*) FROM employees")
  
  # Публикуем в MQTT
  mosquitto_pub -h localhost -p 1883 -t "Skud/stats/students/total" -m "$STUDENTS"
  mosquitto_pub -h localhost -p 1883 -t "Skud/stats/employees/total" -m "$EMPLOYEES"
  
  echo "$(date): Updated - Students: $STUDENTS, Employees: $EMPLOYEES"
  sleep 300  # 5 минут
done
```

## 🎨 Кастомизация

### Добавление новых карточек

1. Добавьте карточку в `mqtt-config-example.json`
2. Опубликуйте обновленную конфигурацию: `mosquitto_pub -t "Skud/main/stat" -f mqtt-config-example.json`
3. Опубликуйте значение в новый топик

### Изменение цветов и иконок

Просто отредактируйте поля `color` и `icon` в конфигурации и опубликуйте заново.

## 🐛 Отладка

### Проверка подписки на топики

```bash
# Смотрим конфигурацию
mosquitto_sub -h localhost -p 1883 -t "Skud/main/stat" -v

# Смотрим все значения
mosquitto_sub -h localhost -p 1883 -t "Skud/#" -v
```

### Проверка через API

```bash
# Получить карточки со значениями
curl http://localhost:3000/v1/mqtt/cards

# Получить статус MQTT
curl http://localhost:3000/v1/mqtt/status
```

## 📊 Результат

После публикации конфигурации на дашборде будут отображаться **8 карточек**:

1. **Всего студентов** - 15 234
2. **Всего сотрудников** - 2 847
3. **Общежитие №1** - 456
4. **Общежитие №2** - 523
5. **Общежитие №3** - 398
6. **Общежитие №4** - 612
7. **Общежитие №5** - 487
8. **Общежитие №6** - 541

Все значения обновляются в **реальном времени** при изменении в MQTT! ⚡
