#!/bin/bash

# Установка SSL сертификатов для Nginx

echo "🔐 Установка SSL сертификатов для Nginx"
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Требуются права root${NC}"
    echo "Запустите: sudo $0"
    exit 1
fi

# Проверка существования сертификатов
if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ]; then
    echo -e "${RED}❌ Сертификаты не найдены в ./certs/${NC}"
    echo "Сначала сгенерируйте сертификаты:"
    echo "  ./scripts/generate-ssl-cert.sh"
    exit 1
fi

echo -e "${GREEN}✅ Сертификаты найдены${NC}"
echo ""

# Создание директорий
echo "📁 Создание директорий..."
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Копирование сертификатов
echo "📋 Копирование сертификатов..."
cp certs/server.crt /etc/ssl/certs/utmn-security.crt
cp certs/server.key /etc/ssl/private/utmn-security.key

# Установка прав доступа
echo "🔒 Установка прав доступа..."
chmod 644 /etc/ssl/certs/utmn-security.crt
chmod 600 /etc/ssl/private/utmn-security.key
chown root:root /etc/ssl/certs/utmn-security.crt
chown root:root /etc/ssl/private/utmn-security.key

echo -e "${GREEN}✅ Сертификаты установлены${NC}"
echo ""

# Проверка Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx не установлен${NC}"
    echo ""
    read -p "Установить Nginx? (y/n): " INSTALL_NGINX
    
    if [ "$INSTALL_NGINX" = "y" ]; then
        echo ""
        echo "📦 Установка Nginx..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install nginx
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if [ -f /etc/debian_version ]; then
                # Debian/Ubuntu
                apt update
                apt install -y nginx
            elif [ -f /etc/redhat-release ]; then
                # RedHat/CentOS
                yum install -y nginx
            fi
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Nginx установлен${NC}"
        else
            echo -e "${RED}❌ Ошибка установки Nginx${NC}"
            exit 1
        fi
    else
        echo "Установите Nginx вручную и запустите скрипт снова"
        exit 0
    fi
fi

echo -e "${GREEN}✅ Nginx найден${NC}"
echo ""

# Выбор конфигурации
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Выберите конфигурацию:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1) Development (HTTP, без SSL, проксирование к dev серверам)"
echo "2) Production (HTTPS, SSL, проксирование к Node.js)"
echo "3) Оба варианта"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Выбор (1/2/3): " CONFIG_CHOICE

# Определение директорий Nginx
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS (Homebrew)
    NGINX_AVAILABLE="/usr/local/etc/nginx/servers"
    NGINX_ENABLED="$NGINX_AVAILABLE"
    NGINX_CONF="/usr/local/etc/nginx/nginx.conf"
else
    # Linux
    NGINX_AVAILABLE="/etc/nginx/sites-available"
    NGINX_ENABLED="/etc/nginx/sites-enabled"
    NGINX_CONF="/etc/nginx/nginx.conf"
fi

mkdir -p "$NGINX_AVAILABLE"
mkdir -p "$NGINX_ENABLED" 2>/dev/null

echo ""
echo "📝 Копирование конфигураций..."

# Development конфигурация
if [ "$CONFIG_CHOICE" = "1" ] || [ "$CONFIG_CHOICE" = "3" ]; then
    cp nginx/utmn-security-dev.conf "$NGINX_AVAILABLE/"
    
    # Создание симлинка (только для Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ln -sf "$NGINX_AVAILABLE/utmn-security-dev.conf" "$NGINX_ENABLED/"
    fi
    
    echo -e "${GREEN}✅ Development конфигурация установлена${NC}"
fi

# Production конфигурация
if [ "$CONFIG_CHOICE" = "2" ] || [ "$CONFIG_CHOICE" = "3" ]; then
    cp nginx/utmn-security.conf "$NGINX_AVAILABLE/"
    
    # Создание симлинка (только для Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        ln -sf "$NGINX_AVAILABLE/utmn-security.conf" "$NGINX_ENABLED/"
    fi
    
    echo -e "${GREEN}✅ Production конфигурация установлена${NC}"
fi

# Тестирование конфигурации
echo ""
echo "🧪 Тестирование конфигурации Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Конфигурация корректна${NC}"
    echo ""
    read -p "Перезапустить Nginx? (y/n): " RESTART_NGINX
    
    if [ "$RESTART_NGINX" = "y" ]; then
        echo "🔄 Перезапуск Nginx..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew services restart nginx
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            systemctl restart nginx
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Nginx перезапущен${NC}"
        else
            echo -e "${RED}❌ Ошибка перезапуска Nginx${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Ошибка в конфигурации Nginx${NC}"
    echo "Проверьте логи: nginx -t"
    exit 1
fi

# Информация
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Установка завершена!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Файлы:"
echo "  Сертификат:    /etc/ssl/certs/utmn-security.crt"
echo "  Ключ:          /etc/ssl/private/utmn-security.key"
echo "  Конфигурация:  $NGINX_AVAILABLE/"
echo ""
echo "🌐 URL:"

if [ "$CONFIG_CHOICE" = "1" ] || [ "$CONFIG_CHOICE" = "3" ]; then
    echo "  Development:   http://localhost"
fi

if [ "$CONFIG_CHOICE" = "2" ] || [ "$CONFIG_CHOICE" = "3" ]; then
    echo "  Production:    https://localhost"
fi

echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1. Запустите Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Запустите Frontend:"
echo "   npm run dev"
echo ""
echo "3. Откройте браузер:"
if [ "$CONFIG_CHOICE" = "1" ]; then
    echo "   http://localhost"
else
    echo "   https://localhost"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Полезные команды
echo ""
echo "💡 Полезные команды:"
echo ""
echo "Проверить статус:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  brew services list"
else
    echo "  sudo systemctl status nginx"
fi
echo ""
echo "Перезапустить Nginx:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  brew services restart nginx"
else
    echo "  sudo systemctl restart nginx"
fi
echo ""
echo "Проверить конфигурацию:"
echo "  sudo nginx -t"
echo ""
echo "Логи:"
echo "  sudo tail -f /var/log/nginx/utmn-security-access.log"
echo "  sudo tail -f /var/log/nginx/utmn-security-error.log"
echo ""

echo -e "${GREEN}🎉 Готово!${NC}"
