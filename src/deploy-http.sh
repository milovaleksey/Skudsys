#!/bin/bash

#############################################
# UTMN Security System - HTTP Deployment
# Скрипт автоматического развертывания
# Версия: 1.0 (HTTP за reverse proxy)
#############################################

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Заголовок
echo ""
echo "================================================"
echo "  UTMN Security System - HTTP Deployment"
echo "  Автоматическое развертывание системы"
echo "================================================"
echo ""

# Проверка прав root
if [ "$EUID" -eq 0 ]; then 
    error "Не запускайте скрипт от root! Используйте обычного пользователя с sudo."
fi

# Переменные
INSTALL_DIR="/var/www/utmn-security"
CURRENT_DIR=$(pwd)
NGINX_CONFIG="utmn-security-http.conf"

# Шаг 1: Проверка зависимостей
info "Проверка установленных зависимостей..."

command -v node >/dev/null 2>&1 || error "Node.js не установлен! Установите Node.js 18.x или выше."
command -v npm >/dev/null 2>&1 || error "npm не установлен!"
command -v mysql >/dev/null 2>&1 || error "MySQL не установлен!"
command -v nginx >/dev/null 2>&1 || error "Nginx не установлен!"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error "Требуется Node.js версии 16 или выше. Установлена версия: $(node -v)"
fi

success "Все зависимости установлены"

# Шаг 2: Создание директории проекта
info "Создание директории проекта..."

if [ "$CURRENT_DIR" != "$INSTALL_DIR" ]; then
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown -R $USER:$USER "$INSTALL_DIR"
    
    if [ -f "package.json" ]; then
        info "Копирование файлов проекта в $INSTALL_DIR..."
        cp -r . "$INSTALL_DIR/"
        cd "$INSTALL_DIR"
    else
        error "Файл package.json не найден. Запустите скрипт из корня проекта."
    fi
else
    info "Уже находимся в директории проекта"
fi

success "Директория проекта готова: $INSTALL_DIR"

# Шаг 3: Установка зависимостей
info "Установка зависимостей frontend..."
npm install --legacy-peer-deps

info "Установка зависимостей backend..."
cd backend
npm install
cd ..

success "Зависимости установлены"

# Шаг 4: Настройка конфигурационных файлов
info "Настройка конфигурационных файлов..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    info "Создание backend/.env файла..."
    cat > backend/.env << EOF
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=utmn_admin
DB_PASSWORD=CHANGE_THIS_PASSWORD

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost
ALLOWED_HOSTS=localhost,utmn-security.local
EOF
    warning "Не забудьте изменить DB_PASSWORD в backend/.env!"
else
    info "Файл backend/.env уже существует, пропускаем..."
fi

# Frontend .env
if [ ! -f ".env.production" ]; then
    info "Создание .env.production файла..."
    cat > .env.production << EOF
# Backend API URL (HTTP режим)
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
NODE_ENV=production
EOF
fi

success "Конфигурационные файлы созданы"

# Шаг 5: Настройка MySQL
info "Настройка базы данных MySQL..."

read -p "Введите пароль root для MySQL: " -s MYSQL_ROOT_PASSWORD
echo ""

# Проверка подключения
if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    error "Не удалось подключиться к MySQL. Проверьте пароль root."
fi

read -p "Введите пароль для пользователя utmn_admin: " -s DB_PASSWORD
echo ""

# Создание базы данных и пользователя
info "Создание базы данных и пользователя..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'utmn_admin'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_admin'@'localhost';
FLUSH PRIVILEGES;
EOF

# Обновление пароля в .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" backend/.env

success "База данных создана"

# Импорт схемы
if [ -f "database/schema.sql" ]; then
    info "Импорт схемы базы данных..."
    mysql -u utmn_admin -p"$DB_PASSWORD" utmn_security < database/schema.sql
    success "Схема базы данных импортирована"
else
    warning "Файл database/schema.sql не найден. Импортируйте схему вручную."
fi

# Создание администратора
if [ -f "scripts/create-admin.sql" ]; then
    info "Создание администратора по умолчанию..."
    mysql -u utmn_admin -p"$DB_PASSWORD" utmn_security < scripts/create-admin.sql
    success "Администратор создан (логин: admin, пароль: admin123)"
    warning "ВАЖНО: Измените пароль администратора после первого входа!"
