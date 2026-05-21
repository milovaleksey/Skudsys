#!/bin/bash

# 📊 Проверка статуса системы UTMN Security

# Конфигурация
PROD_DIR="/var/www/utmn-security"
SERVICE_NAME="utmn-security"
BACKUP_DIR="/var/backups/utmn-security"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

status_ok() {
    echo -e "${GREEN}●${NC} $1"
}

status_error() {
    echo -e "${RED}●${NC} $1"
}

status_warning() {
    echo -e "${YELLOW}●${NC} $1"
}

clear
echo "════════════════════════════════════════════════════════"
echo "           📊 Статус системы UTMN Security"
echo "════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# СЕРВИСЫ
# ============================================================================

echo -e "${CYAN}🔧 Сервисы:${NC}"
echo ""

# Backend Service
if systemctl is-active --quiet "$SERVICE_NAME"; then
    status_ok "Backend ($SERVICE_NAME) - работает"
    UPTIME=$(systemctl show -p ActiveEnterTimestamp "$SERVICE_NAME" --value)
    echo "   Запущен: $UPTIME"
else
    status_error "Backend ($SERVICE_NAME) - остановлен"
fi

# Nginx
if systemctl is-active --quiet nginx; then
    status_ok "Nginx - работает"
else
    status_error "Nginx - остановлен"
fi

# MySQL
if systemctl is-active --quiet mysql; then
    status_ok "MySQL - работает"
else
    status_warning "MySQL - остановлен"
fi

echo ""

# ============================================================================
# ENDPOINTS
# ============================================================================

echo -e "${CYAN}🌐 Endpoints:${NC}"
echo ""

# Backend Health
if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    status_ok "Backend API (http://localhost:3000/health)"
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health 2>/dev/null)
    if [ -n "$HEALTH_RESPONSE" ]; then
        echo "   $HEALTH_RESPONSE"
    fi
else
    status_error "Backend API - не отвечает"
fi

# Frontend через Nginx
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    status_ok "Frontend (http://localhost/)"
else
    status_error "Frontend - недоступен"
fi

# API через Nginx
if curl -f -s http://localhost/v1/health > /dev/null 2>&1; then
    status_ok "API через Nginx (http://localhost/v1/health)"
else
    status_warning "API через Nginx - недоступен (может быть не настроен)"
fi

echo ""

# ============================================================================
# ФАЙЛЫ И ДИРЕКТОРИИ
# ============================================================================

echo -e "${CYAN}📁 Файлы и директории:${NC}"
echo ""

if [ -d "$PROD_DIR/frontend" ]; then
    FRONTEND_SIZE=$(du -sh "$PROD_DIR/frontend" 2>/dev/null | cut -f1)
    FRONTEND_FILES=$(find "$PROD_DIR/frontend" -type f 2>/dev/null | wc -l)
    status_ok "Frontend: $FRONTEND_SIZE ($FRONTEND_FILES файлов)"
else
    status_error "Frontend - не найден"
fi

if [ -d "$PROD_DIR/backend" ]; then
    BACKEND_SIZE=$(du -sh "$PROD_DIR/backend" 2>/dev/null | cut -f1)
    status_ok "Backend: $BACKEND_SIZE"
    
    # Версия из package.json
    if [ -f "$PROD_DIR/backend/package.json" ]; then
        VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PROD_DIR/backend/package.json" 2>/dev/null || echo "unknown")
        echo "   Версия: $VERSION"
    fi
else
    status_error "Backend - не найден"
fi

if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(ls -d "$BACKUP_DIR"/backup_* 2>/dev/null | wc -l)
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    status_ok "Резервные копии: $BACKUP_COUNT (размер: $BACKUP_SIZE)"
    
    if [ $BACKUP_COUNT -gt 0 ]; then
        LAST_BACKUP=$(ls -td "$BACKUP_DIR"/backup_* 2>/dev/null | head -n 1)
        LAST_BACKUP_NAME=$(basename "$LAST_BACKUP" | sed 's/backup_//' | sed 's/_/ /')
        echo "   Последняя: $LAST_BACKUP_NAME"
    fi
