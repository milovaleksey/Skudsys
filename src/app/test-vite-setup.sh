#!/bin/bash

# Тестовый скрипт для проверки Vite конфигурации

echo "🧪 Тестирование Vite конфигурации"
echo "===================================="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Функция для проверки
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${RED}❌${NC} $description"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Функция для проверки содержимого файла
test_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌${NC} $description (файл не найден)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $description"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}📂 Проверка файловой структуры${NC}"
test_file "./components/EngineeringPage.tsx" "Компонент EngineeringPage существует"
test_file "./components/LoginPage.tsx" "Компонент LoginPage существует"
test_file "./components/MainPage.tsx" "Компонент MainPage существует"
test_file "./contexts/AuthContext.tsx" "Контекст AuthContext существует"
test_file "./lib/api.ts" "API библиотека существует"

echo ""
echo -e "${BLUE}🔧 Проверка Vite конфигурации (корень)${NC}"
test_file "./vite.config.ts" "Vite config существует"
test_content "./vite.config.ts" "@/hooks" "Алиас для hooks настроен"
test_content "./vite.config.ts" "@vitejs/plugin-react" "React плагин подключен"

echo ""
echo -e "${BLUE}🔧 Проверка Vite конфигурации (frontend)${NC}"
test_file "./frontend/vite.config.ts" "Frontend Vite config существует"
test_content "./frontend/vite.config.ts" "\.\./components" "Алиас указывает на корневые компоненты"
test_content "./frontend/vite.config.ts" "\.\./hooks" "Алиас указывает на корневые hooks"

echo ""
echo -e "${BLUE}📝 Проверка TypeScript конфигурации (корень)${NC}"
test_file "./tsconfig.json" "TypeScript config существует"
test_content "./tsconfig.json" "hooks" "Hooks включены в tsconfig"

echo ""
echo -e "${BLUE}📝 Проверка TypeScript конфигурации (frontend)${NC}"
test_file "./frontend/tsconfig.json" "Frontend TypeScript config существует"
test_content "./frontend/tsconfig.json" "\.\./components" "Paths указывают на корневые папки"
test_content "./frontend/tsconfig.json" "\.\./hooks" "Hooks включены в paths"

echo ""
echo -e "${BLUE}⚛️  Проверка React компонентов${NC}"
test_file "./frontend/App.tsx" "Frontend App.tsx существует"
test_content "./frontend/App.tsx" "\.\./components/LoginPage" "App.tsx импортирует LoginPage из корня"
test_content "./frontend/App.tsx" "\.\./components/MainPage" "App.tsx импортирует MainPage из корня"
test_content "./frontend/App.tsx" "\.\./contexts/AuthContext" "App.tsx импортирует AuthContext из корня"

echo ""
echo -e "${BLUE}🎨 Проверка стилей${NC}"
test_file "./styles/globals.css" "Глобальные стили существуют"
test_file "./frontend/main.tsx" "Frontend main.tsx существует"
test_content "./frontend/main.tsx" "\.\./styles/globals.css" "main.tsx импортирует стили из корня"

echo ""
echo -e "${BLUE}📦 Проверка package.json${NC}"
test_file "./package.json" "Корневой package.json существует"
test_content "./package.json" "vite" "Vite установлен"
test_content "./package.json" "react" "React установлен"
test_file "./frontend/package.json" "Frontend package.json существует"

echo ""
echo -e "${BLUE}🌐 Проверка HTML${NC}"
test_file "./index.html" "Корневой index.html существует"
test_file "./frontend/index.html" "Frontend index.html существует"

echo ""
echo "===================================="
echo -e "${BLUE}📊 Результаты:${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Все тесты пройдены успешно!${NC}"
    echo ""
    echo "Конфигурация Vite настроена правильно."
    echo "Вы можете запустить приложение:"
    echo ""
    echo "  npm run dev          # Из корня"
    echo "  cd frontend && npm run dev  # Из frontend"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Тесты пройдены с предупреждениями ($WARNINGS)${NC}"
    echo ""
    echo "Приложение должно работать, но есть незначительные замечания."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Обнаружены ошибки: $ERRORS${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Предупреждения: $WARNINGS${NC}"
    fi
    echo ""
    echo "Рекомендуется:"
    echo "1. Проверить целостность проекта"
    echo "2. Прочитать /VITE_FIX_INSTRUCTIONS.md"
    echo "3. Запустить ./check-structure.sh"
    echo ""
    exit 1
fi
