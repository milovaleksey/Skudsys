#!/bin/bash

# Быстрое исправление и запуск Vite приложения
# Автоматическая диагностика и запуск

echo "🔧 Быстрое исправление Vite Setup"
echo "===================================="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Сделать скрипты исполняемыми
echo -e "${BLUE}📝 Шаг 1: Делаем скрипты исполняемыми...${NC}"
chmod +x check-structure.sh 2>/dev/null
chmod +x start-frontend.sh 2>/dev/null
chmod +x test-vite-setup.sh 2>/dev/null
echo -e "${GREEN}✅ Готово${NC}"
echo ""

# 2. Проверить структуру
echo -e "${BLUE}📂 Шаг 2: Проверка структуры проекта...${NC}"
if [ -f "./check-structure.sh" ]; then
    ./check-structure.sh
else
    echo -e "${YELLOW}⚠️  check-structure.sh не найден, пропускаем${NC}"
fi
echo ""

# 3. Запустить тесты
echo -e "${BLUE}🧪 Шаг 3: Тестирование конфигурации...${NC}"
if [ -f "./test-vite-setup.sh" ]; then
    if ./test-vite-setup.sh; then
        echo ""
        echo -e "${GREEN}🎉 Все тесты прошли успешно!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Обнаружены проблемы, но пытаемся продолжить...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  test-vite-setup.sh не найден, пропускаем${NC}"
fi
echo ""

# 4. Предложить варианты запуска
echo -e "${BLUE}🚀 Шаг 4: Запуск приложения${NC}"
echo ""
echo "Выберите, как запустить приложение:"
echo ""
echo "1) Из корня проекта (рекомендуется для production)"
echo "2) Из /frontend директории"
echo "3) Автоматически определить и запустить"
echo "4) Только тесты (не запускать)"
echo ""

read -p "Ваш выбор (1-4): " choice
echo ""

case $choice in
    1)
        echo -e "${GREEN}📦 Запуск из корня проекта...${NC}"
        echo ""
        npm run dev
        ;;
    2)
        if [ -d "./frontend" ]; then
            echo -e "${GREEN}📦 Запуск из /frontend директории...${NC}"
            echo ""
            cd frontend
            npm run dev
        else
            echo -e "${RED}❌ Директория /frontend не найдена!${NC}"
            exit 1
        fi
        ;;
    3)
        if [ -f "./start-frontend.sh" ]; then
            echo -e "${GREEN}📦 Автоматический запуск...${NC}"
            echo ""
            ./start-frontend.sh
        else
            echo -e "${YELLOW}⚠️  start-frontend.sh не найден, запускаем из корня${NC}"
            echo ""
            npm run dev
        fi
        ;;
    4)
        echo -e "${BLUE}✅ Тесты выполнены. Выход.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Неверный выбор. По умолчанию запускаем из корня.${NC}"
        echo ""
        npm run dev
        ;;
esac
