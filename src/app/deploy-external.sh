#!/bin/bash

#############################################
# UTMN Security System - External Access
# Развертывание с доступом с внешнего интерфейса
# Версия: 1.0 (для тестирования, без RP)
#############################################

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warning() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "${CYAN}[STEP]${NC} $1"; }

clear
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  UTMN Security System - External Deployment   ║"
echo "║  Развертывание с внешним доступом             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Проверка прав
if [ "$EUID" -eq 0 ]; then 
    error "Не запускайте скрипт от root! Используйте sudo внутри скрипта."
fi

# Переменные
INSTALL_DIR="/var/www/utmn-security"
CURRENT_DIR=$(pwd)
SERVER_IP=$(hostname -I | awk '{print $1}')

# ============================================
# Шаг 1: Проверка зависимостей
# ============================================
step "1/9: Проверка зависимостей"

info "Проверка Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js не установлен! Установите: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
fi
NODE_VERSION=$(node -v)
success "Node.js установлен: $NODE_VERSION"

info "Проверка npm..."
if ! command -v npm &> /dev/null; then
    error "npm не установлен!"
fi
NPM_VERSION=$(npm -v)
success "npm установлен: v$NPM_VERSION"

info "Проверка MySQL..."
if ! command -v mysql &> /dev/null; then
    error "MySQL не установлен! Установите: sudo apt install -y mysql-server"
fi
MYSQL_VERSION=$(mysql --version | awk '{print $5}' | cut -d',' -f1)
success "MySQL установлен: $MYSQL_VERSION"

info "Проверка Nginx..."
if ! command -v nginx &> /dev/null; then
    error "Nginx не установлен! Установите: sudo apt install -y nginx"
fi
NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $3}')
success "Nginx установлен: $NGINX_VERSION"

echo ""

# ============================================
# Шаг 2: Подготовка директории
# ============================================
step "2/9: Подготовка директории проекта"

if [ "$CURRENT_DIR" != "$INSTALL_DIR" ]; then
    info "Создание директории $INSTALL_DIR..."
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown -R $USER:$USER "$INSTALL_DIR"
    
    if [ -f "package.json" ]; then
        info "Копирование файлов проекта..."
        rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '.git' . "$INSTALL_DIR/" || cp -r . "$INSTALL_DIR/"
        cd "$INSTALL_DIR"
        success "Файлы скопированы в $INSTALL_DIR"
    else
        error "Файл package.json не найден. Запустите скрипт из корня проекта."
    fi
else
    info "Уже находимся в $INSTALL_DIR"
    success "Директория проекта готова"
fi

echo ""

# ============================================
# Шаг 3: Установка зависимостей
# ============================================
step "3/9: Установка зависимостей"

info "Установка frontend зависимостей..."
npm install --legacy-peer-deps || error "Не удалось установить frontend зависимости"
success "Frontend зависимости установлены"

info "Установка backend зависимостей..."
cd backend
npm install || error "Не удалось установить backend зависимости"
cd ..
success "Backend зависимости установлены"

echo ""

# ============================================
# Шаг 4: Пересоздание базы данных
# ============================================
step "4/9: Пересоздание базы данных"

warning "База данных будет ПОЛНОСТЬЮ ОЧИЩЕНА и пересоздана!"
echo ""
echo "Пароли по умолчанию:"
echo "  • MySQL пользователь: utmn_admin"
echo "  • MySQL пароль: utmn_admin123"
echo "  • Админ логин: admin"
echo "  • Админ пароль: admin123"
echo ""

read -p "Продолжить? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    error "Развертывание отменено пользователем"
fi

# Запуск скрипта очистки БД
if [ -f "reset-database.sh" ]; then
    chmod +x reset-database.sh
    info "Запуск скрипта пересоздания БД..."
    ./reset-database.sh || error "Не удалось пересоздать базу данных"
else
    error "Файл reset-database.sh не найден"
fi

success "База данных пересоздана"
echo ""

# ============================================
# Шаг 5: Настройка Backend
# ============================================
step "5/9: Настройка Backend для внешнего доступа"

info "Проверка backend/.env..."
if [ -f "backend/.env" ]; then
    # Убедимся что HOST=0.0.0.0 для доступа извне
    if grep -q "HOST=localhost" backend/.env; then
        sed -i 's/HOST=localhost/HOST=0.0.0.0/' backend/.env
        info "Обновлен HOST на 0.0.0.0"
    fi
    success "Backend настроен для внешнего доступа"
else
    error "Файл backend/.env не найден"
fi

echo ""

# ============================================
# Шаг 6: Создание директорий
# ============================================
step "6/9: Создание служебных директорий"

info "Создание директории для uploads..."
sudo mkdir -p "$INSTALL_DIR/backend/uploads"
sudo chown -R www-data:www-data "$INSTALL_DIR/backend/uploads"
success "Директория uploads создана"

info "Создание директории для логов..."
sudo mkdir -p /var/log/utmn-security
sudo chown -R www-data:www-data /var/log/utmn-security
success "Директория логов создана"

echo ""

# ============================================
# Шаг 7: Настройка Nginx
# ============================================
step "7/9: Настройка Nginx"

info "Копирование конфигурации Nginx..."
sudo cp nginx/utmn-security-external.conf /etc/nginx/sites-available/utmn-security

info "Создание символической ссылки..."
if [ -L /etc/nginx/sites-enabled/utmn-security ]; then
    sudo rm /etc/nginx/sites-enabled/utmn-security
