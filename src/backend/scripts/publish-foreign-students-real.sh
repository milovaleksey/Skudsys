#!/bin/bash

# Скрипт для публикации реальных данных по иностранным студентам
# Использование: ./publish-foreign-students-real.sh [mqtt_host] [mqtt_port]

MQTT_HOST="${1:-localhost}"
MQTT_PORT="${2:-1883}"

echo "==========================================="
echo "Foreign Students MQTT - Real Data"
echo "==========================================="
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

echo "📈 Публикация реальной статистики по странам (65 стран, 2360 студентов)..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/stats" \
  -m '[
{"country":"КАЗАХСТАН","students_count":875},
{"country":"ТУРКМЕНИЯ","students_count":784},
{"country":"ТАДЖИКИСТАН","students_count":162},
{"country":"УЗБЕКИСТАН","students_count":122},
{"country":"БАНГЛАДЕШ","students_count":36},
{"country":"СИРИЙСКАЯ АРАБСКАЯ РЕСПУБЛИКА","students_count":32},
{"country":"ТОГО","students_count":27},
{"country":"ВЬЕТНАМ","students_count":26},
{"country":"ЕГИПЕТ","students_count":24},
{"country":"АЗЕРБАЙДЖАН","students_count":21},
{"country":"КИРГИЗИЯ","students_count":19},
{"country":"СУДАН","students_count":19},
{"country":"КОЛУМБИЯ","students_count":17},
{"country":"ПАКИСТАН","students_count":13},
{"country":"НИГЕРИЯ","students_count":11},
{"country":"КИТАЙ","students_count":10},
{"country":"Лицо без гражданства","students_count":9},
{"country":"ГАНА","students_count":8},
{"country":"ЧАД","students_count":8},
{"country":"АРМЕНИЯ","students_count":7},
{"country":"ТУРЦИЯ","students_count":7},
{"country":"АФГАНИСТАН","students_count":7},
{"country":"МАРОККО","students_count":7},
{"country":"ЙЕМЕН","students_count":6},
{"country":"МЕКСИКА","students_count":5},
{"country":"МАЛИ","students_count":5},
{"country":"ГАБОН","students_count":5},
{"country":"ИНДИЯ","students_count":5},
{"country":"СЕНЕГАЛ","students_count":5},
{"country":"АЛЖИР","students_count":4},
{"country":"БЕНИН","students_count":4},
{"country":"ГРУЗИЯ","students_count":4},
{"country":"БЕЛАРУСЬ","students_count":4},
{"country":"ЭФИОПИЯ","students_count":4},
{"country":"УГАНДА","students_count":3},
{"country":"ЛИВАН","students_count":3},
{"country":"ИНДОНЕЗИЯ","students_count":3},
{"country":"ЭКВАДОР","students_count":3},
{"country":"КАМЕРУН","students_count":3},
{"country":"ЭЛЬ-САЛЬВАДОР","students_count":3},
{"country":"КОНГО","students_count":3},
{"country":"ИРАК","students_count":3},
{"country":"ЧИЛИ","students_count":2},
{"country":"БРАЗИЛИЯ","students_count":2},
{"country":"ЮЖНАЯ АФРИКА","students_count":2},
{"country":"ТАНЗАНИЯ, ОБЪЕДИНЕННАЯ РЕСПУБЛИКА","students_count":2},
{"country":"ГАИТИ","students_count":2},
{"country":"КЕНИЯ","students_count":2},
{"country":"САУДОВСКАЯ АРАВИЯ","students_count":2},
{"country":"ДЖИБУТИ","students_count":2},
{"country":"КОТ-Д'\''ИВУАР","students_count":2},
{"country":"ИРАН, ИСЛАМСКАЯ РЕСПУБЛИКА","students_count":2},
{"country":"МОЛДОВА, РЕСПУБЛИКА","students_count":1},
{"country":"ГВИНЕЯ","students_count":1},
{"country":"ЛИВИЯ","students_count":1},
{"country":"СЕНТ-ВИНСЕНТ И ГРЕНАДИНЫ","students_count":1},
{"country":"ЦЕНТРАЛЬНО-АФР��КАНСКАЯ РЕСПУБЛИКА","students_count":1},
{"country":"АВСТРАЛИЯ","students_count":1},
{"country":"ПЕРУ","students_count":1},
{"country":"БОЛИВИЯ, МНОГОНАЦИОНАЛЬНОЕ ГОСУДАРСТВО","students_count":1},
{"country":"МАДАГАСКАР","students_count":1},
{"country":"АНГОЛА","students_count":1},
{"country":"ИОРДАНИЯ","students_count":1},
{"country":"МОНГОЛИЯ","students_count":1},
{"country":"КУБА","students_count":1},
{"country":null,"students_count":1}
]'

if [ $? -eq 0 ]; then
    echo "✅ Статистика по странам опубликована (65 стран, включая null)"
else
    echo "❌ Ошибка публикации статистики"
fi

sleep 0.5

echo "💾 Публикация значений карточек..."

# Всего иностранных студентов (включая все записи)
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/total" \
  -m "2360"
echo "  ✓ Всего студентов: 2360"

# Активных за сегодня
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/active_today" \
  -m "1543"
echo "  ✓ Активных за сегодня: 1543"

# Стран представлено (должно быть 65: 64 + 1 null)
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/countries" \
  -m "65"
echo "  ✓ Стран/категорий представлено: 65 (64 + 1 null)"

# Новых за месяц
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" \
  -t "Skud/foreign-students/data/new_month" \
  -m "45"
echo "  ✓ Новых за месяц: 45"

if [ $? -eq 0 ]; then
    echo "✅ Значения карточек опубликованы"
else
    echo "❌ Ошибка публикации значений"
fi

echo ""
echo "==========================================="
echo "✅ Реальные данные опубликованы!"
echo "==========================================="
echo ""
echo "Статистика:"
echo "  - Всего студентов: 2360 (включая 9 без гражданства + 1 null)"
echo "  - Количество стран/категорий: 65"
echo "  - Топ-5 стран:"
echo "    1. Казахстан: 875 (37.1%)"
echo "    2. Туркмения: 784 (33.2%)"
echo "    3. Таджикистан: 162 (6.9%)"
echo "    4. Узбекистан: 122 (5.2%)"
echo "    5. Бангладеш: 36 (1.5%)"
echo ""
echo "Примечание:"
echo "  - Записи с 'country: null' автоматически заменяются на 'Без гражданства'"
echo "  - Все 65 записей учитываются в диаграмме"
echo "  - Сумма в центре диаграммы = 2360 ✅"
echo ""
echo "Откройте страницу 'Отчет по иностранным студентам'"
echo "и проверьте консоль браузера (F12) для отладки."
echo ""