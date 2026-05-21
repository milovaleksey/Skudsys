#!/bin/bash

#############################################
# Проверка статуса системы UTMN Security
#############################################

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║     UTMN Security - Проверка статуса          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Получаем IP адрес
SERVER_IP=$(hostname -I | awk '{print $1}')

# ============================================
# Статус сервисов
# ============================================
echo -e "${CYAN}📊 Статус сервисов:${NC}"
echo ""

check_service() {
    SERVICE=$1
    if systemctl is-active --quiet $SERVICE; then
        echo -e "   ${GREEN}✓${NC} $SERVICE: ${GREEN}работает${NC}"
        return 0
    else
        echo -e "   ${RED}✗${NC} $SERVICE: ${RED}не работает${NC}"
        return 1
    fi
}

check_service mysql
check_service utmn-backend
check_service utmn-frontend
check_service nginx

echo ""

# ============================================
# Проверка портов
# ============================================
echo -e "${CYAN}🔌 Открытые порты:${NC}"
echo ""

check_port() {
    PORT=$1
    NAME=$2
    if sudo netstat -tulpn | grep -q ":$PORT "; then
        echo -e "   ${GREEN}✓${NC} Порт $PORT ($NAME): ${GREEN}открыт${NC}"
    else
        echo -e "   ${RED}✗${NC} Порт $PORT ($NAME): ${RED}закрыт${NC}"
    fi
}

check_port 80 "Nginx HTTP"
check_port 3000 "Backend API"
check_port 5173 "Vite Dev Server"
check_port 3306 "MySQL"

echo ""

# ============================================
# Проверка API
# ============================================
echo -e "${CYAN}🌐 Проверка API:${NC}"
echo ""

# Health check
if curl -s http://localhost:3000/health | grep -q "success"; then
    echo -e "   ${GREEN}✓${NC} Backend Health: ${GREEN}OK${NC}"
else
    echo -e "   ${RED}✗${NC} Backend Health: ${RED}не отвечает${NC}"
fi

# Проверка через Nginx
if curl -s http://localhost/health | grep -q "success"; then
    echo -e "   ${GREEN}✓${NC} Nginx Proxy: ${GREEN}OK${NC}"
else
    echo -e "   ${RED}✗${NC} Nginx Proxy: ${RED}не отвечает${NC}"
fi

echo ""

# ============================================
# Проверка БД
# ============================================
echo -e "${CYAN}🗄️  Проверка базы данных:${NC}"
echo ""

if mysql -u utmn_admin -putmn_admin123 utmn_security -e "SELECT 1;" &> /dev/null; then
    echo -e "   ${GREEN}✓${NC} Подключение к БД: ${GREEN}OK${NC}"
    
    # Статистика таблиц
    echo ""
    echo -e "   ${BLUE}Статистика данных:${NC}"
    mysql -u utmn_admin -putmn_admin123 utmn_security -e "
        SELECT 'Пользователи' as 'Таблица', COUNT(*) as 'Записей' FROM users
        UNION ALL SELECT 'Роли', COUNT(*) FROM roles
        UNION ALL SELECT 'Студенты', COUNT(*) FROM students
        UNION ALL SELECT 'Сотрудники', COUNT(*) FROM employees
        UNION ALL SELECT 'Парковка', COUNT(*) FROM parking_records
        UNION ALL SELECT 'Хранилище', COUNT(*) FROM storage_items;
    " | while IFS=$'\t' read -r table count; do
        if [ "$table" != "Таблица" ]; then
            printf "   • %-20s: %s\n" "$table" "$count"
        fi
    done
else
    echo -e "   ${RED}✗${NC} Подключение к БД: ${RED}ошибка${NC}"
fi

echo ""

# ============================================
# Системная информация
# ============================================
echo -e "${CYAN}💻 Системная информация:${NC}"
echo ""

# Использование диска
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
echo -e "   • Использование диска: $DISK_USAGE"

# Использование памяти
MEM_USAGE=$(free -h | awk 'NR==2 {printf "%.1f%%", $3/$2*100}')
echo -e "   • Использование памяти: $MEM_USAGE"

# Uptime
UPTIME=$(uptime -p)
echo -e "   • Uptime: $UPTIME"

echo ""

# ============================================
# Доступ к системе
# ============================================
echo -e "${CYAN}🌍 Доступ к системе:${NC}"
echo ""
echo -e "   ${GREEN}Локальный доступ:${NC}"
echo "      http://localhost"
echo ""
echo -e "   ${GREEN}Внешний доступ:${NC}"
echo "      http://$SERVER_IP"
echo ""
echo -e "   ${GREEN}API endpoints:${NC}"
echo "      http://$SERVER_IP/v1"
echo "      http://$SERVER_IP/health"
echo ""

# ============================================
# Последние логи
# ============================================
echo -e "${CYAN}📋 Последние логи Backend (5 строк):${NC}"
echo ""
journalctl -u utmn-backend -n 5 --no-pager | sed 's/^/   /'
echo ""

# ============================================
# Полезные команды
# ============================================
echo "╔════════════════════════════════════════════════╗"
echo -e "║ ${YELLOW}Полезные команды:${NC}                              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "  Перезапуск сервисов:"
echo "    sudo systemctl restart utmn-backend utmn-frontend nginx"
echo ""
echo "  Просмотр логов:"
echo "    journalctl -u utmn-backend -f"
echo "    journalctl -u utmn-frontend -f"
echo ""
echo "  Подключение к БД:"
echo "    mysql -u utmn_admin -putmn_admin123 utmn_security"
echo ""
echo "  Тест API:"
echo "    curl http://localhost/health"
echo ""
echo "════════════════════════════════════════════════"
echo ""
