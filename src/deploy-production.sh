#!/bin/bash

# 🚀 Полное развертывание UTMN Security с проверкой backend и БД

set -e

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

SYNC_DIR="/opt/Skudsys/src"
PROD_DIR="/var/www/utmn-security"
SERVICE_NAME="utmn-security"
BACKUP_DIR="/var/backups/utmn-security"
LOG_FILE="/var/log/utmn-security-deploy.log"

# Backend конфигурация
BACKEND_ENV_TEMPLATE="${SYNC_DIR}/backend/.env.example"
BACKEND_ENV_PROD="${PROD_DIR}/backend/.env"
DB_MIGRATIONS_DIR="${SYNC_DIR}/database/migrations"
DB_INIT_SQL="${SYNC_DIR}/database/init.sql"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# ФУНКЦИИ
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        error "Скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
}

check_directories() {
    log "Проверка директорий..."
    
    if [ ! -d "$SYNC_DIR" ]; then
        error "Директория синхронизации $SYNC_DIR не найдена!"
        exit 1
    fi
    
    if [ ! -d "$SYNC_DIR/frontend" ]; then
        error "Директория $SYNC_DIR/frontend не найдена!"
        exit 1
    fi
    
    if [ ! -d "$SYNC_DIR/backend" ]; then
        error "Директория $SYNC_DIR/backend не найдена!"
        exit 1
    fi
    
    success "Директории найдены"
}

# Проверка MySQL подключения
check_mysql() {
    log "Проверка MySQL..."
    
    if ! systemctl is-active --quiet mysql; then
        error "MySQL не запущен!"
        info "Запускаю MySQL..."
        systemctl start mysql
        sleep 3
    fi
    
    success "MySQL работает"
}

# Создание .env файла если не существует
create_env_file() {
    log "Проверка .env файла backend..."
    
    if [ ! -f "$BACKEND_ENV_PROD" ]; then
        warning ".env файл не найден, создаем из шаблона..."
        
        if [ -f "$BACKEND_ENV_TEMPLATE" ]; then
            cp "$BACKEND_ENV_TEMPLATE" "$BACKEND_ENV_PROD"
            info "Скопирован .env.example → .env"
        else
            # Создаем базовый .env
            cat > "$BACKEND_ENV_PROD" << 'EOF'
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=change_this_password

# JWT
JWT_SECRET=change_this_secret_to_random_string
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Сервер
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://localhost

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Логирование
LOG_LEVEL=info
EOF
            warning "Создан базовый .env файл"
        fi
        
        error "⚠️  ВАЖНО! Отредактируйте $BACKEND_ENV_PROD"
        error "Установите правильные значения для:"
        error "  - DB_PASSWORD"
        error "  - JWT_SECRET"
        error "  - JWT_REFRESH_SECRET"
        error "  - CORS_ORIGIN"
        echo ""
        
        read -p "Продолжить с текущими значениями? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Отредактируйте .env и запустите скрипт снова"
            exit 0
        fi
    else
        success ".env файл существует"
    fi
    
    # Проверка обязательных переменных
    check_env_variables
}

check_env_variables() {
    log "Проверка переменных окружения..."
    
    # Загружаем .env
    if [ -f "$BACKEND_ENV_PROD" ]; then
        source "$BACKEND_ENV_PROD"
    else
        error "Файл .env не найден!"
        exit 1
    fi
    
    # Проверяем критичные переменные
    local errors=0
    
    if [ -z "$DB_HOST" ]; then
        error "DB_HOST не установлен в .env"
        errors=$((errors + 1))
    fi
    
    if [ -z "$DB_NAME" ]; then
        error "DB_NAME не установлен в .env"
        errors=$((errors + 1))
    fi
    
    if [ -z "$DB_USER" ]; then
        error "DB_USER не установлен в .env"
        errors=$((errors + 1))
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "change_this_password" ]; then
        warning "DB_PASSWORD не установлен или используется значение по умолчанию!"
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change_this_secret_to_random_string" ]; then
        warning "JWT_SECRET не установлен или используется значение по умолчанию!"
    fi
    
    if [ $errors -gt 0 ]; then
        error "Найдено $errors критичных ошибок в .env"
        exit 1
    fi
    
    success "Переменные окружения проверены"
}

