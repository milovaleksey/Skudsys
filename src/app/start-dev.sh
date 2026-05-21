#!/bin/bash

################################################################################
# Запуск системы в режиме разработки
# Frontend: Vite dev server (http://localhost:5173)
# Backend: Node.js dev server (http://localhost:3000)
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Запуск системы безопасности ТюмГУ                    ║
║     Development Mode                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Проверка зависимостей
log_info "Проверка зависимостей..."

if ! command -v node &> /dev/null; then
    log_error "Node.js не установлен"
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    log_error "MySQL не установлен"
    exit 1
fi

log_success "Node.js: $(node -v)"
log_success "npm: $(npm -v)"

# Проверка и установка зависимостей frontend
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    log_info "Установка зависимостей frontend..."
    cd "$SCRIPT_DIR"
    npm install || npm install --legacy-peer-deps
else
    log_success "Зависимости frontend установлены"
fi

# Проверка и установка зависимостей backend
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    log_info "Установка зависимостей backend..."
    cd "$SCRIPT_DIR/backend"
    npm install
    cd "$SCRIPT_DIR"
else
    log_success "Зависимости backend установлены"
fi

# Проверка .env файла backend
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    log_warning "Файл backend/.env не найден"
    
    if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
        log_info "Создание backend/.env из .env.example..."
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        
        echo ""
        log_warning "⚠️  ВАЖНО: Отредактируйте backend/.env перед запуском!"
        log_info "Укажите параметры подключения к MySQL:"
        log_info "  - DB_USER"
        log_info "  - DB_PASSWORD"
        log_info "  - JWT_SECRET (сгенерируйте: openssl rand -base64 32)"
        echo ""
        
        read -p "Отредактировать .env сейчас? (y/n): " EDIT_ENV
        if [ "$EDIT_ENV" = "y" ]; then
            ${EDITOR:-nano} "$SCRIPT_DIR/backend/.env"
        else
            log_error "Настройте backend/.env и запустите скрипт снова"
            exit 1
        fi
    else
        log_error "Файл .env.example не найден"
        exit 1
    fi
fi

# Проверка подключения к MySQL
log_info "Проверка подключения к MySQL..."
source "$SCRIPT_DIR/backend/.env"

if mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
    log_success "Подключение к MySQL успешно"
else
    log_error "Не удалось подключиться к MySQL"
    log_info "Проверьте параметры в backend/.env"
    
    read -p "Создать базу данных сейчас? (y/n): " CREATE_DB
    if [ "$CREATE_DB" = "y" ]; then
        read -p "Введите пароль root для MySQL: " -s MYSQL_ROOT_PASSWORD
        echo ""
        
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        if [ -f "$SCRIPT_DIR/database/schema.sql" ]; then
            log_info "Импорт схемы базы данных..."
            mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SCRIPT_DIR/database/schema.sql"
            log_success "Схема импортирована"
        fi
    else
        exit 1
    fi
fi

# Получаем IP адрес для отображения
SERVER_IP=$(hostname -I | awk '{print $1}' || echo "localhost")

echo ""
log_success "Все проверки пройдены!"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Запуск серверов...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
log_info "Backend API будет доступен на:"
echo "   http://localhost:3000"
echo "   http://${SERVER_IP}:3000"
echo ""
log_info "Frontend будет доступен на:"
echo "   http://localhost:5173"
echo "   http://${SERVER_IP}:5173"
echo ""
log_info "Health Check: http://localhost:3000/health"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
log_warning "Нажмите Ctrl+C для остановки серверов"
echo ""
sleep 2

# Функция очистки при завершении
cleanup() {
    echo ""
    log_info "Остановка серверов..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    log_success "Серверы остановлены"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Запуск backend
cd "$SCRIPT_DIR/backend"
log_info "Запуск backend..."
node src/server.js &
BACKEND_PID=$!

sleep 2

# Проверка, что backend запустился
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log_error "Backend не запустился. Проверьте логи выше."
    exit 1
fi

# Запуск frontend
cd "$SCRIPT_DIR"
log_info "Запуск frontend..."
npm run dev &
FRONTEND_PID=$!

# Ожидание завершения
wait
