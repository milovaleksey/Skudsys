#!/bin/bash

# Скрипт проверки готовности проекта

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Проверка готовности проекта ТюмГУ              ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Счетчики
PASSED=0
FAILED=0

# Функция проверки
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAILED++))
    fi
}

# 1. Проверка Node.js
echo -e "${YELLOW}[1/10]${NC} Проверка Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "       Версия: $NODE_VERSION"
    check 0 "Node.js установлен"
else
    check 1 "Node.js НЕ установлен"
fi

# 2. Проверка npm
echo -e "${YELLOW}[2/10]${NC} Проверка npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "       Версия: $NPM_VERSION"
    check 0 "npm установлен"
else
    check 1 "npm НЕ установлен"
fi

# 3. Проверка node_modules
echo -e "${YELLOW}[3/10]${NC} Проверка зависимостей..."
if [ -d "node_modules" ]; then
    check 0 "node_modules существует"
else
    check 1 "node_modules НЕ существует (запустите fix-all.sh)"
fi

# 4. Проверка package.json
echo -e "${YELLOW}[4/10]${NC} Проверка package.json..."
if [ -f "package.json" ]; then
    check 0 "package.json существует"
else
    check 1 "package.json НЕ существует"
fi

# 5. Проверка vite.config.ts
echo -e "${YELLOW}[5/10]${NC} Проверка vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    if grep -q "host: '0.0.0.0'" vite.config.ts; then
        check 0 "vite.config.ts настроен для сети"
    else
        check 1 "vite.config.ts НЕ настроен (добавьте host: '0.0.0.0')"
    fi
else
    check 1 "vite.config.ts НЕ существует"
fi

# 6. Проверка логотипа
echo -e "${YELLOW}[6/10]${NC} Проверка логотипа..."
if [ -f "public/logo.svg" ]; then
    check 0 "Логотип существует"
else
    check 1 "Логотип НЕ существует"
fi

# 7. Проверка date-fns версии
echo -e "${YELLOW}[7/10]${NC} Проверка date-fns..."
if [ -d "node_modules/date-fns" ]; then
    DATE_FNS_VERSION=$(npm list date-fns 2>/dev/null | grep date-fns | head -1)
    echo "       $DATE_FNS_VERSION"
    if echo "$DATE_FNS_VERSION" | grep -q "3.6.0"; then
        check 0 "date-fns версия 3.6.0"
    else
        check 1 "date-fns неправильная версия"
    fi
else
    check 1 "date-fns НЕ установлен"
fi

# 8. Проверка figma:asset импортов
echo -e "${YELLOW}[8/10]${NC} Проверка figma:asset импортов..."
if grep -r "figma:asset" components/*.tsx 2>/dev/null; then
    check 1 "Найдены figma:asset импорты (нужно исправить)"
else
    check 0 "figma:asset импорты исправлены"
fi

# 9. Проверка версий в импортах
echo -e "${YELLOW}[9/10]${NC} Проверка версий в импортах..."
if grep -r "@[0-9]\+\.[0-9]\+\.[0-9]\+" components/*.tsx 2>/dev/null | grep -v node_modules; then
    check 1 "Найдены версии в импортах (запустите fix-imports.sh)"
else
    check 0 "Версии в импортах исправлены"
fi

# 10. Проверка TypeScript типов
echo -e "${YELLOW}[10/10]${NC} Проверка TypeScript типов..."
if [ -f "vite-env.d.ts" ]; then
    check 0 "vite-env.d.ts существует"
else
    check 1 "vite-env.d.ts НЕ существует"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Результаты                          ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Успешно:  ${GREEN}$PASSED${NC}"
echo -e "Ошибки:   ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Все проверки пройдены!${NC}"
    echo ""
    echo "Запустите проект:"
    echo -e "  ${BLUE}npm run dev${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Есть проблемы!${NC}"
    echo ""
    echo "Исправьте ошибки:"
    echo -e "  ${BLUE}chmod +x fix-all.sh && ./fix-all.sh${NC}"
    echo ""
    exit 1
fi