# Проверка и создание базы данных
setup_database() {
    log "Настройка базы данных..."
    
    # Загружаем переменные
    source "$BACKEND_ENV_PROD"
    
    # Проверяем существование базы данных
    DB_EXISTS=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep "$DB_NAME" || true)
    
    if [ -z "$DB_EXISTS" ]; then
        warning "База данных $DB_NAME не существует"
        
        read -p "Создать базу данных и выполнить инициализацию? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Создание базы данных $DB_NAME..."
            
            mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
            
            success "База данных создана"
            
            # Инициализация схемы
            if [ -f "$DB_INIT_SQL" ]; then
                log "Выполнение init.sql..."
                mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$DB_INIT_SQL" 2>/dev/null
                success "Схема базы данных инициализирована"
            else
                warning "Файл $DB_INIT_SQL не найден"
            fi
        else
            warning "Пропускаем создание базы данных"
        fi
    else
        success "База данных $DB_NAME существует"
    fi
}

# Выполнение миграций
run_migrations() {
    log "Проверка миграций..."
    
    if [ ! -d "$DB_MIGRATIONS_DIR" ]; then
        info "Директория миграций не найдена, пропускаем"
        return
    fi
    
    # Загружаем переменные
    source "$BACKEND_ENV_PROD"
    
    # Подсчет SQL файлов
    MIGRATION_COUNT=$(find "$DB_MIGRATIONS_DIR" -name "*.sql" 2>/dev/null | wc -l)
    
    if [ "$MIGRATION_COUNT" -eq 0 ]; then
        info "Миграции не найдены"
        return
    fi
    
    log "Найдено миграций: $MIGRATION_COUNT"
    
    read -p "Выполнить миграции? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for migration in "$DB_MIGRATIONS_DIR"/*.sql; do
            if [ -f "$migration" ]; then
                MIGRATION_NAME=$(basename "$migration")
                log "Выполнение миграции: $MIGRATION_NAME"
                
                if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$migration" 2>/dev/null; then
                    success "✓ $MIGRATION_NAME"
                else
                    error "✗ $MIGRATION_NAME - ошибка!"
                fi
            fi
        done
        success "Миграции выполнены"
    else
        info "Миграции пропущены"
    fi
}

# Проверка подключения к БД
test_db_connection() {
    log "Проверка подключения к базе данных..."
    
    source "$BACKEND_ENV_PROD"
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1;" >/dev/null 2>&1; then
        success "Подключение к БД работает"
    else
        error "Не удалось подключиться к базе данных!"
        error "Проверьте настройки в $BACKEND_ENV_PROD"
        exit 1
    fi
}

create_backup() {
    log "Создание резервной копии..."
    
    TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
    BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$PROD_DIR" ]; then
        cp -r "$PROD_DIR" "$BACKUP_PATH"
        success "Резервная копия создана: $BACKUP_PATH"
        
        # Резервная копия БД
        source "$BACKEND_ENV_PROD" 2>/dev/null || true
        if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
            log "Создание резервной копии БД..."
            mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "${BACKUP_PATH}/database_backup.sql" 2>/dev/null || true
            if [ -f "${BACKUP_PATH}/database_backup.sql" ]; then
                success "Резервная копия БД создана"
            fi
        fi
        
        # Удаляем старые бэкапы (старше 7 дней)
        find "$BACKUP_DIR" -type d -name "backup_*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
        log "Старые резервные копии очищены"
    else
        warning "Production директория не существует, пропускаем резервное копирование"
    fi
}

build_frontend() {
    log "Сборка frontend..."
    
    cd "$SYNC_DIR/frontend"
    
    # Проверяем наличие package.json
    if [ ! -f "package.json" ]; then
        error "package.json не найден в $SYNC_DIR/frontend"
        exit 1
    fi
    
    # Всегда устанавливаем зависимости (обновляет если изменился package.json)
    log "Установка/обновление зависимостей frontend..."
    npm install
    success "Зависимости frontend установлены"
    
    log "Запуск npm run build..."
    npm run build
    
    if [ ! -d "dist" ]; then
        error "Сборка frontend не создала директорию dist!"
        exit 1
    fi
    
    success "Frontend собран успешно"
}