fi

# Шаг 6: Настройка Nginx
info "Настройка Nginx..."

if [ -f "nginx/$NGINX_CONFIG" ]; then
    sudo cp "nginx/$NGINX_CONFIG" /etc/nginx/sites-available/utmn-security
    
    # Создание символической ссылки
    if [ ! -L /etc/nginx/sites-enabled/utmn-security ]; then
        sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/
    fi
    
    # Проверка конфигурации
    if sudo nginx -t; then
        success "Конфигурация Nginx корректна"
    else
        error "Ошибка в конфигурации Nginx"
    fi
else
    warning "Файл nginx/$NGINX_CONFIG не найден. Настройте Nginx вручную."
fi

# Шаг 7: Создание systemd сервиса для backend
info "Создание systemd сервиса для backend..."

sudo tee /etc/systemd/system/utmn-backend.service > /dev/null << EOF
[Unit]
Description=UTMN Security Backend API (HTTP)
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$INSTALL_DIR/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

success "Systemd сервис создан"

# Шаг 8: Создание директории для логов
info "Создание директорий для логов и uploads..."
sudo mkdir -p /var/log/utmn-security
sudo mkdir -p $INSTALL_DIR/backend/uploads
sudo chown -R www-data:www-data $INSTALL_DIR/backend/uploads
sudo chown -R www-data:www-data /var/log/utmn-security

# Шаг 9: Перезагрузка сервисов
info "Перезагрузка и запуск сервисов..."

sudo systemctl daemon-reload
sudo systemctl enable utmn-backend
sudo systemctl restart utmn-backend
sudo systemctl restart nginx

# Проверка статуса
sleep 2

if sudo systemctl is-active --quiet utmn-backend; then
    success "Backend запущен"
else
    error "Backend не запустился. Проверьте логи: journalctl -u utmn-backend -n 50"
fi

if sudo systemctl is-active --quiet nginx; then
    success "Nginx запущен"
else
    error "Nginx не запустился. Проверьте логи: sudo tail /var/log/nginx/error.log"
fi

# Шаг 10: Проверка работы API
info "Проверка работы API..."
sleep 2

if curl -s http://localhost:3000/health | grep -q "success"; then
    success "Backend API отвечает корректно"
else
    warning "Backend API не отвечает. Проверьте логи."
fi

# Финальная информация
echo ""
echo "================================================"
success "Развертывание завершено успешно!"
echo "================================================"
echo ""
echo "📋 Информация о системе:"
echo "   • Директория проекта: $INSTALL_DIR"
echo "   • Backend API: http://localhost:3000"
echo "   • Frontend Dev: http://localhost:5173"
echo "   • База данных: utmn_security"
echo "   • Пользователь БД: utmn_admin"
echo ""
echo "👤 Администратор по умолчанию:"
echo "   • Логин: admin"
echo "   • Пароль: admin123"
echo "   ⚠️  ОБЯЗАТЕЛЬНО измените пароль после первого входа!"
echo ""
echo "🚀 Запуск в режиме разработки:"
echo "   cd $INSTALL_DIR"
echo "   npm run dev"
echo ""
echo "📦 Сборка production версии:"
echo "   cd $INSTALL_DIR"
echo "   npm run build"
echo "   # Затем раскомментируйте секцию 'production' в Nginx конфиге"
echo ""
echo "🔍 Проверка статуса сервисов:"
echo "   sudo systemctl status utmn-backend nginx mysql"
echo ""
echo "📊 Просмотр логов:"
echo "   journalctl -u utmn-backend -f"
echo "   sudo tail -f /var/log/nginx/utmn-security-error.log"
echo ""
echo "🔒 Следующие шаги:"
echo "   1. Измените пароли в backend/.env"
echo "   2. Измените пароль администратора в системе"
echo "   3. Импортируйте данные студентов и сотрудников"
echo "   4. Настройте регулярные бэкапы базы данных"
echo "   5. Настройте внешний reverse proxy с SSL"
echo ""
echo "================================================"
echo ""
