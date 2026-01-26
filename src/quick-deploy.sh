#!/bin/bash

# ⚡ Быстрое развертывание без подтверждений

set -e

SYNC_DIR="/opt/utmn-security"
PROD_DIR="/var/www/utmn-security"
SERVICE_NAME="utmn-security"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}▶${NC} $1"; }
success() { echo -e "${GREEN}✅${NC} $1"; }

# Root check
[ "$EUID" -ne 0 ] && echo "❌ Требуется sudo" && exit 1

echo "⚡ Быстрое развертывание..."
echo ""

# Frontend
log "Сборка frontend..."
cd "$SYNC_DIR/frontend"
[ ! -d "node_modules" ] && npm install > /dev/null 2>&1
npm run build
success "Frontend собран"

# Копирование
log "Копирование файлов..."
mkdir -p "$PROD_DIR"
rm -rf "$PROD_DIR/frontend"/*
cp -r "$SYNC_DIR/frontend/dist"/* "$PROD_DIR/frontend/"
rsync -a --exclude='node_modules' "$SYNC_DIR/backend/" "$PROD_DIR/backend/"
success "Файлы скопированы"

# Backend зависимости
cd "$PROD_DIR/backend"
if [ ! -d "node_modules" ]; then
    log "Установка зависимостей backend..."
    npm install --production > /dev/null 2>&1
fi

# Права
log "Установка прав..."
chown -R www-data:www-data "$PROD_DIR"
success "Права установлены"

# Рестарт
log "Перезапуск сервисов..."
systemctl restart "$SERVICE_NAME"
systemctl reload nginx
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
    success "Backend работает"
else
    echo "❌ Backend не запустился!"
    exit 1
fi

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    success "API отвечает"
else
    echo "⚠️  API не отвечает"
fi

echo ""
success "Развертывание завершено! 🎉"
echo ""
