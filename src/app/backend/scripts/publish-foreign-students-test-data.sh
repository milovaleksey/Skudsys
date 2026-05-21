#!/bin/bash

# Скрипт для публикации тестовой конфигурации Foreign Students MQTT
# Использование: ./publish-foreign-students-test-data.sh [mqtt_host] [mqtt_port]

MQTT_HOST="${1:-localhost}"
MQTT_PORT="${2:-1883}"

echo "=========================================="
echo "Foreign Students MQTT Test Data Publisher"
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
  },
  {
    "id": "new_this_month",
    "title": "Новых за месяц",
    "valueTopic": "Skud/foreign-students/data/new_this_month",
    "unit": "",
    "icon": "user-plus"
  }
]'

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация карточек опубликована"
else
    echo "❌ Ошибка публикации конфигурации карточек"
    exit 1
fi

sleep 0.5

echo "📈 Публикация статистики по странам..."
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

echo "🌍 Публикация справочника стран..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/countries" \
  -m '[
  {"code": "CN", "name": "Китай"},
  {"code": "KZ", "name": "Казахстан"},
  {"code": "UZ", "name": "Узбекистан"},
  {"code": "TJ", "name": "Таджикистан"},
  {"code": "TM", "name": "Туркменистан"},
  {"code": "KG", "name": "Киргизия"},
  {"code": "IN", "name": "Индия"},
  {"code": "VN", "name": "Вьетнам"},
  {"code": "MN", "name": "Монголия"},
  {"code": "AZ", "name": "Азербайджан"}
]'

if [ $? -eq 0 ]; then
    echo "✅ Справочник стран опубликован"
else
    echo "❌ Ошибка публикации справочника"
fi

sleep 0.5

echo "💾 Публикация значений карточек..."

mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/total_foreign_students" \
  -m "374"

mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/active_students" \
  -m "342"

mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/countries_count" \
  -m "15"

mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/new_this_month" \
  -m "28"

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
echo "Теперь:"
echo "1. Откройте страницу 'Отчет по иностранным студентам'"
echo "2. Проверьте, что данные отображаются"
echo "3. Проверьте консоль браузера (F12) на наличие сообщений"
echo ""
echo "Для мониторинга MQTT сообщений используйте:"
echo "  mosquitto_sub -h $MQTT_HOST -p $MQTT_PORT -t 'Skud/foreign-students/#' -v"
echo ""
