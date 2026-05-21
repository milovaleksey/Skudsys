#!/bin/bash

# =====================================================
# Скрипт для запуска системы с подключением к БД
# =====================================================

set -e

echo "=================================================="
echo "🚀 Запуск системы с базой данных"
echo "=================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия MySQL
echo -e "${YELLOW}1. Проверка MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL не установлен!${NC}"
    exit 1
fi

if ! systemctl is-active --quiet mysql; then
    echo -e "${YELLOW}MySQL не запущен. Запускаю...${NC}"
    sudo systemctl start mysql
fi

echo -e "${GREEN}✅ MySQL работает${NC}"
echo ""

# Проверка backend
echo -e "${YELLOW}2. Проверка backend...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Файл backend/.env не найден!${NC}"
    echo "Создайте его на основе инструкции в CONNECT_DATABASE.md"
    exit 1
fi

echo -e "${GREEN}✅ Backend конфигурация найдена${NC}"
echo ""

# Проверка frontend
echo -e "${YELLOW}3. Проверка frontend...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Файл .env не найден!${NC}"
    echo "Создаю стандартный .env файл..."
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_APP_NAME=Системы безопасности инфраструктуры ТюмГУ
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Создан .env файл${NC}"
fi

echo -e "${GREEN}✅ Frontend конфигурация готова${NC}"
echo ""

# Запуск backend
echo -e "${YELLOW}4. Запуск backend сервера...${NC}"
cd backend

# Проверка node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Установка зависимостей backend...${NC}"
    npm install
fi

# Запуск в фоновом режиме
echo "Запускаю backend на порту 3000..."
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!

# Ждём запуска backend
echo "Ожидание запуска backend..."
sleep 5

# Проверка запуска
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend запущен (PID: $BACKEND_PID)${NC}"
    
    # Проверка health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✅ Backend API отвечает${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend запущен, но API не отвечает. Проверьте логи: backend.log${NC}"
    fi
else
    echo -e "${RED}❌ Ошибка запуска backend. Проверьте логи: backend.log${NC}"
    cd ..
    exit 1
fi

cd ..
echo ""

# Запуск frontend
echo -e "${YELLOW}5. Запуск frontend...${NC}"

# Проверка node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Установка зависимостей frontend...${NC}"
    npm install
fi

echo "Запускаю frontend на порту 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Система запущена!${NC}"
echo "=================================================="
echo ""
echo "📡 Backend API:  http://localhost:3000/v1"
echo "🏥 Health check: http://localhost:3000/health"
echo "🌐 Frontend:     http://localhost:5173"
echo ""
echo "📝 Логи backend: backend.log"
echo ""
echo "Процессы:"
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "=================================================="
echo "Для остановки нажмите Ctrl+C"
echo "=================================================="
echo ""

# Сохраняем PID для последующей остановки
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Ожидание Ctrl+C
trap "echo ''; echo 'Остановка серверов...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo 'Серверы остановлены'; exit 0" INT TERM

# Держим скрипт запущенным
wait
