#!/bin/bash

# Скрипт для проверки работы Foreign Students WebSocket
# Использование: ./test-foreign-students-ws.sh

BACKEND_URL="${1:-http://localhost:3000}"
WS_URL="${BACKEND_URL/http/ws}/ws"

echo "=========================================="
echo "Foreign Students WebSocket Test"
echo "=========================================="
echo "Backend URL: $BACKEND_URL"
echo "WebSocket URL: $WS_URL"
echo ""

# Проверка 1: Backend запущен?
echo "📡 Проверка 1: Backend доступен?"
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "✅ Backend отвечает"
else
    echo "❌ Backend не отвечает на $BACKEND_URL/health"
    exit 1
fi

echo ""

# Проверка 2: MQTT брокер запущен?
echo "📡 Проверка 2: MQTT брокер запущен?"
if pgrep -x "mosquitto" > /dev/null; then
    echo "✅ Mosquitto запущен (PID: $(pgrep -x mosquitto))"
else
    echo "⚠️  Mosquitto не найден"
    echo "Запустите: sudo systemctl start mosquitto"
fi

echo ""

# Проверка 3: Есть ли данные в MQTT?
echo "📡 Проверка 3: Данные в MQTT?"
echo "Ожидание 2 секунды..."

timeout 2 mosquitto_sub -h localhost -t "Skud/foreign-students/#" -C 1 > /tmp/mqtt_test.txt 2>&1

if [ -s /tmp/mqtt_test.txt ]; then
    echo "✅ Данные получены из MQTT"
    echo "Первое сообщение:"
    head -1 /tmp/mqtt_test.txt
else
    echo "⚠️  Нет данных в MQTT топиках"
    echo "Опубликуйте тестовые данные:"
    echo "  cd backend/scripts"
    echo "  ./publish-foreign-students-simple.sh"
fi

rm -f /tmp/mqtt_test.txt

echo ""
echo "=========================================="
echo "Результат проверки"
echo "=========================================="
echo ""
echo "Если все проверки пройдены:"
echo "1. Перезапустите backend"
echo "2. Опубликуйте данные (если их нет)"
echo "3. Откройте страницу 'Отчет по иностранным студентам'"
echo "4. Откройте консоль браузера (F12)"
echo "5. Вы должны увидеть:"
echo "   [Foreign Students MQTT] WebSocket connected"
echo "   [Foreign Students MQTT] Config loaded: 4 cards"
echo ""
echo "Для мониторинга в реальном времени:"
echo "  mosquitto_sub -h localhost -t 'Skud/foreign-students/#' -v"
echo ""