fi
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/

info "Удаление default конфигурации (если есть)..."
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

info "Проверка конфигурации Nginx..."
if sudo nginx -t; then
    success "Конфигурация Nginx корректна"
else
    error "Ошибка в конфигурации Nginx"
fi

echo ""

# ============================================
# Шаг 8: Настройка systemd сервисов
# ============================================
step "8/9: Настройка systemd сервисов"

info "Создание сервиса для Backend..."
sudo tee /etc/systemd/system/utmn-backend.service > /dev/null << EOF
[Unit]
Description=UTMN Security Backend API
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$INSTALL_DIR/backend
Environment="NODE_ENV=production"
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=utmn-backend

# Ограничения безопасности
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
success "Backend сервис создан"

info "Создание сервиса для Frontend (Vite Dev Server)..."
sudo tee /etc/systemd/system/utmn-frontend.service > /dev/null << EOF
[Unit]
Description=UTMN Security Frontend (Vite Dev Server)
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
Environment="NODE_ENV=development"
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=utmn-frontend

[Install]
WantedBy=multi-user.target
EOF
success "Frontend сервис создан"

echo ""

# ============================================
# Шаг 9: Запуск сервисов
# ============================================
step "9/9: Запуск всех сервисов"

info "Перезагрузка systemd..."
sudo systemctl daemon-reload

info "Запуск MySQL..."
sudo systemctl enable mysql
sudo systemctl restart mysql
sleep 2

info "Запуск Backend..."
sudo systemctl enable utmn-backend
sudo systemctl restart utmn-backend
sleep 3

info "Запуск Frontend..."
sudo systemctl enable utmn-frontend
sudo systemctl restart utmn-frontend
sleep 3

info "Запуск Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx
sleep 2

echo ""

# ============================================
# Проверка статуса
# ============================================
info "Проверка статуса сервисов..."
echo ""

# Проверка MySQL
if sudo systemctl is-active --quiet mysql; then
    success "MySQL: работает"
else
    error "MySQL: не работает"
fi

# Проверка Backend
if sudo systemctl is-active --quiet utmn-backend; then
    success "Backend: работает"
else
    warning "Backend: не работает. Проверьте логи: journalctl -u utmn-backend -n 50"
fi

# Проверка Frontend
if sudo systemctl is-active --quiet utmn-frontend; then
    success "Frontend: работает"
else
    warning "Frontend: не работает. Проверьте логи: journalctl -u utmn-frontend -n 50"
fi

# Проверка Nginx
if sudo systemctl is-active --quiet nginx; then
    success "Nginx: работает"
else
    error "Nginx: не работает"
fi

echo ""

# Проверка API
info "Проверка Backend API..."
sleep 2
if curl -s http://localhost:3000/health | grep -q "success"; then
    success "Backend API отвечает"
else
    warning "Backend API не отвечает (это нормально если он еще запускается)"
fi

# ============================================
# Финальная информация
# ============================================
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║           РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!            ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "🌐 ${GREEN}Система доступна по адресам:${NC}"
echo ""
echo "   📱 Локальный доступ:"
echo "      http://localhost"
echo "      http://127.0.0.1"
echo ""
echo "   🌍 Внешний доступ:"
echo "      http://$SERVER_IP"
if [ -n "$HOSTNAME" ]; then
    echo "      http://$HOSTNAME"
fi
echo ""
echo "   🔌 Backend API:"
echo "      http://$SERVER_IP/v1"
echo "      http://$SERVER_IP/health"
echo ""
echo "👤 ${YELLOW}Вход в систему:${NC}"
echo "   Логин:  ${GREEN}admin${NC}"
echo "   Пароль: ${GREEN}admin123${NC}"
echo ""
echo "🗄️  ${YELLOW}База данных:${NC}"
echo "   База:       utmn_security"
echo "   Пользователь: utmn_admin"
echo "   Пароль:     utmn_admin123"
echo ""
echo "📊 ${CYAN}Управление сервисами:${NC}"
echo "   sudo systemctl status utmn-backend utmn-frontend nginx"
echo "   sudo systemctl restart utmn-backend"
echo "   sudo systemctl restart utmn-frontend"
echo "   sudo systemctl restart nginx"
echo ""
echo "📋 ${CYAN}Просмотр логов:${NC}"
echo "   journalctl -u utmn-backend -f"
echo "   journalctl -u utmn-frontend -f"
echo "   sudo tail -f /var/log/nginx/utmn-security-error.log"
echo ""
echo "🔍 ${CYAN}Проверка подключения:${NC}"
echo "   curl http://$SERVER_IP/health"
echo "   mysql -u utmn_admin -putmn_admin123 utmn_security -e 'SHOW TABLES;'"
echo ""
echo "⚠️  ${RED}ВАЖНО ДЛЯ БЕЗОПАСНОСТИ:${NC}"
echo "   1. Измените пароль администратора после первого входа!"
echo "   2. Настройте firewall (ufw allow 80/tcp)"
echo "   3. Для production используйте HTTPS и reverse proxy"
echo "   4. Измените пароли БД в backend/.env"
echo ""
echo "🔥 ${CYAN}Настройка Firewall (опционально):${NC}"
echo "   sudo ufw allow 22/tcp   # SSH"
echo "   sudo ufw allow 80/tcp   # HTTP"
echo "   sudo ufw enable"
echo ""
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "${GREEN}Откройте в браузере: http://$SERVER_IP${NC}"
echo ""
