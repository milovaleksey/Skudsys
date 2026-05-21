#!/bin/bash

# Master fix script - does everything at once

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
║   Полное исправление и установка                          ║
║   Система безопасности ТюмГУ                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}[1/3]${NC} Очистка и установка зависимостей..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✓${NC} node_modules удалена"
fi
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✓${NC} package-lock.json удален"
fi

echo ""
if npm install 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Зависимости установлены"
else
    echo -e "${YELLOW}⚠${NC} Обычная установка не удалась, пробуем с --legacy-peer-deps..."
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${BLUE}[2/3]${NC} Исправление импортов TypeScript..."

# Remove version numbers from imports in all TypeScript files
find components -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read file; do
    sed -i 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' "$file" 2>/dev/null || sed -i '' 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' "$file"
done

if [ -d "contexts" ]; then
    find contexts -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read file; do
        sed -i 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' "$file" 2>/dev/null || sed -i '' 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' "$file"
    done
fi

echo -e "${GREEN}✓${NC} Импорты исправлены"

echo ""
echo -e "${BLUE}[3/3]${NC} Проверка..."
npm list date-fns 2>/dev/null | head -2

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
║   Откройте: http://localhost:5173                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"