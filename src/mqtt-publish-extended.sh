#!/bin/bash

# Конфигурация MQTT
MQTT_HOST="localhost"
MQTT_PORT="1883"

echo "📡 Публикация расширенной конфигурации карточек..."

# 1. Публикуем конфигурацию из файла
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/main/stat" \
  -f mqtt-config-extended.json

echo "✅ Конфигурация опубликована (18 карточек)!"
echo ""
echo "📊 Публикация тестовых значений..."

# 2. Общая статистика
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/students/total" -m "15234"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/students/present" -m "8942"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/employees/total" -m "2847"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/employees/present" -m "1623"

# 3. Общежитие №1
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/1/residents" -m "456"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/1/present" -m "312"

# 4. Общежитие №2
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/2/residents" -m "523"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/2/present" -m "398"

# 5. Общежитие №3
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/3/residents" -m "398"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/3/present" -m "267"

# 6. Общежитие №4
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/4/residents" -m "612"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/4/present" -m "445"

# 7. Общежитие №5
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/5/residents" -m "487"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/5/present" -m "329"

# 8. Общежитие №6
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/6/residents" -m "541"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/6/present" -m "412"

# 9. Парковка и библиотека
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/parking/occupied" -m "234 / 450"
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/library/visitors" -m "87"

echo "✅ Все значения опубликованы!"
echo ""
echo "🎉 Готово! На дашборде 18 карточек:"
echo "   • 4 карточки общей статистики"
echo "   • 12 карточек общежитий (6 всего + 6 сейчас)"
echo "   • 1 карточка парковки"
echo "   • 1 карточка библиотеки"
