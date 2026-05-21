#!/bin/bash

# Запуск системы в HTTPS режиме

echo "🔐 Запуск системы в HTTPS режиме"
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Проверка сертификатов
if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ]; then
    echo -e "${YELLOW}⚠️  SSL сертификаты не найдены${NC}"
    echo ""
    read -p "Сгенерировать самоподписанные сертификаты? (y/n): " GENERATE_CERTS
    
    if [ "$GENERATE_CERTS" = "y" ]; then
        echo ""
        echo "🔑 Генерация сертификатов..."
        chmod +x scripts/generate-ssl-cert.sh
        ./scripts/generate-ssl-cert.sh
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Ошибка генерации сертификатов${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Сертификаты необходимы для HTTPS${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ SSL сертификаты найдены${NC}"
echo ""

# Проверка Backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Файл backend/.env не найден${NC}"
    cd backend
    cp .env.example .env
    echo -e "${GREEN}✅ Создан backend/.env${NC}"
    cd ..
fi

# Включить HTTPS в backend/.env
echo "⚙️  Настройка backend для HTTPS..."
cd backend

# Обновление настроек в .env
if grep -q "USE_HTTPS=" .env; then
    sed -i.bak 's/USE_HTTPS=.*/USE_HTTPS=true/' .env
else
    echo "USE_HTTPS=true" >> .env
fi

if grep -q "HTTPS_PORT=" .env; then
    sed -i.bak 's/HTTPS_PORT=.*/HTTPS_PORT=3443/' .env
else
    echo "HTTPS_PORT=3443" >> .env
fi

# Обновить CORS_ORIGIN для HTTPS
if grep -q "CORS_ORIGIN=" .env; then
    sed -i.bak 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://localhost:5173,http://localhost:5173|' .env
else
    echo "CORS_ORIGIN=https://localhost:5173,http://localhost:5173" >> .env
fi

# Удалить backup файлы
rm -f .env.bak

echo -e "${GREEN}✅ Backend настроен для HTTPS${NC}"
cd ..

# Проверка зависимостей Backend
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Установка зависимостей Backend..."
    cd backend
    npm install
    cd ..
fi

# Проверка зависимостей Frontend
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Установка зависимостей Frontend..."
    npm install
fi

# Информация
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Все готово к запуску!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Backend будет на:${NC}  https://localhost:3443"
echo -e "${BLUE}Frontend будет на:${NC} https://localhost:5173"
echo ""
echo -e "${YELLOW}⚠️  Браузер покажет предупреждение безопасности${NC}"
echo "   Это нормально для самоподписанных сертификатов"
echo "   Нажмите: Advanced → Proceed to localhost"
echo ""
echo -e "${BLUE}Тестовый вход:${NC}"
echo "  Логин:  admin_security"
echo "  Пароль: test123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Установка сертификата (опционально)
echo ""
read -p "Установить сертификат в систему для доверия? (y/n): " INSTALL_CERT

if [ "$INSTALL_CERT" = "y" ]; then
    echo ""
    echo "🔒 Установка сертификата..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/server.crt
        echo -e "${GREEN}✅ Сертификат установлен (macOS)${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo cp certs/server.crt /usr/local/share/ca-certificates/utmn-dev.crt
        sudo update-ca-certificates
        echo -e "${GREEN}✅ Сертификат установлен (Linux)${NC}"
    else
        echo -e "${YELLOW}⚠️  Автоматическая установка не поддерживается${NC}"
        echo "Установите вручную: certs/server.crt"
    fi
    
    echo ""
    echo "💡 Перезапустите браузер для применения изменений"
fi

# Запуск серверов
echo ""
read -p "Запустить серверы? (y/n): " START_SERVERS

if [ "$START_SERVERS" = "y" ]; then
    echo ""
    echo "🚀 Запуск серверов..."
    echo ""
    
    # Определение терминала
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/backend && node src/server-https.js"'
        sleep 1
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev -- --config vite.config.https.ts"'
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $(pwd)/backend && node src/server-https.js; bash"
            sleep 1
            gnome-terminal -- bash -c "cd $(pwd) && npm run dev -- --config vite.config.https.ts; bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $(pwd)/backend && node src/server-https.js" &
            sleep 1
            xterm -e "cd $(pwd) && npm run dev -- --config vite.config.https.ts" &
        else
            echo -e "${YELLOW}Запустите вручную:${NC}"
            echo "  Terminal 1: cd backend && node src/server-https.js"
            echo "  Terminal 2: npm run dev -- --config vite.config.https.ts"
        fi
    else
        echo -e "${YELLOW}Запустите вручную:${NC}"
        echo "  Terminal 1: cd backend && node src/server-https.js"
        echo "  Terminal 2: npm run dev -- --config vite.config.https.ts"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Серверы запускаются...${NC}"
    echo ""
    echo "Откройте браузер: https://localhost:5173"
else
    echo ""
    echo -e "${YELLOW}Для запуска вручную:${NC}"
    echo ""
    echo "Terminal 1 (Backend HTTPS):"
    echo "  cd backend"
    echo "  node src/server-https.js"
    echo ""
    echo "Terminal 2 (Frontend HTTPS):"
    echo "  npm run dev -- --config vite.config.https.ts"
    echo ""
    echo "Затем откройте: https://localhost:5173"
fi

echo ""
echo -e "${GREEN}🎉 Готово!${NC}"
