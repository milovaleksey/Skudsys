#!/bin/bash

# Тестовый скрипт для проверки MQTT динамических карточек
# Использование: ./mqtt-test.sh [broker_host]

BROKER=${1:-localhost}

echo "🧪 Тестирование MQTT карточек на брокере: $BROKER"
echo ""

# 1. Публикуем конфигурацию карточек
echo "📋 Публикация конфигурации карточек..."
mosquitto_pub -h $BROKER -t "Skud/main/stat" -m '[
  {
    "id": "students",
    "label": "Студентов в кампусе",
    "icon": "users",
    "valueTopic": "Skud/stats/students/total",
    "color": "#00aeef",
    "unit": "чел."
  },
  {
    "id": "employees",
    "label": "Сотрудников на работе",
    "icon": "briefcase",
    "valueTopic": "Skud/stats/employees/active",
    "color": "#10b981",
    "unit": "чел."
  },
  {
    "id": "parking",
    "label": "Занято парковочных мест",
    "icon": "car",
    "valueTopic": "Skud/stats/parking/status",
    "color": "#f59e0b",
    "unit": ""
  },
  {
    "id": "alerts",
    "label": "Активных тревог",
    "icon": "alert-circle",
    "valueTopic": "Skud/stats/alerts/count",
    "color": "#ef4444",
    "unit": ""
  }
]'

if [ $? -eq 0 ]; then
  echo "✅ Конфигурация опубликована"
else
  echo "❌ Ошибка публикации конфигурации"
  exit 1
fi

echo ""
echo "📊 Публикация тестовых данных (нажмите Ctrl+C для остановки)..."
echo ""

# 2. Публикуем данные в цикле
counter=0
while true; do
  counter=$((counter + 1))
  
  # Генерируем случайные значения
  students=$((1200 + RANDOM % 400))
  employees=$((280 + RANDOM % 40))
  parking_occupied=$((35 + RANDOM % 15))
  parking_total=100
  alerts=$((RANDOM % 5))
  
  # Публикуем значения
  mosquitto_pub -h $BROKER -t "Skud/stats/students/total" -m "$students"
  mosquitto_pub -h $BROKER -t "Skud/stats/employees/active" -m "$employees"
  mosquitto_pub -h $BROKER -t "Skud/stats/parking/status" -m "$parking_occupied / $parking_total"
  mosquitto_pub -h $BROKER -t "Skud/stats/alerts/count" -m "$alerts"
  
  echo "[$counter] Студентов: $students | Сотрудников: $employees | Парковка: $parking_occupied/$parking_total | Тревоги: $alerts"
  
  sleep 3
done
