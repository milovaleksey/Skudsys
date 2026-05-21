#!/bin/bash

# 🔄 Скрипт отката к предыдущей версии

set -e

# Конфигурация
PROD_DIR="/var/www/utmn-security"
BACKUP_DIR="/var/backups/utmn-security"
SERVICE_NAME="utmn-security"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() {
    echo -e "${RED}❌ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Проверка root
if [ "$EUID" -ne 0 ]; then 
    error "Скрипт должен быть запущен с правами root (sudo)"
    exit 1
fi

clear
echo "════════════════════════════════════════"
echo "   🔄 Откат к предыдущей версии"
echo "════════════════════════════════════════"
echo ""

# Список доступных резервных копий
if [ ! -d "$BACKUP_DIR" ]; then
    error "Директория с резервными копиями не найдена: $BACKUP_DIR"
    exit 1
fi

BACKUPS=($(ls -td "$BACKUP_DIR"/backup_* 2>/dev/null))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    error "Резервные копии не найдены в $BACKUP_DIR"
    exit 1
fi

echo "Доступные резервные копии:"
echo ""

for i in "${!BACKUPS[@]}"; do
    BACKUP_NAME=$(basename "${BACKUPS[$i]}")
    BACKUP_DATE=$(echo "$BACKUP_NAME" | sed 's/backup_//' | sed 's/_/ /')
    BACKUP_SIZE=$(du -sh "${BACKUPS[$i]}" | cut -f1)
    echo "  [$i] $BACKUP_DATE (размер: $BACKUP_SIZE)"
done

echo ""
echo "════════════════════════════════════════"
echo ""

# Выбор резервной копии
read -p "Выберите номер резервной копии для восстановления (или Enter для последней): " CHOICE

if [ -z "$CHOICE" ]; then
    CHOICE=0
fi

if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -ge "${#BACKUPS[@]}" ]; then
    error "Неверный выбор"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$CHOICE]}"
BACKUP_NAME=$(basename "$SELECTED_BACKUP")

echo ""
warning "ВНИМАНИЕ! Будет выполнен откат к версии: $BACKUP_NAME"
warning "Текущая версия будет перезаписана!"
echo ""

read -p "Продолжить? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    warning "Откат отменен"
    exit 0
fi

# Создание резервной копии текущей версии перед откатом
log "Создание резервной копии текущей версии..."
TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
PRE_ROLLBACK_BACKUP="${BACKUP_DIR}/pre_rollback_${TIMESTAMP}"

if [ -d "$PROD_DIR" ]; then
    cp -r "$PROD_DIR" "$PRE_ROLLBACK_BACKUP"
    success "Текущая версия сохранена в: $PRE_ROLLBACK_BACKUP"
fi

# Остановка сервисов
log "Остановка сервисов..."
systemctl stop "$SERVICE_NAME" || true

# Восстановление из резервной копии
log "Восстановление из резервной копии..."
rm -rf "$PROD_DIR"
cp -r "$SELECTED_BACKUP" "$PROD_DIR"

# Установка прав
log "Установка прав доступа..."
chown -R www-data:www-data "$PROD_DIR"
find "$PROD_DIR" -type f -exec chmod 644 {} \;
find "$PROD_DIR" -type d -exec chmod 755 {} \;
[ -f "$PROD_DIR/backend/src/server.js" ] && chmod 755 "$PROD_DIR/backend/src/server.js"

# Перезапуск сервисов
log "Перезапуск сервисов..."
systemctl start "$SERVICE_NAME"
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
    success "Сервис $SERVICE_NAME запущен"
else
    error "Сервис $SERVICE_NAME не запустился!"
    systemctl status "$SERVICE_NAME"
    exit 1
fi

systemctl reload nginx

if systemctl is-active --quiet nginx; then
    success "Nginx перезапущен"
else
    error "Nginx не запустился!"
    systemctl status nginx
    exit 1
fi

# Проверка работоспособности
log "Проверка работоспособности..."
sleep 3

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    success "Backend отвечает на запросы"
else
    error "Backend не отвечает!"
fi

echo ""
success "═══════════════════════════════════════════════"
success "  Откат выполнен успешно! 🎉"
success "═══════════════════════════════════════════════"
echo ""

echo "📊 Статус сервисов:"
systemctl status "$SERVICE_NAME" --no-pager -l | head -n 10
echo ""

echo "📝 Восстановлена версия: $BACKUP_NAME"
echo "📁 Текущая версия сохранена в: $PRE_ROLLBACK_BACKUP"
echo ""
