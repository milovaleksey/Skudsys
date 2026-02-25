# 📚 MQTT Документация - Навигация

## 🚀 С чего начать?

### Для быстрого запуска
👉 **[MQTT_QUICKSTART.md](MQTT_QUICKSTART.md)** - Начните отсюда!
- 3 команды для запуска
- Краткие примеры
- Шпаргалка по командам

### Для визуального понимания
👉 **[MQTT_VISUAL_EXAMPLE.md](MQTT_VISUAL_EXAMPLE.md)**
- Как будут выглядеть карточки
- Цветовая схема
- Примеры размещения

### Для полной настройки
👉 **[MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md)**
- Детальное руководство
- Интеграция с Python/Node.js
- Автоматизация обновлений

### Статус готовности
👉 **[MQTT_SETUP_COMPLETE.md](MQTT_SETUP_COMPLETE.md)**
- Что создано
- Чек-лист
- Troubleshooting

---

## 📂 Файлы проекта

### Конфигурационные файлы
```
mqtt-config-example.json       - Простая конфигурация (8 карточек)
mqtt-config-extended.json      - Расширенная (18 карточек)
```

### Скрипты запуска (Linux/Mac)
```
mqtt-publish-config.sh         - Публикация простой конфигурации
mqtt-publish-extended.sh       - Публикация расширенной
mqtt-simulator.sh              - Live симулятор
make-mqtt-executable.sh        - Установка прав доступа
```

### Скрипты запуска (Windows)
```
mqtt-publish-config.bat        - Публикация конфигурации
```

### Документация
```
MQTT_INDEX.md                  - Этот файл (навигация)
MQTT_QUICKSTART.md             - Быстрый старт
MQTT_CARDS_GUIDE.md            - Подробное руководство
MQTT_VISUAL_EXAMPLE.md         - Визуальные примеры
MQTT_SETUP_COMPLETE.md         - Статус и чек-лист
MQTT_EXAMPLES_README.md        - Главная инструкция
README_MQTT.md                 - Полная MQTT документация
```

---

## 🎯 Типовые задачи

### Задача 1: Запустить демо-конфигурацию
```bash
./make-mqtt-executable.sh
./mqtt-publish-config.sh
```
📖 Читайте: [MQTT_QUICKSTART.md](MQTT_QUICKSTART.md)

### Задача 2: Настроить свои общежития
1. Отредактировать `mqtt-config-example.json`
2. Опубликовать конфигурацию
3. Опубликовать значения

📖 Читайте: [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → Раздел "Настройка для ваших общежитий"

### Задача 3: Увидеть live обновления
```bash
./mqtt-publish-extended.sh
./mqtt-simulator.sh
```
📖 Читайте: [MQTT_VISUAL_EXAMPLE.md](MQTT_VISUAL_EXAMPLE.md) → Раздел "Live обновления"

### Задача 4: Интеграция с БД
Примеры на Python/Node.js/Bash

📖 Читайте: [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → Раздел "Интеграция с вашей системой"

### Задача 5: Понять как это выглядит
Визуальные примеры и скриншоты

📖 Читайте: [MQTT_VISUAL_EXAMPLE.md](MQTT_VISUAL_EXAMPLE.md)

---

## 🔍 Поиск по темам

### Конфигурация
- **Формат карточки** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Структура карточки"
- **Доступные иконки** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Доступные иконки"
- **Цвета** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Цвета (примеры)"

### Публикация
- **Публикация конфигурации** → [MQTT_QUICKSTART.md](MQTT_QUICKSTART.md) → Вариант 1/2
- **Обновление значений** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Обновление значений в реальном времени"

### Интеграция
- **Python** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Python пример"
- **Node.js** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Node.js пример"
- **Bash** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Bash скрипт"

### Отладка
- **Проверка топиков** → [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Отладка"
- **Troubleshooting** → [MQTT_SETUP_COMPLETE.md](MQTT_SETUP_COMPLETE.md) → "Troubleshooting"

---

## 📊 Примеры конфигураций

### Минимальная (2 карточки)
```json
{
  "cards": [
    {
      "id": "students",
      "title": "Студенты",
      "icon": "users",
      "color": "#00aeef",
      "topic": "Skud/students"
    },
    {
      "id": "employees",
      "title": "Сотрудники",
      "icon": "briefcase",
      "color": "#10b981",
      "topic": "Skud/employees"
    }
  ]
}
```

### Простая (8 карточек)
📄 Файл: `mqtt-config-example.json`

### Расширенная (18 карточек)
📄 Файл: `mqtt-config-extended.json`

---

## 🛠️ Инструменты

### Командная строка
```bash
# Просмотр конфигурации
mosquitto_sub -t "Skud/main/stat" -C 1

# Просмотр значений
mosquitto_sub -t "Skud/#" -v

# Публикация значения
mosquitto_pub -t "Skud/stats/students/total" -m "15234"
```

### API
```bash
# Получить карточки
curl http://localhost:3000/v1/mqtt/cards

# Получить статус
curl http://localhost:3000/v1/mqtt/status

# Опубликовать (admin)
curl -X POST http://localhost:3000/v1/mqtt/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Skud/test","message":"123"}'
```

---

## ✅ Быстрая проверка

```bash
# 1. Backend работает?
ps aux | grep "node.*server"

# 2. Mosquitto работает?
systemctl status mosquitto

# 3. Конфигурация есть?
mosquitto_sub -t "Skud/main/stat" -C 1

# 4. WebSocket подключен?
# Откройте дашборд, смотрите "Сервер статистики подключен"
```

---

## 📞 Помощь

### Проблемы с запуском
👉 [MQTT_SETUP_COMPLETE.md](MQTT_SETUP_COMPLETE.md) → "Troubleshooting"

### Вопросы по конфигурации
👉 [MQTT_CARDS_GUIDE.md](MQTT_CARDS_GUIDE.md) → "Отладка"

### Понять как работает
👉 [README_MQTT.md](README_MQTT.md) → Полная документация

---

## 🎓 Обучающие примеры

### Пример 1: Один общежитий
```bash
# 1. Создать конфигурацию
cat > my-config.json << 'EOF'
{"cards":[{"id":"dorm1","title":"Общежитие","icon":"building","color":"#f59e0b","topic":"dorm/count"}]}
EOF

# 2. Опубликовать
mosquitto_pub -t "Skud/main/stat" -f my-config.json
mosquitto_pub -t "dorm/count" -m "456"
```

### Пример 2: Два счетчика
```bash
# Конфигурация
mosquitto_pub -t "Skud/main/stat" -m '{"cards":[
  {"id":"in","title":"Вошло","icon":"user-check","color":"#10b981","topic":"gate/in"},
  {"id":"out","title":"Вышло","icon":"user","color":"#ef4444","topic":"gate/out"}
]}'

# Значения
mosquitto_pub -t "gate/in" -m "342"
mosquitto_pub -t "gate/out" -m "298"
```

---

## 🚀 Roadmap

- [x] ✅ Базовая система MQTT
- [x] ✅ WebSocket интеграция
- [x] ✅ Динамические карточки
- [x] ✅ Примеры конфигураций
- [x] ✅ Документация
- [ ] 🔧 Интеграция с БД
- [ ] 🔧 Автоматическое обновление
- [ ] 🔧 Графики и тренды

---

## 📝 Лицензия и авторство

Разработано для ТюмГУ - Системы безопасности инфраструктуры

**Фирменный цвет:** #00aeef 🔵
