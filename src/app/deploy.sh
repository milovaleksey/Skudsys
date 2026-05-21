#!/bin/bash

################################################################################
# Автоматическая установка системы безопасности ТюмГУ на Debian + Nginx + MySQL
# Версия: 1.0
# Дата: 20.01.2026
################################################################################

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Конфигурация
APP_NAME="utmn-security"
APP_USER="www-data"
APP_DIR="/var/www/${APP_NAME}"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
SYSTEMD_SERVICE="/etc/systemd/system/${APP_NAME}.service"
DB_NAME="utmn_security"

# Логирование
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Проверка прав root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Требуются права root. Запустите: sudo $0"
        exit 1
    fi
}

# Проверка ОС
check_os() {
    if [ ! -f /etc/debian_version ]; then
        log_error "Этот скрипт предназначен для Debian/Ubuntu"
        exit 1
    fi
    log_success "ОС: Debian/Ubuntu $(cat /etc/debian_version)"
}

# Установка зависимостей
install_dependencies() {
    log_header "Установка зависимостей"
    
    log_info "Обновление списка пакетов..."
    apt update -qq
    
    log_info "Установка базовых пакетов..."
    apt install -y curl wget git unzip software-properties-common gnupg2
    
    log_success "Базовые пакеты установлены"
}

# Установка Node.js
install_nodejs() {
    log_header "Установка Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_warning "Node.js уже установлен: $NODE_VERSION"
        read -p "Переустановить? (y/n): " REINSTALL
        if [ "$REINSTALL" != "y" ]; then
            return
        fi
    fi
    
    log_info "Добавление репозитория NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    log_info "Установка Node.js..."
    apt install -y nodejs
    
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    log_success "Node.js установлен: $NODE_VERSION"
    log_success "npm установлен: $NPM_VERSION"
}

# Установка MySQL
install_mysql() {
    log_header "Установка MySQL"
    
    if command -v mysql &> /dev/null; then
        log_warning "MySQL уже установлен"
        read -p "Пропустить установку MySQL? (y/n): " SKIP_MYSQL
        if [ "$SKIP_MYSQL" = "y" ]; then
            return
        fi
    fi
    
    log_info "Установка MySQL Server..."
    apt install -y mysql-server
    
    log_info "Запуск MySQL..."
    systemctl start mysql
    systemctl enable mysql
    
    log_success "MySQL установлен и запущен"
    
    log_warning "Настройка безопасности MySQL..."
    read -p "Запустить mysql_secure_installation? (y/n): " RUN_SECURE
    if [ "$RUN_SECURE" = "y" ]; then
        mysql_secure_installation
    fi
}

# Установка Nginx
install_nginx() {
    log_header "Установка Nginx"
    
    if command -v nginx &> /dev/null; then
        log_warning "Nginx уже установлен"
    else
        log_info "Установка Nginx..."
        apt install -y nginx
        log_success "Nginx установлен"
    fi
    
    log_info "Запуск Nginx..."
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx запущен"
}

# Настройка базы данных
setup_database() {
    log_header "Настройка базы данных"
    
    read -p "Введите пароль root для MySQL: " -s MYSQL_ROOT_PASSWORD
    echo ""
    
    # Проверка подключения
    if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        log_error "Не удалось подключиться к MySQL. Проверьте пароль."
        exit 1
    fi
    
    log_info "Создание базы данных ${DB_NAME}..."
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    
    read -p "Создать отдельного пользователя БД? (y/n): " CREATE_USER
    if [ "$CREATE_USER" = "y" ]; then
        read -p "Имя пользователя БД [utmn_user]: " DB_USER
        DB_USER=${DB_USER:-utmn_user}
        
        read -p "Пароль для пользователя БД: " -s DB_PASSWORD
        echo ""
        
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
        log_success "Пользователь ${DB_USER} создан"
    else
        DB_USER="root"
        DB_PASSWORD="$MYSQL_ROOT_PASSWORD"
    fi
    
    # Сохраним параметры для дальнейшего использования
    echo "$DB_USER" > /tmp/db_user
    echo "$DB_PASSWORD" > /tmp/db_password
    
    log_success "База данных настроена"
}

