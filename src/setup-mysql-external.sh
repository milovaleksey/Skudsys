#!/bin/bash

#############################################
# Скрипт настройки MySQL для внешнего доступа
# Система безопасности инфраструктуры ТюмГУ
#############################################

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Настройка MySQL для внешнего доступа                 ║"
echo "║  Система безопасности инфраструктуры ТюмГУ            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Ошибка: Скрипт должен запускаться с правами root${NC}"
    echo "Используйте: sudo $0"
    exit 1
fi

# Функция для запроса подтверждения
confirm() {
    read -p "$1 (y/n): " choice
    case "$choice" in 
        y|Y|д|Д ) return 0;;
        * ) return 1;;
    esac
}

# Функция для генерации безопасного пароля
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

echo ""
echo -e "${YELLOW}ВНИМАНИЕ:${NC}"
echo "Этот скрипт настроит MySQL для приёма подключений извне."
echo "Это может быть потенциальным риском безопасности!"
echo ""

if ! confirm "Продолжить настройку?"; then
    echo "Отменено пользователем."
    exit 0
fi

# Проверка MySQL
echo ""
echo "Проверка MySQL..."
if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mariadb; then
    echo -e "${RED}Ошибка: MySQL не запущен${NC}"
    exit 1
fi

SERVICE_NAME="mysql"
if systemctl is-active --quiet mariadb; then
    SERVICE_NAME="mariadb"
fi

echo -e "${GREEN}✓ MySQL работает${NC}"

# Шаг 1: Настройка bind-address
echo ""
echo "Шаг 1: Настройка bind-address..."

MYSQL_CNF="/etc/mysql/mysql.conf.d/mysqld.cnf"
if [ ! -f "$MYSQL_CNF" ]; then
    MYSQL_CNF="/etc/mysql/my.cnf"
fi
if [ ! -f "$MYSQL_CNF" ]; then
    MYSQL_CNF="/etc/my.cnf"
fi

if [ ! -f "$MYSQL_CNF" ]; then
    echo -e "${RED}Ошибка: Не найден конфигурационный файл MySQL${NC}"
    exit 1
fi

echo "Файл конфигурации: $MYSQL_CNF"

# Резервная копия конфига
cp "$MYSQL_CNF" "${MYSQL_CNF}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✓ Создана резервная копия конфигурации${NC}"

# Изменение bind-address
if grep -q "^bind-address" "$MYSQL_CNF"; then
    sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' "$MYSQL_CNF"
    echo -e "${GREEN}✓ bind-address изменен на 0.0.0.0${NC}"
else
    # Добавить в секцию [mysqld]
    sed -i '/\[mysqld\]/a bind-address = 0.0.0.0' "$MYSQL_CNF"
    echo -e "${GREEN}✓ bind-address добавлен: 0.0.0.0${NC}"
fi

# Перезапуск MySQL
echo "Перезапуск MySQL..."
systemctl restart $SERVICE_NAME
sleep 2

if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✓ MySQL перезапущен успешно${NC}"
else
    echo -e "${RED}Ошибка: MySQL не запустился после изменения конфигурации${NC}"
    echo "Восстанавливаем резервную копию..."
    cp "${MYSQL_CNF}.backup."* "$MYSQL_CNF"
    systemctl restart $SERVICE_NAME
    exit 1
fi

# Шаг 2: Создание пользователя для удаленного доступа
echo ""
echo "Шаг 2: Создание пользователя для удаленного доступа..."

# Выбор имени пользователя
echo ""
read -p "Введите имя пользователя для удаленного доступа [utmn_remote]: " REMOTE_USER
REMOTE_USER=${REMOTE_USER:-utmn_remote}

# Выбор способа доступа
echo ""
echo "Выберите ограничение доступа:"
echo "1) С любого IP-адреса (%)"
echo "2) С конкретного IP-адреса"
echo "3) С подсети (например, 192.168.1.%)"
read -p "Выбор [1]: " ACCESS_CHOICE
ACCESS_CHOICE=${ACCESS_CHOICE:-1}

case $ACCESS_CHOICE in
    1)
        REMOTE_HOST="%"
        echo "Доступ будет разрешен с любого IP"
        ;;
    2)
        read -p "Введите IP-адрес: " REMOTE_HOST
        echo "Доступ будет разрешен только с $REMOTE_HOST"
        ;;
    3)
        read -p "Введите подсеть (например, 192.168.1.%): " REMOTE_HOST
        echo "Доступ будет разрешен с подсети $REMOTE_HOST"
        ;;
    *)
        echo "Неверный выбор, используется доступ с любого IP"
        REMOTE_HOST="%"
        ;;
esac

# Генерация или ввод пароля
echo ""
echo "Выберите способ создания пароля:"
echo "1) Сгенерировать автоматически"
echo "2) Ввести вручную"
read -p "Выбор [1]: " PASSWORD_CHOICE
PASSWORD_CHOICE=${PASSWORD_CHOICE:-1}

if [ "$PASSWORD_CHOICE" -eq 1 ]; then
    REMOTE_PASSWORD=$(generate_password)
    echo -e "${GREEN}Сгенерирован пароль: $REMOTE_PASSWORD${NC}"
