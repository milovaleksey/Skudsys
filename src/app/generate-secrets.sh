#!/bin/bash

# 🔐 Генерация безопасных секретов для .env файла

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo "════════════════════════════════════════"
echo "   🔐 Генератор секретов UTMN Security"
echo "════════════════════════════════════════"
echo ""

# Генерация случайных строк
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)

echo -e "${CYAN}Сгенерированные секреты:${NC}"
echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}JWT_SECRET${NC}"
echo "$JWT_SECRET"
echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}JWT_REFRESH_SECRET${NC}"
echo "$JWT_REFRESH_SECRET"
echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}SESSION_SECRET${NC}"
echo "$SESSION_SECRET"
echo ""
echo "────────────────────────────────────────"
echo -e "${GREEN}DB_PASSWORD (предложение)${NC}"
echo "$DB_PASSWORD"
echo ""
echo "════════════════════════════════════════"
echo ""

# Предложение сохранить в файл
read -p "Сохранить в файл secrets.txt? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > secrets.txt << EOF
# Секреты для UTMN Security
# Сгенерировано: $(date)

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET
DB_PASSWORD=$DB_PASSWORD

# ВАЖНО!
# 1. Скопируйте эти значения в backend/.env
# 2. Удалите этот файл после копирования!
# 3. Никогда не коммитьте секреты в Git!

EOF
    echo -e "${GREEN}✅ Сохранено в secrets.txt${NC}"
    echo -e "${YELLOW}⚠️  Удалите этот файл после копирования в .env!${NC}"
    echo ""
    echo "Команда для удаления:"
    echo "  rm secrets.txt"
else
    echo "Секреты не сохранены"
fi

echo ""
echo "📝 Использование:"
echo ""
echo "1. Скопируйте значения в backend/.env"
echo "2. Обновите другие параметры (DB_NAME, DB_USER, CORS_ORIGIN)"
echo "3. Сохраните .env"
echo ""
echo "Пример для копирования в .env:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