else
    status_warning "Резервные копии - не найдены"
fi

echo ""

# ============================================================================
# РЕСУРСЫ
# ============================================================================

echo -e "${CYAN}💻 Ресурсы системы:${NC}"
echo ""

# CPU и Memory для backend
if systemctl is-active --quiet "$SERVICE_NAME"; then
    MEMORY=$(systemctl show "$SERVICE_NAME" -p MemoryCurrent --value 2>/dev/null)
    if [ -n "$MEMORY" ] && [ "$MEMORY" != "[not set]" ]; then
        MEMORY_MB=$((MEMORY / 1024 / 1024))
        echo "   Backend память: ${MEMORY_MB}MB"
    fi
fi

# Disk space
DISK_USAGE=$(df -h "$PROD_DIR" 2>/dev/null | awk 'NR==2 {print $5 " использовано (" $4 " свободно)"}')
if [ -n "$DISK_USAGE" ]; then
    echo "   Диск: $DISK_USAGE"
fi

# Load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
echo "   Load average:$LOAD_AVG"

echo ""

# ============================================================================
# ЛОГИ
# ============================================================================

echo -e "${CYAN}📝 Последние события:${NC}"
echo ""

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Последние логи backend:"
    journalctl -u "$SERVICE_NAME" -n 5 --no-pager -o short 2>/dev/null | sed 's/^/   /'
fi

echo ""

# ============================================================================
# ПОРТЫ
# ============================================================================

echo -e "${CYAN}🔌 Порты:${NC}"
echo ""

# Проверка портов
if ss -tuln | grep -q ':3000 '; then
    status_ok "Backend порт 3000 - слушает"
else
    status_error "Backend порт 3000 - не слушает"
fi

if ss -tuln | grep -q ':80 '; then
    status_ok "HTTP порт 80 - слушает"
else
    status_warning "HTTP порт 80 - не слушает"
fi

if ss -tuln | grep -q ':443 '; then
    status_ok "HTTPS порт 443 - слушает"
else
    status_warning "HTTPS порт 443 - не слушает"
fi

if ss -tuln | grep -q ':3306 '; then
    status_ok "MySQL порт 3306 - слушает"
else
    status_warning "MySQL порт 3306 - не слушает"
fi

echo ""

# ============================================================================
# ИТОГОВЫЙ СТАТУС
# ============================================================================

# Подсчет работающих компонентов
TOTAL=0
WORKING=0

# Backend
TOTAL=$((TOTAL + 1))
systemctl is-active --quiet "$SERVICE_NAME" && WORKING=$((WORKING + 1))

# Nginx
TOTAL=$((TOTAL + 1))
systemctl is-active --quiet nginx && WORKING=$((WORKING + 1))

# Backend API
TOTAL=$((TOTAL + 1))
curl -f -s http://localhost:3000/health > /dev/null 2>&1 && WORKING=$((WORKING + 1))

# Frontend
TOTAL=$((TOTAL + 1))
curl -f -s http://localhost/ > /dev/null 2>&1 && WORKING=$((WORKING + 1))

echo "════════════════════════════════════════════════════════"

if [ $WORKING -eq $TOTAL ]; then
    echo -e "${GREEN}✅ Все компоненты работают ($WORKING/$TOTAL)${NC}"
elif [ $WORKING -eq 0 ]; then
    echo -e "${RED}❌ Все компоненты остановлены ($WORKING/$TOTAL)${NC}"
else
    echo -e "${YELLOW}⚠️  Работают частично ($WORKING/$TOTAL компонентов)${NC}"
fi

echo "════════════════════════════════════════════════════════"
echo ""

# Полезные команды
echo "📌 Полезные команды:"
echo ""
echo "   Логи backend:  sudo journalctl -u $SERVICE_NAME -f"
echo "   Логи nginx:    sudo tail -f /var/log/nginx/error.log"
echo "   Рестарт:       sudo systemctl restart $SERVICE_NAME"
echo "   Развернуть:    sudo ./deploy-from-sync.sh"
echo "   Откат:         sudo ./rollback.sh"
echo ""