else
    read -sp "Введите пароль: " REMOTE_PASSWORD
    echo ""
    read -sp "Повторите пароль: " REMOTE_PASSWORD_CONFIRM
    echo ""
    
    if [ "$REMOTE_PASSWORD" != "$REMOTE_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Ошибка: Пароли не совпадают${NC}"
        exit 1
    fi
fi

# Запрос пароля root для MySQL
echo ""
read -sp "Введите пароль root для MySQL: " MYSQL_ROOT_PASSWORD
echo ""

# Создание пользователя и назначение прав
echo "Создание пользователя в MySQL..."

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
-- Создание пользователя
CREATE USER IF NOT EXISTS '${REMOTE_USER}'@'${REMOTE_HOST}' IDENTIFIED BY '${REMOTE_PASSWORD}';

-- Предоставление прав на базу utmn_security
GRANT ALL PRIVILEGES ON utmn_security.* TO '${REMOTE_USER}'@'${REMOTE_HOST}';

-- Применение изменений
FLUSH PRIVILEGES;

-- Проверка
SELECT User, Host FROM mysql.user WHERE User = '${REMOTE_USER}';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Пользователь создан успешно${NC}"
else
    echo -e "${RED}Ошибка создания пользователя${NC}"
    exit 1
fi

# Шаг 3: Настройка firewall
echo ""
echo "Шаг 3: Настройка firewall..."

if command -v ufw &> /dev/null; then
    echo "Обнаружен ufw"
    
    if [ "$REMOTE_HOST" = "%" ]; then
        ufw allow 3306/tcp
        echo -e "${GREEN}✓ Порт 3306 открыт для всех${NC}"
    else
        # Извлечь IP без % для правила firewall
        CLEAN_IP=$(echo $REMOTE_HOST | sed 's/%/0\/24/')
        ufw allow from $CLEAN_IP to any port 3306
        echo -e "${GREEN}✓ Порт 3306 открыт для $CLEAN_IP${NC}"
    fi
    
    ufw reload
    
elif command -v firewall-cmd &> /dev/null; then
    echo "Обнаружен firewalld"
    
    if [ "$REMOTE_HOST" = "%" ]; then
        firewall-cmd --permanent --add-port=3306/tcp
        echo -e "${GREEN}✓ Порт 3306 открыт для всех${NC}"
    else
        # Для конкретного IP нужно создать rich rule
        CLEAN_IP=$(echo $REMOTE_HOST | sed 's/%/0\/24/')
        firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='$CLEAN_IP' port protocol='tcp' port='3306' accept"
        echo -e "${GREEN}✓ Порт 3306 открыт для $CLEAN_IP${NC}"
    fi
    
    firewall-cmd --reload
    
else
    echo -e "${YELLOW}! Firewall не обнаружен, пропускаем настройку${NC}"
    echo "  Убедитесь, что порт 3306 открыт вручную!"
fi

# Шаг 4: Проверка доступности
echo ""
echo "Шаг 4: Проверка конфигурации..."

# Проверка порта
if netstat -tlnp 2>/dev/null | grep -q ":3306"; then
    echo -e "${GREEN}✓ MySQL слушает на порту 3306${NC}"
    netstat -tlnp | grep :3306
else
    echo -e "${YELLOW}! Проверьте вручную: netstat -tlnp | grep 3306${NC}"
fi

# Сохранение данных подключения
echo ""
echo "Сохранение данных подключения..."

CONNECTION_FILE="/root/mysql-external-access.txt"
cat > "$CONNECTION_FILE" <<EOF
╔════════════════════════════════════════════════════════╗
║        Данные для подключения к MySQL                 ║
╚════════════════════════════════════════════════════════╝

Дата создания: $(date)

Хост: $(hostname -I | awk '{print $1}')
Порт: 3306
База данных: utmn_security
Пользователь: ${REMOTE_USER}
Пароль: ${REMOTE_PASSWORD}
Разрешенный хост: ${REMOTE_HOST}

╔════════════════════════════════════════════════════════╗
║        Команда для подключения                        ║
╚════════════════════════════════════════════════════════╝

mysql -h $(hostname -I | awk '{print $1}') -u ${REMOTE_USER} -p -D utmn_security

Пароль: ${REMOTE_PASSWORD}

╔════════════════════════════════════════════════════════╗
║        Строка подключения                             ║
╚════════════════════════════════════════════════════════╝

mysql://${REMOTE_USER}:${REMOTE_PASSWORD}@$(hostname -I | awk '{print $1}'):3306/utmn_security

╔════════════════════════════════════════════════════════╗
║        БЕЗОПАСНОСТЬ                                   ║
╚════════════════════════════════════════════════════════╝

⚠️  ВАЖНО: Храните этот файл в безопасном месте!
⚠️  Не передавайте пароль по незащищенным каналам!
⚠️  Регулярно проверяйте логи MySQL на подозрительную активность!

Лог файлы:
- /var/log/mysql/error.log
- journalctl -u mysql -f

Проверка активных подключений:
mysql -u root -p -e "SHOW PROCESSLIST;"

EOF

chmod 600 "$CONNECTION_FILE"
echo -e "${GREEN}✓ Данные сохранены в: $CONNECTION_FILE${NC}"

# Финальная информация
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║              НАСТРОЙКА ЗАВЕРШЕНА                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${YELLOW}Данные для подключения:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Хост:     $(hostname -I | awk '{print $1}')"
echo "Порт:     3306"
echo "База:     utmn_security"
echo "Юзер:     ${REMOTE_USER}"
echo "Пароль:   ${REMOTE_PASSWORD}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Команда для подключения:${NC}"
echo "mysql -h $(hostname -I | awk '{print $1}') -u ${REMOTE_USER} -p"
echo ""
echo -e "${YELLOW}Полные данные сохранены в:${NC}"
echo "$CONNECTION_FILE"
echo ""
echo -e "${GREEN}Для проверки подключения с удаленной машины:${NC}"
echo "telnet $(hostname -I | awk '{print $1}') 3306"
echo ""
echo -e "${YELLOW}ВАЖНО:${NC}"
echo "- Сохраните пароль в безопасном месте"
echo "- Регулярно проверяйте логи MySQL"
echo "- Рассмотрите настройку SSL для MySQL"
echo ""

exit 0
