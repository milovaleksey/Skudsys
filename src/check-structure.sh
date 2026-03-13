#!/bin/bash

# Скрипт для проверки структуры проекта

echo "🔍 Проверка структуры проекта Система безопасности ТюмГУ"
echo "========================================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки существования файла/папки
check_exists() {
    if [ -e "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 (не найдено)${NC}"
        return 1
    fi
}

echo "📂 Корневая структура:"
check_exists "./App.tsx"
check_exists "./main.tsx"
check_exists "./index.html"
check_exists "./vite.config.ts"
check_exists "./package.json"
check_exists "./components"
check_exists "./contexts"
check_exists "./lib"
check_exists "./hooks"
check_exists "./styles"

echo ""
echo "📂 Frontend структура:"
check_exists "./frontend/App.tsx"
check_exists "./frontend/main.tsx"
check_exists "./frontend/index.html"
check_exists "./frontend/vite.config.ts"
check_exists "./frontend/package.json"
check_exists "./frontend/contexts"
check_exists "./frontend/lib"
check_exists "./frontend/styles"

echo ""
echo "🔧 Backend структура:"
check_exists "./backend/src/server.js"
check_exists "./backend/package.json"

echo ""
echo "📋 Анализ структуры:"

# Подсчитываем компоненты
ROOT_COMPONENTS=$(find ./components -name "*.tsx" 2>/dev/null | wc -l)
FRONTEND_COMPONENTS=$(find ./frontend/components -name "*.tsx" 2>/dev/null | wc -l)

echo "Компонентов в корне: $ROOT_COMPONENTS"
echo "Компонентов во frontend: $FRONTEND_COMPONENTS"

echo ""
echo "💡 Рекомендации:"

if [ "$ROOT_COMPONENTS" -gt 0 ] && [ "$FRONTEND_COMPONENTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Используется КОРНЕВАЯ структура${NC}"
    echo "   Запускайте: npm run dev (из корня проекта)"
    echo "   Для production: npm run build (из корня проекта)"
elif [ "$ROOT_COMPONENTS" -eq 0 ] && [ "$FRONTEND_COMPONENTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Используется FRONTEND структура${NC}"
    echo "   Запускайте: cd frontend && npm run dev"
    echo "   Для production: cd frontend && npm run build"
elif [ "$ROOT_COMPONENTS" -gt 0 ] && [ "$FRONTEND_COMPONENTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ДУБЛИРОВАННАЯ структура обнаружена!${NC}"
    echo "   Компоненты есть и в корне, и во frontend"
    echo "   Рекомендуется использовать одну структуру"
    echo "   Для production на сервере используйте: npm run dev (из корня)"
else
    echo -e "${RED}❌ Компоненты не найдены!${NC}"
    echo "   Проверьте целостность проекта"
fi

echo ""
echo "🚀 Команды для запуска:"
echo "   Разработка (корень):    npm run dev"
echo "   Разработка (frontend):  cd frontend && npm run dev"
echo "   Backend:                cd backend && npm start"
echo "   Production build:       npm run build"

echo ""
echo "📖 Подробности смотрите в: /VITE_FIX_INSTRUCTIONS.md"
