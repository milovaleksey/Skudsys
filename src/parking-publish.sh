#!/bin/bash

# Конфигурация MQTT
# ⚙️ Измените на адрес вашего MQTT сервера
MQTT_HOST="${MQTT_HOST:-localhost}"
MQTT_PORT="${MQTT_PORT:-1883}"

echo "🚗 Публикация конфигурации парковок..."
echo "   Сервер: $MQTT_HOST:$MQTT_PORT"
echo ""

# 1. Публикуем конфигурацию парковок
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/parking/config" \
  -f parking-config.json

echo "✅ Конфигурация опубликована (3 парковки)!"
echo ""
echo "📊 Публикация данных о транспорте..."

# 2. Публикуем транспорт на Парковке К1 (8 автомобилей)
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/parking/k1/vehicles" \
  -f parking-k1-vehicles.json

echo "✅ Парковка К1: 8 автомобилей"

# 3. Публикуем транспорт на Парковке К5 (6 автомобилей)
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/parking/k5/vehicles" \
  -f parking-k5-vehicles.json

echo "✅ Парковка К5: 6 автомобилей"

# 4. Публикуем транспорт на Центральной парковке (10 автомобилей)
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "Skud/parking/central/vehicles" \
  -f parking-central-vehicles.json

echo "✅ Центральная парковка: 10 автомобилей"
echo ""
echo "🎉 Готово! Откройте страницу 'Парковочная система' и увидите:"
echo "   • Парковка К1 (ул. Володарского, 6): 8 / 50 мест"
echo "   • Парковка К5 (ул. Ленина, 25): 6 / 40 мест"
echo "   • Центральная парковка (ул. Республики, 47): 10 / 75 мест"
echo ""
echo "   Всего: 24 / 165 мест (14.5% загрузка)"