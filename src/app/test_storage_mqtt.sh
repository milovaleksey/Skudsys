#!/bin/bash

# Storage System Testing Script
# Симуляция работы систем хранения через MQTT

MQTT_HOST="localhost"
MQTT_PORT="1883"

echo "🚀 Запуск тестирования системы хранения вещей"
echo "================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для отправки MQTT сообщения
send_mqtt() {
  local topic=$1
  local message=$2
  local retain_flag=${3:-""}
  
  if [ -n "$retain_flag" ]; then
    mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "$topic" -m "$message" -r
  else
    mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "$topic" -m "$message"
  fi
}

# 1. Отправка конфигурации
echo -e "${GREEN}📦 Шаг 1: Отправка конфигурации систем хранения${NC}"
echo "Топик: storage/config"
echo ""

send_mqtt "storage/config" "$(cat storage_config.json)" "-r"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Конфигурация отправлена${NC}"
else
  echo -e "❌ Ошибка отправки конфигурации"
  exit 1
fi

sleep 2
echo ""

# 2. Установка начальных значений занятости
echo -e "${BLUE}📊 Шаг 2: Установка начальных значений занятости${NC}"
echo ""

declare -a occupancy_data=(
  "storage/korpusA/wardrobe1/occupancy:25"
  "storage/korpusA/wardrobe2/occupancy:18"
  "storage/korpusA/locker1/occupancy:12"
  "storage/korpusB/wardrobe1/occupancy:42"
  "storage/korpusB/locker1/occupancy:8"
  "storage/korpusV/wardrobe1/occupancy:35"
  "storage/korpusV/locker1/occupancy:15"
)

for item in "${occupancy_data[@]}"; do
  IFS=':' read -r topic value <<< "$item"
  echo "  → $topic = $value"
  send_mqtt "$topic" "$value"
  sleep 0.3
done

echo -e "${GREEN}✅ Начальные значения установлены${NC}"
sleep 2
echo ""

# 3. Установка статусов
echo -e "${BLUE}🟢 Шаг 3: Установка статусов систем${NC}"
echo ""

declare -a status_data=(
  "storage/korpusA/wardrobe1/status:active"
  "storage/korpusA/wardrobe2/status:active"
  "storage/korpusA/locker1/status:active"
  "storage/korpusB/wardrobe1/status:active"
  "storage/korpusB/locker1/status:active"
  "storage/korpusV/wardrobe1/status:active"
  "storage/korpusV/locker1/status:active"
)

for item in "${status_data[@]}"; do
  IFS=':' read -r topic value <<< "$item"
  echo "  → $topic = $value"
  send_mqtt "$topic" "$value"
  sleep 0.3
done

echo -e "${GREEN}✅ Статусы установлены${NC}"
sleep 2
echo ""

# 4. Симуляция изменений
echo -e "${YELLOW}🔄 Шаг 4: Симуляция изменений (30 секунд)${NC}"
echo "Нажмите Ctrl+C для остановки"
echo ""

# Счетчик итераций
iteration=1
max_iterations=30

while [ $iteration -le $max_iterations ]; do
  echo -e "${YELLOW}--- Итерация $iteration ---${NC}"
  
  # Случайное изменение занятости в Гардеробе 1 (Корпус А)
  random_occupancy=$((RANDOM % 51))  # 0-50
  echo "  Гардероб 1 (Корпус А): $random_occupancy/50"
  send_mqtt "storage/korpusA/wardrobe1/occupancy" "$random_occupancy"
  
  # Случайное изменение занятости в Камере хранения 1 (Корпус Б)
  random_occupancy=$((RANDOM % 26))  # 0-25
  echo "  Камера хранения 1 (Корпус Б): $random_occupancy/25"
  send_mqtt "storage/korpusB/locker1/occupancy" "$random_occupancy"
  
  # Каждые 10 итераций - меняем статус случайной системы
  if [ $((iteration % 10)) -eq 0 ]; then
    statuses=("active" "maintenance" "inactive")
    random_status=${statuses[$((RANDOM % 3))]}
    echo "  🔧 Гардероб 2 (Корпус А) → статус: $random_status"
    send_mqtt "storage/korpusA/wardrobe2/status" "$random_status"
  fi
  
  echo ""
  sleep 1
  ((iteration++))
done

echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo ""
echo "📊 Результаты:"
echo "  - Конфигурация: 7 систем хранения"
echo "  - Обновлений занятости: $((max_iterations * 2))"
echo "  - Обновлений статуса: $((max_iterations / 10))"
echo ""
echo "💡 Откройте страницу 'Система хранения вещей' в браузере"
echo "   чтобы увидеть real-time обновления!"
