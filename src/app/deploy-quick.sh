#!/bin/bash

################################################################################
# Быстрое развертывание системы безопасности ТюмГУ
# Для Debian/Ubuntu с Node.js, MySQL и Nginx
# Версия: 2.0 - Упрощенная
################################################################################

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Конфигурация
APP_NAME="utmn-security"
DB_NAME="utmn_security"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Требуются права root. Запустите: sudo $0"
        exit 1
    fi
}

check_dependencies() {
    log_header "Проверка зависимостей"
    
    local missing=()
    
    command -v node >/dev/null 2>&1 || missing+=("Node.js")
    command -v npm >/dev/null 2>&1 || missing+=("npm")
    command -v mysql >/dev/null 2>&1 || missing+=("MySQL")
    command -v nginx >/dev/null 2>&1 || missing+=("Nginx")
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Отсутствуют зависимости: ${missing[*]}"
        echo ""
        echo "Установите недостающие компоненты:"
        echo "  Node.js 20.x: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs"
        echo "  MySQL:        sudo apt install -y mysql-server"
        echo "  Nginx:        sudo apt install -y nginx"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
    log_info "Node.js: $(node -v)"
    log_info "npm: $(npm -v)"
    log_info "MySQL: $(mysql --version | awk '{print $5}' | cut -d',' -f1)"
    log_info "Nginx: $(nginx -v 2>&1 | awk '{print $3}')"
}

setup_database() {
    log_header "Настройка базы данных"
    
    echo ""
    read -p "Введите пароль root для MySQL: " -s MYSQL_ROOT_PASSWORD
    echo ""
    
    if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        log_error "Не удалось подключиться к MySQL. Проверьте пароль."
        exit 1
    fi
    
    log_info "Создание базы данных и пользователя..."
    
    read -p "Создать нового пользователя БД? (y/n) [y]: " CREATE_USER
    CREATE_USER=${CREATE_USER:-y}
    
    if [ "$CREATE_USER" = "y" ]; then
        read -p "Имя пользователя БД [utmn_user]: " DB_USER
        DB_USER=${DB_USER:-utmn_user}
        
        DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
        log_info "Сгенерирован пароль БД: $DB_PASSWORD"
        
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    else
        DB_USER="root"
        DB_PASSWORD="$MYSQL_ROOT_PASSWORD"
    fi
    
    log_info "Импорт схемы базы данных..."
    if [ -f "$SCRIPT_DIR/database/schema.sql" ]; then
        mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SCRIPT_DIR/database/schema.sql"
        log_success "Схема импортирована"
    else
        log_warning "Файл schema.sql не найден. Создайте таблицы вручную."
    fi
    
    # Сохраняем параметры
    echo "$DB_USER" > /tmp/db_user
    echo "$DB_PASSWORD" > /tmp/db_password
    
    log_success "База данных настроена"
}

setup_backend() {
    log_header "Настройка Backend"
    
    cd "$SCRIPT_DIR/backend"
    
    log_info "Установка зависимостей..."
    npm install --production
    
    DB_USER=$(cat /tmp/db_user)
    DB_PASSWORD=$(cat /tmp/db_password)
    JWT_SECRET=$(openssl rand -base64 32)
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    log_info "Создание .env файла..."
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
CORS_ORIGIN=http://${SERVER_IP},http://localhost
CORS_CREDENTIALS=true

# Безопасность
PASSWORD_MIN_LENGTH=12
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_TIME=15
EOF
    
    log_success "Backend настроен"
}

build_frontend() {
    log_header "Сборка Frontend"
    
    cd "$SCRIPT_DIR"
    
    log_info "Установка зависимостей..."
    if ! npm install 2>/dev/null; then
        log_warning "Используем --legacy-peer-deps..."
        npm install --legacy-peer-deps
    fi
    
    log_info "Сборка production версии..."
    npm run build
    
    log_success "Frontend собран"
}

setup_nginx() {
    log_header "Настройка Nginx"
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/utmn-security/dist;
    index index.html;

    access_log /var/log/nginx/utmn-security-access.log;
    error_log /var/log/nginx/utmn-security-error.log;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
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

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    client_max_body_size 10M;
}
EOF
    
    log_info "Копирование файлов..."
    mkdir -p /var/www/${APP_NAME}
    cp -r "$SCRIPT_DIR/dist" /var/www/${APP_NAME}/
    cp -r "$SCRIPT_DIR/backend" /var/www/${APP_NAME}/
    
    log_info "Активация конфигурации..."
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx настроен"
    else
        log_error "Ошибка конфигурации Nginx"
        exit 1
    fi
}

setup_systemd() {
    log_header "Настройка systemd"
    
    cat > /etc/systemd/system/${APP_NAME}.service << EOF
[Unit]
Description=UTMN Security System Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/${APP_NAME}/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable ${APP_NAME}
    systemctl start ${APP_NAME}
    
    sleep 2
    
    if systemctl is-active --quiet ${APP_NAME}; then
        log_success "Сервис запущен"
    else
        log_error "Ошибка запуска сервиса"
        journalctl -u ${APP_NAME} -n 20 --no-pager
        exit 1
    fi
}

setup_permissions() {
    log_header "Настройка прав"
    
    chown -R www-data:www-data /var/www/${APP_NAME}
    find /var/www/${APP_NAME} -type f -exec chmod 644 {} \;
    find /var/www/${APP_NAME} -type d -exec chmod 755 {} \;
    chmod 600 /var/www/${APP_NAME}/backend/.env
    
    log_success "Права настроены"
}

print_summary() {
    log_header "Установка завершена!"
    
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}✓ Система безопасности ТюмГУ развернута!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}🌐 URL доступа:${NC}"
    echo "   http://${SERVER_IP}"
    echo "   http://localhost"
    echo ""
    echo -e "${CYAN}👤 Тестовый администратор:${NC}"
    echo "   Логин:  admin_security"
    echo "   Пароль: test123"
    echo ""
    echo -e "${CYAN}📊 Управление:${NC}"
    echo "   Статус:     systemctl status ${APP_NAME}"
    echo "   Остановка:  systemctl stop ${APP_NAME}"
    echo "   Запуск:     systemctl start ${APP_NAME}"
    echo "   Перезапуск: systemctl restart ${APP_NAME}"
    echo "   Логи:       journalctl -u ${APP_NAME} -f"
    echo ""
    echo -e "${CYAN}🗄️ База данных: ${DB_NAME}${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    rm -f /tmp/db_user /tmp/db_password
}

main() {
    clear
    
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Развертывание системы безопасности ТюмГУ             ║
║                                                           ║
║     Node.js + MySQL + Nginx                              ║
║     HTTP с доступом из сети                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_root
    check_dependencies
    
    read -p "Начать развертывание? (y/n): " START
    if [ "$START" != "y" ]; then
        log_info "Отменено"
        exit 0
    fi
    
    setup_database
    setup_backend
    build_frontend
    setup_nginx
    setup_systemd
    setup_permissions
    print_summary
}

trap 'log_error "Ошибка на строке $LINENO"; exit 1' ERR

main "$@"
