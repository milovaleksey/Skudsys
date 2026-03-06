#!/bin/bash

# Скрипт для публикации тестовой конфигурации Foreign Students MQTT (упрощенная версия)
# Использование: ./publish-foreign-students-simple.sh [mqtt_host] [mqtt_port]

MQTT_HOST="${1:-localhost}"
MQTT_PORT="${2:-1883}"

echo "=========================================="
echo "Foreign Students MQTT - Simple Test Data"
echo "=========================================="
echo "MQTT Host: $MQTT_HOST"
echo "MQTT Port: $MQTT_PORT"
echo ""

# Проверка наличия mosquitto_pub
if ! command -v mosquitto_pub &> /dev/null; then
    echo "❌ Ошибка: mosquitto_pub не найден"
    echo "Установите mosquitto-clients:"
    echo "  Ubuntu/Debian: sudo apt-get install mosquitto-clients"
    echo "  macOS: brew install mosquitto"
    exit 1
fi

echo "📊 Публикация конфигурации карточек..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/config" \
  -m '[
  {
    "title": "Всего иностранных студентов",
    "valueTopic": "Skud/foreign-students/data/total",
    "icon": "Users",
    "unit": ""
  },
  {
    "title": "Активных за сегодня",
    "valueTopic": "Skud/foreign-students/data/active_today",
    "icon": "UserCheck",
    "unit": ""
  },
  {
    "title": "Стран представлено",
    "valueTopic": "Skud/foreign-students/data/countries",
    "icon": "Globe",
    "unit": ""
  },
  {
    "title": "Новых за месяц",
    "valueTopic": "Skud/foreign-students/data/new_month",
    "icon": "UserPlus",
    "unit": ""
  }
]'

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация карточек опубликована"
else
    echo "❌ Ошибка публикации конфигурации карточек"
    exit 1
fi

sleep 0.5

echo "📈 Публикация статистики по странам (диаграмма-пончик)..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/stats" \
  -m '[
  {"country": "Китай", "students_count": 150},
  {"country": "Казахстан", "students_count": 89},
  {"country": "Узбекистан", "students_count": 67},
  {"country": "Таджикистан", "students_count": 45},
  {"country": "Туркменистан", "students_count": 23},
  {"country": "Киргизия", "students_count": 18},
  {"country": "Индия", "students_count": 15},
  {"country": "Вьетнам", "students_count": 12},
  {"country": "Монголия", "students_count": 8},
  {"country": "Азербайджан", "students_count": 7}
]'

if [ $? -eq 0 ]; then
    echo "✅ Статистика по странам опубликована"
else
    echo "❌ Ошибка публикации статистики"
fi

sleep 0.5

echo "💾 Публикация значений карточек..."

# Всего иностранных студентов
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/total" \
  -m "434"
echo "  ✓ Всего студентов: 434"

# Активных за сегодня
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/active_today" \
  -m "287"
echo "  ✓ Активных за сегодня: 287"

# Стран представлено
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/countries" \
  -m "15"
echo "  ✓ Стран представлено: 15"

# Новых за месяц
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/new_month" \
  -m "28"
echo "  ✓ Новых за месяц: 28"

if [ $? -eq 0 ]; then
    echo "✅ Значения карточек опубликованы"
else
    echo "❌ Ошибка публикации значений"
fi

echo ""
echo "=========================================="
echo "✅ Все данные успешно опубликованы!"
echo "=========================================="
echo ""
echo "Структура данных:"
echo "  - 4 простые карточки с подписью и значением"
echo "  - 1 диаграмма-пончик с 10 странами"
echo ""
echo "Теперь:"
echo "1. Откройте страницу 'Отчет по иностранным студентам'"
echo "2. Вы должны увидеть 4 карточки вверху"
echo "3. Ниже будет диаграмма распределения по странам"
echo "4. Проверьте консоль браузера (F12)"
echo ""
echo "Для мониторинга MQTT сообщений:"
echo "  mosquitto_sub -h $MQTT_HOST -p $MQTT_PORT -t 'Skud/foreign-students/#' -v"
echo ""
echo "Для обновления значений карточек в реальном времени:"
echo "  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t 'Skud/foreign-students/data/active_today' -m '301'"
echo ""
