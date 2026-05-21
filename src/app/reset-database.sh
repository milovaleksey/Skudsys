#!/bin/bash

#############################################
# Скрипт полной очистки и пересоздания БД
# с паролями по умолчанию
#############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "================================================"
echo "  Полная очистка и пересоздание БД"
echo "  Пароли по умолчанию для тестирования"
echo "================================================"
echo ""

# Пароли по умолчанию
DB_NAME="utmn_security"
DB_USER="utmn_admin"
DB_PASSWORD="utmn_admin123"

warning "Этот скрипт удалит ВСЕ данные из базы данных!"
warning "БД будет пересоздана с паролями по умолчанию"
echo ""
echo "Пароли по умолчанию:"
echo "  • MySQL пользователь: $DB_USER"
echo "  • MySQL пароль: $DB_PASSWORD"
echo "  • Админ логин: admin"
echo "  • Админ пароль: admin123"
echo ""

read -p "Продолжить? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Отменено"
    exit 0
fi

# Проверка MySQL
info "Проверка MySQL..."
if ! command -v mysql &> /dev/null; then
    error "MySQL не установлен!"
fi

# Получение root пароля
echo ""
info "Введите пароль root для MySQL (или Enter если пароля нет):"
read -s MYSQL_ROOT_PASSWORD
echo ""

# Тест подключения
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASSWORD"
fi

if ! $MYSQL_CMD -e "SELECT 1;" &> /dev/null; then
    error "Не удалось подключиться к MySQL. Проверьте пароль root."
fi

success "Подключение к MySQL успешно"

# Удаление старой БД и пользователя
info "Удаление старой базы данных и пользователя..."
$MYSQL_CMD << EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS '$DB_USER'@'localhost';
DROP USER IF EXISTS '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF

success "Старая БД удалена"

# Создание новой БД и пользователя
info "Создание новой базы данных..."
$MYSQL_CMD << EOF
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

success "База данных создана: $DB_NAME"
success "Пользователь создан: $DB_USER / $DB_PASSWORD"

# Проверка подключения с новым пользователем
info "Проверка подключения с новым пользователем..."
if mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" &> /dev/null; then
    success "Подключение с новым пользователем работает"
else
    error "Не удалось подключиться с новым пользователем"
fi

# Импорт схемы
if [ -f "database/schema.sql" ]; then
    info "Импорт схемы базы данных..."
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < database/schema.sql
    success "Схема импортирована"
else
    warning "Файл database/schema.sql не найден"
fi

# Создание администратора
info "Создание администратора по умолчанию..."

# Генерация хеша пароля для admin123
# bcrypt hash для пароля 'admin123' с 10 раундами
ADMIN_HASH='$2b$10$rZJ0JYGqNRzGQnKdWxLVOuJZ3VrKoR5qk1YFqnKvVFT5L0v5IWCMm'

mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME << EOF
-- Создание администратора
INSERT INTO users (username, password, full_name, email, role, auth_type, is_active)
VALUES ('admin', '$ADMIN_HASH', 'Администратор системы', 'admin@utmn.ru', 'admin', 'local', 1);

-- Создание тестовых ролей
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Полный доступ ко всем функциям системы', '{"all": true}'),
('security', 'Служба безопасности', '{"students": true, "employees": true, "parking": true, "storage": true, "access_logs": true}'),
('manager', 'Менеджер', '{"students": true, "employees": true, "reports": true}'),
('operator', 'Оператор', '{"students": true, "employees": true, "parking": true}'),
('viewer', 'Просмотр данных', '{"students": true, "employees": true}');
EOF

success "Администратор создан (admin / admin123)"

# Обновление backend .env
info "Обновление backend/.env..."
if [ -f "backend/.env" ]; then
    # Создаем бэкап
    cp backend/.env backend/.env.backup_$(date +%Y%m%d_%H%M%S)
fi

cat > backend/.env << EOF
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_CONNECTION_LIMIT=10

# JWT Configuration (автогенерированные)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration (разрешаем доступ с любого адреса для тестирования)
CORS_ORIGIN=*
ALLOWED_HOSTS=*
EOF

success "Файл backend/.env обновлен"

# Статистика БД
info "Проверка созданных таблиц..."
TABLES=$(mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" | tail -n +2 | wc -l)
success "Создано таблиц: $TABLES"

echo ""
echo "================================================"
success "База данных успешно пересоздана!"
echo "================================================"
echo ""
echo "📊 Информация о базе данных:"
echo "   • База данных: $DB_NAME"
echo "   • Пользователь: $DB_USER"
echo "   • Пароль: $DB_PASSWORD"
echo ""
echo "👤 Администратор по умолчанию:"
echo "   • Логин: admin"
echo "   • Пароль: admin123"
echo ""
echo "🔍 Просмотр таблиц:"
echo "   mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e 'SHOW TABLES;'"
echo ""
echo "⚠️  ВАЖНО для production:"
echo "   1. Измените пароль администратора после входа"
echo "   2. Измените пароль БД в backend/.env"
echo "   3. Настройте CORS в backend/.env для конкретных доменов"
echo ""
echo "================================================"
echo ""
