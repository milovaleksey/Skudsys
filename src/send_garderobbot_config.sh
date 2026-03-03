#!/bin/bash

# 🎯 Отправка конфигурации Гардеробота в MQTT

MQTT_HOST="10.101.221.232"
MQTT_PORT="1883"

echo "📡 Отправка конфигурации Гардеробота..."

# Отправляем конфигурацию
mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
  -t "storage/config" \
  -f storage_config_garderobbot.json \
  -r

if [ $? -eq 0 ]; then
  echo "✅ Конфигурация отправлена"
  
  echo ""
  echo "📊 Отправка тестовых данных..."
  
  # Отправляем занятость
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
    -t "storage/k1/grbot1/occupancy" \
    -m "35"
  
  echo "✅ Занятость: 35/100"
  
  # Отправляем статус
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT \
    -t "storage/k1/grbot1/status" \
    -m "active"
  
  echo "✅ Статус: active"
  
  echo ""
  echo "🎉 Готово! Проверьте страницу 'Системы хранения вещей'"
else
  echo "❌ Ошибка отправки конфигурации"
  exit 1
fi
