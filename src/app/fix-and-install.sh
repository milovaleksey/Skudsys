#!/bin/bash

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Исправление и установка зависимостей                    ║
║   Система безопасности ТюмГУ                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}[1/3]${NC} Очистка старых зависимостей..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✓${NC} node_modules удалена"
fi
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✓${NC} package-lock.json удален"
fi

echo ""
echo -e "${BLUE}[2/3]${NC} Установка зависимостей..."
if npm install 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Зависимости установлены"
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Обычная установка не удалась, пробуем с --legacy-peer-deps..."
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${BLUE}[3/3]${NC} Проверка установки..."
npm list date-fns

echo ""
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✓ Установка завершена!                                 ║
║                                                           ║
║   Запустите проект:                                      ║
║   npm run dev                                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
