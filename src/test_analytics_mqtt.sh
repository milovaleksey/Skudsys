#!/bin/bash

# Скрипт для публикации тестовых данных аналитики в MQTT

BROKER="localhost"
PORT="1883"

echo "🚀 Публикация конфигурации и данных аналитики в MQTT"
echo "=================================================="

# 1. Публикация конфигурации аналитики
echo ""
echo "📝 1. Публикация конфигурации аналитики..."
mosquitto_pub -h $BROKER -p $PORT \
  -t "Skud/analytics/config" \
  -f ANALYTICS_CONFIG_EXAMPLE.json \
  -r

if [ $? -eq 0 ]; then
  echo "✅ Конфигурация опубликована"
else
  echo "❌ Ошибка публикации конфигурации"
  exit 1
fi

# 2. Публикация данных
echo ""
echo "📊 2. Публикация данных аналитики..."
mosquitto_pub -h $BROKER -p $PORT \
  -t "Skud/analytics/events/aggregated" \
  -f /imports/event-data-1.json

if [ $? -eq 0 ]; then
  echo "✅ Данные опубликованы"
else
  echo "❌ Ошибка публикации данных"
  exit 1
fi

echo ""
echo "=================================================="
echo "✅ Все данные успешно опубликованы!"
echo ""
echo "Теперь откройте страницу 'Аналитика' в браузере"
echo "Данные должны автоматически загрузиться через WebSocket"
