#!/bin/bash

# Конфигурация MQTT
MQTT_HOST="localhost"
MQTT_PORT="1883"

echo "📡 Публикация конфигурации карточек в MQTT..."

# 1. Публикуем конфигурацию карточек
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/main/stat" \
  -m '{
  "cards": [
    {
      "id": "total_students",
      "title": "Всего студентов",
      "subtitle": "Общее количество",
      "icon": "users",
      "color": "#00aeef",
      "topic": "Skud/stats/students/total"
    },
    {
      "id": "total_employees",
      "title": "Всего сотрудников",
      "subtitle": "Общее количество",
      "icon": "briefcase",
      "color": "#10b981",
      "topic": "Skud/stats/employees/total"
    },
    {
      "id": "dorm_1",
      "title": "Общежитие №1",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#f59e0b",
      "topic": "Skud/dorms/1/residents"
    },
    {
      "id": "dorm_2",
      "title": "Общежитие №2",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#8b5cf6",
      "topic": "Skud/dorms/2/residents"
    },
    {
      "id": "dorm_3",
      "title": "Общежитие №3",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#ec4899",
      "topic": "Skud/dorms/3/residents"
    },
    {
      "id": "dorm_4",
      "title": "Общежитие №4",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#06b6d4",
      "topic": "Skud/dorms/4/residents"
    },
    {
      "id": "dorm_5",
      "title": "Общежитие №5",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#f97316",
      "topic": "Skud/dorms/5/residents"
    },
    {
      "id": "dorm_6",
      "title": "Общежитие №6",
      "subtitle": "Проживающих",
      "icon": "building",
      "color": "#14b8a6",
      "topic": "Skud/dorms/6/residents"
    }
  ]
}'

echo "✅ Конфигурация опубликована!"
echo ""
echo "📊 Публикация тестовых значений..."

# 2. Публикуем значения для карточек
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/students/total" -m "15234"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/employees/total" -m "2847"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/1/residents" -m "456"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/2/residents" -m "523"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/3/residents" -m "398"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/4/residents" -m "612"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/5/residents" -m "487"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/6/residents" -m "541"

echo "✅ Тестовые значения опубликованы!"
echo ""
echo "🎉 Готово! Откройте дашборд и увидите 8 карточек с данными."