# Распаковка приложения
deploy_application() {
    log_header "Развертывание приложения"
    
    # Поиск ZIP архива
    if [ -f "utmn-security.zip" ]; then
        ZIP_FILE="utmn-security.zip"
    elif [ -f "../utmn-security.zip" ]; then
        ZIP_FILE="../utmn-security.zip"
    else
        log_info "ZIP архив не найден в текущей директории"
        read -p "Укажите путь к ZIP архиву: " ZIP_FILE
        if [ ! -f "$ZIP_FILE" ]; then
            log_error "Файл не найден: $ZIP_FILE"
            exit 1
        fi
    fi
    
    log_info "Создание директории приложения..."
    mkdir -p "$APP_DIR"
    
    log_info "Распаковка архива..."
    unzip -q "$ZIP_FILE" -d /tmp/utmn-temp
    
    # Копирование файлов
    log_info "Копирование файлов..."
    
    # Если архив содержит корневую папку, войдем в нее
    if [ -d "/tmp/utmn-temp/utmn-security" ]; then
        cp -r /tmp/utmn-temp/utmn-security/* "$APP_DIR/"
    else
        cp -r /tmp/utmn-temp/* "$APP_DIR/"
    fi
    
    # Очистка временных файлов
    rm -rf /tmp/utmn-temp
    
    log_success "Приложение распаковано в $APP_DIR"
}

# Настройка Backend
setup_backend() {
    log_header "Настройка Backend"
    
    cd "$APP_DIR/backend"
    
    log_info "Установка зависимостей..."
    npm install --production
    
    # Получаем параметры БД
    DB_USER=$(cat /tmp/db_user)
    DB_PASSWORD=$(cat /tmp/db_password)
    
    # Генерация JWT секрета
    JWT_SECRET=$(openssl rand -base64 32)
    
    log_info "Создание файла .env..."
    cat > .env << EOF
# База данных MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Сервер
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://$(hostname -I | awk '{print $1}')
CORS_CREDENTIALS=true

# Безопасность
PASSWORD_MIN_LENGTH=12
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_TIME=15
EOF
    
    log_success "Backend настроен"
    
    log_info "Инициализация базы данных..."
    if [ -f "src/scripts/initDatabase.js" ]; then
        node src/scripts/initDatabase.js
        log_success "База данных инициализирована"
    else
        log_warning "Скрипт инициализации не найден. Инициализируйте БД вручную."
    fi
}

# Сборка Frontend
build_frontend() {
    log_header "Сборка Frontend"
    
    cd "$APP_DIR"
    
    log_info "Установка зависимостей..."
    
    # Попытка обычной установки
    if ! npm install 2>/dev/null; then
        log_warning "Обычная установка не удалась, пробуем с --legacy-peer-deps..."
        npm install --legacy-peer-deps
    fi
    
    log_info "Сборка production версии..."
    npm run build
    
    log_success "Frontend собран в $APP_DIR/dist"
}

# Настройка Nginx
setup_nginx() {
    log_header "Настройка Nginx"
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    log_info "Создание конфигурации Nginx..."
    cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/utmn-security/dist;
    index index.html;

    # Логирование
    access_log /var/log/nginx/utmn-security-access.log;
    error_log /var/log/nginx/utmn-security-error.log;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (статические файлы)
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /v1/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Оптимизация
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml;

    client_max_body_size 10M;
}
EOF
    
    log_info "Активация конфигурации..."
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    
    # Удаление default конфигурации
    if [ -f /etc/nginx/sites-enabled/default ]; then
        log_info "Отключение default сайта..."
        rm /etc/nginx/sites-enabled/default
    fi
    
    log_info "Проверка конфигурации Nginx..."
    if nginx -t; then
        log_success "Конфигурация Nginx корректна"
        systemctl reload nginx
        log_success "Nginx перезагружен"
    else
        log_error "Ошибка в конфигурации Nginx"
        exit 1
    fi
}

# Создание systemd сервиса
setup_systemd() {
    log_header "Настройка systemd сервиса"
    
    log_info "Создание systemd сервиса..."
    cat > "$SYSTEMD_SERVICE" << EOF
[Unit]
Description=UTMN Security System Backend
After=network.target mysql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${APP_NAME}

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    
    log_info "Перезагрузка systemd..."
    systemctl daemon-reload
    
    log_info "Запуск сервиса..."
    systemctl start ${APP_NAME}
    systemctl enable ${APP_NAME}
    
    sleep 2
    
    if systemctl is-active --quiet ${APP_NAME}; then
        log_success "Сервис запущен и добавлен в автозагрузку"
    else
        log_error "Ошибка запуска сервиса"
        journalctl -u ${APP_NAME} -n 20 --no-pager
        exit 1
    fi
}

# Настройка прав доступа
setup_permissions() {
    log_header "Настройка прав доступа"
    
    log_info "Установка владельца файлов..."
    chown -R ${APP_USER}:${APP_USER} "$APP_DIR"
    
    log_info "Установка прав на файлы..."
    find "$APP_DIR" -type f -exec chmod 644 {} \;
    find "$APP_DIR" -type d -exec chmod 755 {} \;
    
    # За��ита .env файла
    chmod 600 "$APP_DIR/backend/.env"
    
    log_success "Права доступа настроены"
}

# Настройка firewall
setup_firewall() {
    log_header "Настройка Firewall"
    
    if command -v ufw &> /dev/null; then
        log_info "UFW обнаружен"
        read -p "Настроить UFW? (y/n): " SETUP_UFW
        
        if [ "$SETUP_UFW" = "y" ]; then
            ufw allow 22/tcp
            ufw allow 80/tcp
            ufw allow 443/tcp
            echo "y" | ufw enable
            log_success "UFW настроен"
        fi
    else
        log_warning "UFW не установлен. Установите вручную: apt install ufw"
    fi
}

# Проверка работы
verify_installation() {
    log_header "Проверка установки"
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    # Проверка Backend
    log_info "Проверка Backend..."
    sleep 2
    if curl -s http://localhost:3000/health | grep -q "success"; then
        log_success "Backend работает"
    else
        log_error "Backend не отвечает"
    fi
    
    # Проверка Nginx
    log_info "Проверка Nginx..."
    if curl -s http://localhost/ | grep -q "html"; then
        log_success "Nginx работает"
    else
        log_error "Nginx не отвечает"
    fi
    
    # Проверка MySQL
    log_info "Проверка MySQL..."
    if systemctl is-active --quiet mysql; then
        log_success "MySQL работает"
    else
        log_error "MySQL не запущен"
    fi
}

# Вывод итоговой информации
print_summary() {
    log_header "Установка завершена!"
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}✓ Система безопасности ТюмГУ успешно установлена!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}📁 Директория приложения:${NC}"
    echo "   $APP_DIR"
    echo ""
    echo -e "${CYAN}🌐 URL доступа:${NC}"
    echo "   http://${SERVER_IP}"
    echo "   http://localhost"
    echo ""
    echo -e "${CYAN}👤 Тестовые пользователи:${NC}"
    echo "   Администратор:"
    echo "     Логин:  admin_security"
    echo "     Пароль: AdminSecure2024!"
    echo ""
    echo -e "${CYAN}📊 Управление сервисом:${NC}"
    echo "   Статус:      systemctl status ${APP_NAME}"
    echo "   Запуск:      systemctl start ${APP_NAME}"
    echo "   Остановка:   systemctl stop ${APP_NAME}"
    echo "   Перезапуск:  systemctl restart ${APP_NAME}"
    echo "   Логи:        journalctl -u ${APP_NAME} -f"
    echo ""
    echo -e "${CYAN}🔧 Nginx:${NC}"
    echo "   Статус:      systemctl status nginx"
    echo "   Конфигурация: $NGINX_CONF"
    echo "   Логи:        tail -f /var/log/nginx/utmn-security-*.log"
    echo ""
    echo -e "${CYAN}🗄️ MySQL:${NC}"
    echo "   База данных:  ${DB_NAME}"
    echo "   Подключение:  mysql -u root -p ${DB_NAME}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Очистка временных файлов
    rm -f /tmp/db_user /tmp/db_password
}

# Главная функция
main() {
    clear
    
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Автоматическая установка системы безопасности ТюмГУ     ║
║                                                           ║
║   Платформа: Debian + Nginx + MySQL + Node.js            ║
║   Версия: 1.0                                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_root
    check_os
    
    read -p "Начать установку? (y/n): " START_INSTALL
    if [ "$START_INSTALL" != "y" ]; then
        log_info "Установка отменена"
        exit 0
    fi
    
    install_dependencies
    install_nodejs
    install_mysql
    install_nginx
    setup_database
    deploy_application
    setup_backend
    build_frontend
    setup_nginx
    setup_systemd
    setup_permissions
    setup_firewall
    verify_installation
    print_summary
}

# Обработка ошибок
trap 'log_error "Ошибка на строке $LINENO. Установка прервана."; exit 1' ERR

# Запуск
main "$@"