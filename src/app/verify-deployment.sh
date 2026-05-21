#!/bin/bash

################################################################################
# Проверка развертывания системы безопасности ТюмГУ
# Проверяет все компоненты и выдает отчет о готовности
################################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SUCCESS=0
WARNINGS=0
ERRORS=0

log_test() { echo -n -e "${BLUE}Testing${NC} $1... "; }
log_ok() { echo -e "${GREEN}OK${NC}"; ((SUCCESS++)); }
log_warn() { echo -e "${YELLOW}WARNING${NC} - $1"; ((WARNINGS++)); }
log_fail() { echo -e "${RED}FAIL${NC} - $1"; ((ERRORS++)); }

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Проверка развертывания системы ТюмГУ                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# Проверка зависимостей
echo -e "${CYAN}━━━ Проверка зависимостей ━━━${NC}"
echo ""

log_test "Node.js установлен"
if command -v node &> /dev/null; then
    VERSION=$(node -v)
    log_ok
    echo "  └─ Версия: $VERSION"
else
    log_fail "Node.js не установлен"
fi

log_test "npm установлен"
if command -v npm &> /dev/null; then
    VERSION=$(npm -v)
    log_ok
    echo "  └─ Версия: $VERSION"
else
    log_fail "npm не установлен"
fi

log_test "MySQL установлен"
if command -v mysql &> /dev/null; then
    VERSION=$(mysql --version | awk '{print $5}' | cut -d',' -f1)
    log_ok
    echo "  └─ Версия: $VERSION"
else
    log_fail "MySQL не установлен"
fi

log_test "Nginx установлен"
if command -v nginx &> /dev/null; then
    VERSION=$(nginx -v 2>&1 | awk '{print $3}')
    log_ok
    echo "  └─ Версия: $VERSION"
else
    log_fail "Nginx не установлен"
fi

echo ""
echo -e "${CYAN}━━━ Проверка сервисов ━━━${NC}"
echo ""

log_test "MySQL запущен"
if systemctl is-active --quiet mysql; then
    log_ok
else
    log_fail "MySQL не запущен"
fi

log_test "Nginx запущен"
if systemctl is-active --quiet nginx; then
    log_ok
else
    log_fail "Nginx не запущен"
fi

log_test "Backend сервис (utmn-security)"
if systemctl is-active --quiet utmn-security; then
    log_ok
elif [ -f /etc/systemd/system/utmn-security.service ]; then
    log_warn "Сервис настроен, но не запущен"
else
    log_warn "Сервис не настроен (возможно dev режим)"
fi

echo ""
echo -e "${CYAN}━━━ Проверка файлов ━━━${NC}"
echo ""

log_test "Frontend собран (dist/)"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    SIZE=$(du -sh dist/ | awk '{print $1}')
    log_ok
    echo "  └─ Размер: $SIZE"
else
    log_warn "Frontend не собран (используйте: npm run build)"
fi

log_test "Backend зависимости"
if [ -d "backend/node_modules" ]; then
    log_ok
else
    log_warn "Backend зависимости не установлены (используйте: cd backend && npm install)"
fi

log_test "Backend .env файл"
if [ -f "backend/.env" ]; then
    log_ok
    # Проверка обязательных параметров
    if grep -q "DB_PASSWORD=" backend/.env; then
        echo "  └─ DB_PASSWORD: Установлен"
    else
        log_warn "DB_PASSWORD не установлен в .env"
    fi
    if grep -q "JWT_SECRET=" backend/.env; then
        echo "  └─ JWT_SECRET: Установлен"
    else
        log_warn "JWT_SECRET не установлен в .env"
    fi
else
    log_fail "backend/.env не найден"
fi

log_test "База данных создана"
if [ -f "backend/.env" ]; then
    source backend/.env
    if mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
        log_ok
        
        # Проверка таблиц
        TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';")
        echo "  └─ Таблиц: $TABLE_COUNT"
        
        if [ "$TABLE_COUNT" -lt 10 ]; then
            log_warn "Мало таблиц, возможно схема не импортирована"
        fi
    else
        log_fail "Не удалось подключиться к БД"
    fi
else
    log_warn "Пропущено (нет .env файла)"
fi

echo ""
echo -e "${CYAN}━━━ Проверка конфигураций ━━━${NC}"
echo ""