deploy_files() {
    log "Развертывание файлов в production..."
    
    mkdir -p "$PROD_DIR/frontend"
    mkdir -p "$PROD_DIR/backend"
    
    # Frontend
    log "Копирование frontend..."
    rm -rf "$PROD_DIR/frontend"/*
    cp -r "$SYNC_DIR/frontend/dist"/* "$PROD_DIR/frontend/"
    success "Frontend скопирован"
    
    # Backend
    log "Копирование backend..."
    # Используем cp вместо rsync, так как rsync может отсутствовать
    # Копируем все, кроме node_modules и .env
    if [ -d "$SYNC_DIR/backend" ]; then
        cd "$SYNC_DIR/backend" || exit 1
        # Копируем все файлы и папки текущего уровня, исключая node_modules и .env
        find . -maxdepth 1 -not -name 'node_modules' -not -name '.env' -not -name '.' -exec cp -r {} "$PROD_DIR/backend/" \;
    fi
    success "Backend скопирован"
    
    # .env для backend
    if [ -f "$BACKEND_ENV_PROD" ]; then
        log ".env уже существует в production"
    else
        if [ -f "$SYNC_DIR/backend/.env" ]; then
            cp "$SYNC_DIR/backend/.env" "$BACKEND_ENV_PROD"
            success ".env скопирован в production"
        fi
    fi
    
    # Установка зависимостей backend
    log "Проверка зависимостей backend..."
    cd "$PROD_DIR/backend"
    
    if [ ! -d "node_modules" ] || [ "$SYNC_DIR/backend/package.json" -nt "node_modules" ]; then
        log "Установка зависимостей backend..."
        npm install --production
        success "Зависимости backend установлены"
    else
        log "Зависимости backend актуальны"
    fi
    
    # Копирование конфигурации nginx
    if [ -f "$SYNC_DIR/nginx/utmn-security.conf" ]; then
        log "Обновление конфигурации Nginx..."
        cp "$SYNC_DIR/nginx/utmn-security.conf" /etc/nginx/sites-available/utmn-security.conf
        
        if [ ! -L "/etc/nginx/sites-enabled/utmn-security.conf" ]; then
            ln -s /etc/nginx/sites-available/utmn-security.conf /etc/nginx/sites-enabled/
        fi
        
        nginx -t
        success "Конфигурация Nginx обновлена"
    fi
    
    # Копирование systemd сервиса
    if [ -f "$SYNC_DIR/systemd/utmn-security.service" ]; then
        log "Обновление systemd сервиса..."
        cp "$SYNC_DIR/systemd/utmn-security.service" /etc/systemd/system/
        systemctl daemon-reload
        success "Systemd сервис обновлен"
    fi
}

set_permissions() {
    log "Установка прав доступа..."
    
    chown -R www-data:www-data "$PROD_DIR/frontend"
    chown -R www-data:www-data "$PROD_DIR/backend"
    
    find "$PROD_DIR" -type f -exec chmod 644 {} \;
    find "$PROD_DIR" -type d -exec chmod 755 {} \;
    
    [ -f "$PROD_DIR/backend/src/server.js" ] && chmod 755 "$PROD_DIR/backend/src/server.js"
    
    # .env должен быть только для чтения владельцем
    if [ -f "$BACKEND_ENV_PROD" ]; then
        chmod 600 "$BACKEND_ENV_PROD"
        chown www-data:www-data "$BACKEND_ENV_PROD"
    fi
    
    success "Права доступа установлены"
}

restart_services() {
    log "Перезапуск служб..."
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log "Перезапуск $SERVICE_NAME..."
        systemctl restart "$SERVICE_NAME"
        sleep 2
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            success "Сервис $SERVICE_NAME перезапущен"
        else
            error "Сервис $SERVICE_NAME не запустился!"
            systemctl status "$SERVICE_NAME"
            exit 1
        fi
    else
        warning "Сервис $SERVICE_NAME не запущен, запускаем..."
        systemctl enable "$SERVICE_NAME"
        systemctl start "$SERVICE_NAME"
        sleep 2
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            success "Сервис $SERVICE_NAME запущен"
        else
            error "Не удалось запустить сервис $SERVICE_NAME!"
            systemctl status "$SERVICE_NAME"
            exit 1
        fi
    fi
    
    log "Перезапуск Nginx..."
    systemctl reload nginx || systemctl restart nginx
    
    if systemctl is-active --quiet nginx; then
        success "Nginx перезапущен"
    else
        error "Nginx не запустился!"
        systemctl status nginx
        exit 1
    fi
}

health_check() {
    log "Проверка работоспособности..."
    
    sleep 3
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend отвечает на запросы"
    else
        error "Backend не отвечает на /health endpoint"
        warning "Проверьте логи: journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
    
    if curl -f http://localhost/ > /dev/null 2>&1; then
        success "Frontend доступен через Nginx"
    else
        warning "Frontend может быть недоступен через Nginx"
    fi
}

show_status() {
    echo ""
    echo "════════════════════════════════════════"
    echo "         СТАТУС РАЗВЕРТЫВАНИЯ"
    echo "════════════════════════════════════════"
    echo ""
    
    systemctl status "$SERVICE_NAME" --no-pager -l | head -n 10
    echo ""
    systemctl status nginx --no-pager -l | head -n 3
    echo ""
    
    FRONTEND_SIZE=$(du -sh "$PROD_DIR/frontend" 2>/dev/null | cut -f1)
    BACKEND_SIZE=$(du -sh "$PROD_DIR/backend" 2>/dev/null | cut -f1)
    
    echo "📁 Размеры:"
    echo "   Frontend: $FRONTEND_SIZE"
    echo "   Backend:  $BACKEND_SIZE"
    echo ""
    
    if [ -f "$PROD_DIR/backend/package.json" ]; then
        VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PROD_DIR/backend/package.json" 2>/dev/null || echo "неизвестно")
        echo "📦 Версия: $VERSION"
        echo ""
    fi
    
    echo "════════════════════════════════════════"
}

rollback() {
    error "Выполняется откат к предыдущей версии..."
    
    LAST_BACKUP=$(ls -td "$BACKUP_DIR"/backup_* 2>/dev/null | head -n 1)
    
    if [ -n "$LAST_BACKUP" ]; then
        log "Восстановление из $LAST_BACKUP..."
        rm -rf "$PROD_DIR"
        cp -r "$LAST_BACKUP" "$PROD_DIR"
        
        systemctl restart "$SERVICE_NAME"
        systemctl reload nginx
        
        success "Откат выполнен успешно"
        exit 1
    else
        error "Резервные копии не найдены, откат невозможен!"
        exit 1
    fi
}

# ============================================================================
# ГЛАВНАЯ ФУНКЦИЯ
# ============================================================================

main() {
    clear
    echo "════════════════════════════════════════"
    echo "   🚀 Развертывание UTMN Security"
    echo "   (с проверкой backend и БД)"
    echo "════════════════════════════════════════"
    echo ""
    echo "Из:  $SYNC_DIR"
    echo "В:   $PROD_DIR"
    echo ""
    echo "════════════════════════════════════════"
    echo ""
    
    check_root
    check_directories
    check_mysql
    
    # Backend конфигурация
    create_env_file
    setup_database
    test_db_connection
    run_migrations
    
    echo ""
    read -p "Продолжить развертывание? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Развертывание отменено"
        exit 0
    fi
    
    trap rollback ERR
    
    create_backup
    build_frontend
    deploy_files
    set_permissions
    restart_services
    health_check
    
    echo ""
    success "═══════════════════════════════════════════════"
    success "  Развертывание завершено успешно! 🎉"
    success "═══════════════════════════════════════════════"
    echo ""
    
    show_status
    
    echo ""
    echo "📝 Полезные команды:"
    echo ""
    echo "   Логи backend:"
    echo "   sudo journalctl -u $SERVICE_NAME -f --no-pager"
    echo ""
    echo "   Логи Nginx:"
    echo "   sudo tail -f /var/log/nginx/access.log"
    echo "   sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "   Статус сервисов:"
    echo "   sudo systemctl status $SERVICE_NAME"
    echo "   sudo systemctl status nginx"
    echo ""
    echo "   Откат к предыдущей версии:"
    echo "   sudo ./rollback.sh"
    echo ""
    
    log "Развертывание завершено успешно"
}

main "$@"