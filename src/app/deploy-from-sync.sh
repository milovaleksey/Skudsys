#!/bin/bash

# 🚀 Скрипт развертывания из /opt/utmn-security в /var/www/utmn-security
# Автор: ТюмГУ
# Описание: Собирает frontend, копирует в production и перезапускает службы

set -e  # Остановка при ошибке

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

SYNC_DIR="/opt/utmn-security"
PROD_DIR="/var/www/utmn-security"
SERVICE_NAME="utmn-security"
BACKUP_DIR="/var/backups/utmn-security"
LOG_FILE="/var/log/utmn-security-deploy.log"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Проверка прав root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        error "Скрипт должен быть запущен с правами root (sudo)"
        exit 1
    fi
}

# Проверка что директории существуют
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

# Создание резервной копии
create_backup() {
    log "Создание резервной копии..."
    
    TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
    BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$PROD_DIR" ]; then
        cp -r "$PROD_DIR" "$BACKUP_PATH"
        success "Резервная копия создана: $BACKUP_PATH"
        
        # Удаляем старые бэкапы (старше 7 дней)
        find "$BACKUP_DIR" -type d -name "backup_*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
        log "Старые резервные копии очищены"
    else
        warning "Production директория не существует, пропускаем резервное копирование"
    fi
}

# Сборка frontend
build_frontend() {
    log "Сборка frontend..."
    
    cd "$SYNC_DIR/frontend"
    
    # Проверка наличия node_modules
    if [ ! -d "node_modules" ]; then
        log "Установка зависимостей frontend..."
        npm install
    fi
    
    # Сборка
    log "Запуск npm run build..."
    npm run build
    
    if [ ! -d "dist" ]; then
        error "Сборка frontend не создала директорию dist!"
        exit 1
    fi
    
    success "Frontend собран успешно"
}

# Копирование файлов в production
deploy_files() {
    log "Развертывание файлов в production..."
    
    # Создание директорий
    mkdir -p "$PROD_DIR/frontend"
    mkdir -p "$PROD_DIR/backend"
    
    # Frontend
    log "Копирование frontend..."
    rm -rf "$PROD_DIR/frontend"/*
    cp -r "$SYNC_DIR/frontend/dist"/* "$PROD_DIR/frontend/"
    success "Frontend скопирован"
    
    # Backend
    log "Копирование backend..."
    rsync -av --exclude='node_modules' "$SYNC_DIR/backend/" "$PROD_DIR/backend/"
    success "Backend скопирован"
    
    # Установка зависимостей backend
    log "Проверка зависимостей backend..."
    cd "$PROD_DIR/backend"
    
    # Сравниваем package.json
    if [ ! -d "node_modules" ] || [ "$SYNC_DIR/backend/package.json" -nt "node_modules" ]; then
        log "Установка зависимостей backend..."
        npm install --production
        success "Зависимости backend установлены"
    else
        log "Зависимости backend актуальны"
    fi
    
    # Копирование конфигурации nginx (если есть)
    if [ -f "$SYNC_DIR/nginx/utmn-security.conf" ]; then
        log "Обновление конфигурации Nginx..."
        cp "$SYNC_DIR/nginx/utmn-security.conf" /etc/nginx/sites-available/utmn-security.conf
        
        # Создание симлинка если не существует
        if [ ! -L "/etc/nginx/sites-enabled/utmn-security.conf" ]; then
            ln -s /etc/nginx/sites-available/utmn-security.conf /etc/nginx/sites-enabled/
        fi
        
        # Проверка конфигурации nginx
        nginx -t
        success "Конфигурация Nginx обновлена"
    fi
    
    # Копирование systemd сервиса (если есть)
    if [ -f "$SYNC_DIR/systemd/utmn-security.service" ]; then
        log "Обновление systemd сервиса..."
        cp "$SYNC_DIR/systemd/utmn-security.service" /etc/systemd/system/
        systemctl daemon-reload
        success "Systemd сервис обновлен"
    fi
}

# Установка прав доступа
set_permissions() {
    log "Установка прав доступа..."
    
    # Установка владельца (обычно www-data для nginx)
    chown -R www-data:www-data "$PROD_DIR/frontend"
    chown -R www-data:www-data "$PROD_DIR/backend"
    
    # Права на файлы
    find "$PROD_DIR" -type f -exec chmod 644 {} \;
    find "$PROD_DIR" -type d -exec chmod 755 {} \;
    
    # Исполняемые файлы backend
    [ -f "$PROD_DIR/backend/src/server.js" ] && chmod 755 "$PROD_DIR/backend/src/server.js"
    
    success "Права доступа установлены"
}

# Перезапуск служб
restart_services() {
    log "Перезапуск служб..."
    
    # Перезапуск backend сервиса
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
    
    # Перезапуск Nginx
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

# Проверка работоспособности
health_check() {
    log "Проверка работоспособности..."
    
    # Проверка backend
    sleep 3
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend отвечает на запросы"
    else
        error "Backend не отвечает на /health endpoint"
        warning "Проверьте логи: journalctl -u $SERVICE_NAME -n 50"
        exit 1
    fi
    
    # Проверка frontend через nginx
    if curl -f http://localhost/ > /dev/null 2>&1; then
        success "Frontend доступен через Nginx"
    else
        warning "Frontend может быть недоступен через Nginx"
    fi
}

# Показать статус
show_status() {
    echo ""
    echo "════════════════════════════════════════"
    echo "         СТАТУС РАЗВЕРТЫВАНИЯ"
    echo "════════════════════════════════════════"
    echo ""
    
    # Статус сервисов
    echo "📊 Статус сервисов:"
    systemctl status "$SERVICE_NAME" --no-pager -l | head -n 10
    echo ""
    systemctl status nginx --no-pager -l | head -n 3
    echo ""
    
    # Размер развертывания
    FRONTEND_SIZE=$(du -sh "$PROD_DIR/frontend" 2>/dev/null | cut -f1)
    BACKEND_SIZE=$(du -sh "$PROD_DIR/backend" 2>/dev/null | cut -f1)
    
    echo "📁 Размеры:"
    echo "   Frontend: $FRONTEND_SIZE"
    echo "   Backend:  $BACKEND_SIZE"
    echo ""
    
    # Версия (если есть)
    if [ -f "$PROD_DIR/backend/package.json" ]; then
        VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PROD_DIR/backend/package.json" 2>/dev/null || echo "неизвестно")
        echo "📦 Версия: $VERSION"
        echo ""
    fi
    
    echo "════════════════════════════════════════"
}

# Откат на предыдущую версию
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
    echo "════════════════════════════════════════"
    echo ""
    echo "Из:  $SYNC_DIR"
    echo "В:   $PROD_DIR"
    echo ""
    echo "════════════════════════════════════════"
    echo ""
    
    # Проверки
    check_root
    check_directories
    
    # Подтверждение
    read -p "Продолжить развертывание? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Развертывание отменено"
        exit 0
    fi
    
    # Установка trap для отката при ошибке
    trap rollback ERR
    
    # Основной процесс
    create_backup
    build_frontend
    deploy_files
    set_permissions
    restart_services
    health_check
    
    # Успех
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

# ============================================================================
# ЗАПУСК
# ============================================================================

main "$@"
