#!/bin/bash

# Скрипт для публикации данных аналитики в MQTT с проверками

BROKER="localhost"
PORT="1883"

echo "🚀 Публикация данных аналитики в MQTT"
echo "=================================================="

# Проверка доступности брокера
echo ""
echo "🔍 Проверка MQTT брокера..."
mosquitto_pub -h $BROKER -p $PORT -t "test" -m "ping" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "❌ MQTT брокер недоступен на $BROKER:$PORT"
  echo "Запустите mosquitto: sudo systemctl start mosquitto"
  exit 1
fi

echo "✅ MQTT брокер доступен"

# 1. Публикация конфигурации аналитики (RETAINED)
echo ""
echo "📝 1. Публикация КОНФИГУРАЦИИ аналитики (retained)..."
mosquitto_pub -h $BROKER -p $PORT \
  -t "Skud/analytics/config" \
  -f ANALYTICS_CONFIG_EXAMPLE.json \
  -r

if [ $? -eq 0 ]; then
  echo "✅ Конфигурация опубликована (retained)"
else
  echo "❌ Ошибка публикации конфигурации"
  exit 1
fi

# Задержка для обработки
echo ""
echo "⏳ Ожидание 2 секунды для обработки конфигурации..."
sleep 2

# 2. Публикация данных
echo ""
echo "📊 2. Публикация ДАННЫХ аналитики..."
mosquitto_pub -h $BROKER -p $PORT \
  -t "Skud/analytics/events/aggregated" \
  -f imports/event-data-1.json

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
echo "📋 Проверьте логи backend:"
echo "   - [MQTT] 📊 Получена конфигурация аналитики"
echo "   - [MQTT] 📊 Получено XXX записей данных аналитики"
echo "   - [MQTT] 📊 Обработка данных аналитики..."
echo "   - [MQTT] ✅ Обработано X типов аналитики"
echo "   - [WebSocket] 📊 Рассылка обновления аналитики клиентам"
echo ""
echo "🌐 Откройте страницу 'Аналитика' в браузере"
echo "   Данные должны автоматически загрузиться"
