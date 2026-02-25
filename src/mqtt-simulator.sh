#!/bin/bash

# Симулятор live данных для демонстрации
# Обновляет значения каждые 3 секунды

MQTT_HOST="localhost"
MQTT_PORT="1883"

echo "🔄 Запуск симулятора live обновлений..."
echo "   Нажмите Ctrl+C для остановки"
echo ""

# Начальные значения
students_present=8942
employees_present=1623
dorm1_present=312
dorm2_present=398
parking=234

while true; do
  # Случайные изменения (+/- 0-5)
  students_change=$((RANDOM % 11 - 5))
  employees_change=$((RANDOM % 6 - 3))
  dorm1_change=$((RANDOM % 6 - 3))
  dorm2_change=$((RANDOM % 6 - 3))
  parking_change=$((RANDOM % 4 - 2))
  
  # Обновляем значения
  students_present=$((students_present + students_change))
  employees_present=$((employees_present + employees_change))
  dorm1_present=$((dorm1_present + dorm1_change))
  dorm2_present=$((dorm2_present + dorm2_change))
  parking=$((parking + parking_change))
  
  # Ограничения
  [[ $students_present -lt 5000 ]] && students_present=5000
  [[ $students_present -gt 12000 ]] && students_present=12000
  [[ $employees_present -lt 1000 ]] && employees_present=1000
  [[ $employees_present -gt 2500 ]] && employees_present=2500
  [[ $dorm1_present -lt 100 ]] && dorm1_present=100
  [[ $dorm1_present -gt 450 ]] && dorm1_present=450
  [[ $dorm2_present -lt 150 ]] && dorm2_present=150
  [[ $dorm2_present -gt 520 ]] && dorm2_present=520
  [[ $parking -lt 50 ]] && parking=50
  [[ $parking -gt 440 ]] && parking=440
  
  # Публикуем
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/students/present" -m "$students_present" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/stats/employees/present" -m "$employees_present" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/1/present" -m "$dorm1_present" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/dorms/2/present" -m "$dorm2_present" -q 0
  mosquitto_pub -h $MQTT_HOST -p $MQTT_PORT -t "Skud/parking/occupied" -m "$parking / 450" -q 0
  
  # Вывод
  timestamp=$(date '+%H:%M:%S')
  echo "[$timestamp] 📊 Обновлено:"
  echo "           Студентов: $students_present | Сотрудников: $employees_present"
  echo "           Общ.№1: $dorm1_present | Общ.№2: $dorm2_present | Парковка: $parking"
  
  sleep 3
done
