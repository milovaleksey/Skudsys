#!/bin/bash

# Диагностика MQTT топиков аналитики

BROKER="localhost"
PORT="1883"

echo "🔍 Диагностика MQTT топиков аналитики"
echo "=================================================="

echo ""
echo "1️⃣ Проверка retained конфигурации..."
echo "   Топик: Skud/analytics/config"
echo ""

timeout 3 mosquitto_sub -h $BROKER -p $PORT \
  -t "Skud/analytics/config" \
  -C 1 2>/dev/null

if [ $? -eq 124 ]; then
  echo "❌ Конфигурация НЕ найдена (retained message отсутствует)"
  echo ""
  echo "Решение:"
  echo "  mosquitto_pub -h $BROKER -p $PORT \\"
  echo "    -t 'Skud/analytics/config' \\"
  echo "    -f ANALYTICS_CONFIG_EXAMPLE.json \\"
  echo "    -r"
else
  echo "✅ Конфигурация найдена"
fi

echo ""
echo "=================================================="
echo ""
echo "2️⃣ Подписка на ВСЕ топики аналитики..."
echo "   Нажмите Ctrl+C для выхода"
echo ""

mosquitto_sub -h $BROKER -p $PORT \
  -t "Skud/analytics/#" \
  -v