log_test "Nginx конфигурация"
if [ -f "/etc/nginx/sites-available/utmn-security" ]; then
    if nginx -t 2>&1 | grep -q "successful"; then
        log_ok
    else
        log_fail "Nginx конфигурация содержит ошибки"
    fi
else
    log_warn "Nginx конфигурация не установлена"
fi

log_test "Systemd сервис"
if [ -f "/etc/systemd/system/utmn-security.service" ]; then
    log_ok
else
    log_warn "Systemd сервис не установлен"
fi

echo ""
echo -e "${CYAN}━━━ Проверка доступности ━━━${NC}"
echo ""

log_test "Backend API (localhost:3000)"
if curl -s http://localhost:3000/health | grep -q "success"; then
    log_ok
    # Получаем версию API
    VERSION=$(curl -s http://localhost:3000/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "  └─ API Version: $VERSION"
else
    log_fail "Backend не отвечает"
fi

log_test "Frontend через Nginx (localhost)"
if curl -s http://localhost/ | grep -q "html"; then
    log_ok
else
    log_warn "Frontend не доступен через Nginx"
fi

log_test "Health check через Nginx"
if curl -s http://localhost/health | grep -q "success"; then
    log_ok
else
    log_warn "Health check не работает через Nginx"
fi

echo ""
echo -e "${CYAN}━━━ Проверка сети ━━━${NC}"
echo ""

SERVER_IP=$(hostname -I | awk '{print $1}' || echo "unknown")
log_test "IP адрес сервера"
if [ "$SERVER_IP" != "unknown" ]; then
    log_ok
    echo "  └─ IP: $SERVER_IP"
else
    log_warn "Не удалось определить IP"
fi

log_test "Файрвол (UFW)"
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        log_ok
        if sudo ufw status | grep -q "80/tcp"; then
            echo "  └─ Порт 80 открыт"
        else
            log_warn "Порт 80 не открыт в файрволе"
        fi
    else
        log_warn "UFW не активен"
    fi
else
    log_warn "UFW не установлен"
fi

echo ""
echo -e "${CYAN}━━━ Проверка безопасности ━━━${NC}"
echo ""

log_test "Права на backend/.env"
if [ -f "backend/.env" ]; then
    PERMS=$(stat -c %a backend/.env 2>/dev/null || stat -f %A backend/.env)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
        log_ok
        echo "  └─ Права: $PERMS (безопасно)"
    else
        log_warn "Небезопасные права ($PERMS), рекомендуется 600"
    fi
else
    log_warn "Файл не найден"
fi

log_test "Тестовый пароль admin_security"
if [ -f "backend/.env" ]; then
    source backend/.env
    ADMIN_CHECK=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -sN -e "SELECT COUNT(*) FROM users WHERE username='admin_security' AND password_hash='\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';" 2>/dev/null || echo "0")
    
    if [ "$ADMIN_CHECK" = "1" ]; then
        log_warn "Используется тестовый пароль! Смените его!"
    else
        log_ok
        echo "  └─ Пароль изменен"
    fi
else
    log_warn "Пропущено"
fi

# Итоговый отчет
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      Итоговый отчет                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "  ${GREEN}✓ Успешно:${NC}     $SUCCESS"
echo -e "  ${YELLOW}⚠ Предупреждений:${NC} $WARNINGS"
echo -e "  ${RED}✗ Ошибок:${NC}      $ERRORS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Система полностью готова к работе!${NC}"
    echo ""
    echo "Откройте в браузере: http://$SERVER_IP"
    echo "Логин: admin_security / Пароль: test123"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Система готова, но есть предупреждения${NC}"
    echo ""
    echo "Проверьте предупреждения выше и исправьте их."
else
    echo -e "${RED}❌ Система не готова к работе${NC}"
    echo ""
    echo "Исправьте ошибки и запустите проверку снова."
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Дополнительные команды
echo "Полезные команды:"
echo ""
echo "  Статус backend:       sudo systemctl status utmn-security"
echo "  Логи backend:         sudo journalctl -u utmn-security -f"
echo "  Статус Nginx:         sudo systemctl status nginx"
echo "  Логи Nginx:           sudo tail -f /var/log/nginx/utmn-security-*.log"
echo "  Подключение к БД:     mysql -u utmn_user -p utmn_security"
echo ""
