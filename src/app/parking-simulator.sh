#!/bin/bash

# Симулятор live обновлений парковок
# Случайно добавляет/удаляет автомобили каждые 5 секунд

# ⚙️ Конфигурация MQTT сервера
MQTT_HOST="${MQTT_HOST:-localhost}"
MQTT_PORT="${MQTT_PORT:-1883}"

echo "🔄 Запуск симулятора парковок..."
echo "   Сервер: $MQTT_HOST:$MQTT_PORT"
echo "   Нажмите Ctrl+C для остановки"
echo ""

# Начальные значения
K1_COUNT=8
K5_COUNT=6
CENTRAL_COUNT=10

while true; do
  # Случайные изменения для К1 (+/- 0-2)
  K1_CHANGE=$((RANDOM % 5 - 2))
  K1_COUNT=$((K1_COUNT + K1_CHANGE))
  [[ $K1_COUNT -lt 0 ]] && K1_COUNT=0
  [[ $K1_COUNT -gt 50 ]] && K1_COUNT=50

  # Случайные изменения для К5 (+/- 0-2)
  K5_CHANGE=$((RANDOM % 5 - 2))
  K5_COUNT=$((K5_COUNT + K5_CHANGE))
  [[ $K5_COUNT -lt 0 ]] && K5_COUNT=0
  [[ $K5_COUNT -gt 40 ]] && K5_COUNT=40

  # Случайные изменения для Центральной (+/- 0-3)
  CENTRAL_CHANGE=$((RANDOM % 7 - 3))
  CENTRAL_COUNT=$((CENTRAL_COUNT + CENTRAL_CHANGE))
  [[ $CENTRAL_COUNT -lt 0 ]] && CENTRAL_COUNT=0
  [[ $CENTRAL_COUNT -gt 75 ]] && CENTRAL_COUNT=75

  # Генерируем JSON с правильным количеством автомобилей
  # (упрощенная версия - просто дублируем первую запись)
  
  # К1
  K1_JSON='['
  for ((i=1; i<=K1_COUNT; i++)); do
    [[ $i -gt 1 ]] && K1_JSON+=','
    K1_JSON+="{\"entryTime\":\"2026-02-25 $(printf "%02d" $((RANDOM % 16 + 7))):$(printf "%02d" $((RANDOM % 60))):$(printf "%02d" $((RANDOM % 60)))\",\"fullName\":\"Автомобиль $i\",\"upn\":\"car$i@utmn.ru\",\"carBrand\":\"Toyota Camry\",\"licensePlate\":\"А${i}23АА72\"}"
  done
  K1_JSON+=']'

  # К5
  K5_JSON='['
  for ((i=1; i<=K5_COUNT; i++)); do
    [[ $i -gt 1 ]] && K5_JSON+=','
    K5_JSON+="{\"entryTime\":\"2026-02-25 $(printf "%02d" $((RANDOM % 16 + 7))):$(printf "%02d" $((RANDOM % 60))):$(printf "%02d" $((RANDOM % 60)))\",\"fullName\":\"Автомобиль $i\",\"upn\":\"car$i@utmn.ru\",\"carBrand\":\"BMW X5\",\"licensePlate\":\"В${i}56ВВ72\"}"
  done
  K5_JSON+=']'

  # Центральная
  CENTRAL_JSON='['
  for ((i=1; i<=CENTRAL_COUNT; i++)); do
    [[ $i -gt 1 ]] && CENTRAL_JSON+=','
    CENTRAL_JSON+="{\"entryTime\":\"2026-02-25 $(printf "%02d" $((RANDOM % 16 + 7))):$(printf "%02d" $((RANDOM % 60))):$(printf "%02d" $((RANDOM % 60)))\",\"fullName\":\"Автомобиль $i\",\"upn\":\"car$i@utmn.ru\",\"carBrand\":\"Mercedes E-Class\",\"licensePlate\":\"С${i}89СС72\"}"
  done
  CENTRAL_JSON+=']'

  # Публикуем
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/parking/k1/vehicles" -m "$K1_JSON" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/parking/k5/vehicles" -m "$K5_JSON" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/parking/central/vehicles" -m "$CENTRAL_JSON" -q 0

  # Вывод
  timestamp=$(date '+%H:%M:%S')
  TOTAL=$((K1_COUNT + K5_COUNT + CENTRAL_COUNT))
  echo "[$timestamp] 🚗 Обновлено:"
  echo "           К1: $K1_COUNT/50 | К5: $K5_COUNT/40 | Центральная: $CENTRAL_COUNT/75"
  echo "           Всего: $TOTAL/165 ($(echo "scale=1; $TOTAL*100/165" | bc)% загрузка)"
  echo ""

  sleep 5
done