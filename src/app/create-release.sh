#!/bin/bash

################################################################################
# Создание release архива для production развертывания
# Версия: 1.0
################################################################################

set -e

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Создание production release архива${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Версия
VERSION=${1:-$(date +%Y%m%d_%H%M%S)}
ARCHIVE_NAME="utmn-security-v${VERSION}.zip"
BUILD_DIR="build-temp"

echo -e "${GREEN}✓${NC} Версия: $VERSION"
echo -e "${GREEN}✓${NC} Архив: $ARCHIVE_NAME"
echo ""

# Очистка предыдущих сборок
if [ -d "$BUILD_DIR" ]; then
    echo "Очистка предыдущей сборки..."
    rm -rf "$BUILD_DIR"
fi

# Создание временной директории
echo "Создание временной директории..."
mkdir -p "$BUILD_DIR/utmn-security"

# Копирование файлов
echo "Копирование файлов..."

# Backend
echo "  - Backend..."
mkdir -p "$BUILD_DIR/utmn-security/backend"
cp -r backend/src "$BUILD_DIR/utmn-security/backend/"
cp -r backend/database "$BUILD_DIR/utmn-security/backend/" 2>/dev/null || true
cp backend/package.json "$BUILD_DIR/utmn-security/backend/"
cp backend/package-lock.json "$BUILD_DIR/utmn-security/backend/" 2>/dev/null || true
cp backend/.env.production "$BUILD_DIR/utmn-security/backend/"

# Frontend source
echo "  - Frontend source..."
cp -r src "$BUILD_DIR/utmn-security/"
cp -r public "$BUILD_DIR/utmn-security/"
cp package.json "$BUILD_DIR/utmn-security/"
cp package-lock.json "$BUILD_DIR/utmn-security/" 2>/dev/null || true
cp vite.config.ts "$BUILD_DIR/utmn-security/"
cp tsconfig.json "$BUILD_DIR/utmn-security/"
cp tsconfig.node.json "$BUILD_DIR/utmn-security/" 2>/dev/null || true
cp index.html "$BUILD_DIR/utmn-security/"

# Конфигурации
echo "  - Конфигурации..."
mkdir -p "$BUILD_DIR/utmn-security/nginx"
mkdir -p "$BUILD_DIR/utmn-security/systemd"
cp nginx/production.conf "$BUILD_DIR/utmn-security/nginx/"
cp systemd/utmn-security.service "$BUILD_DIR/utmn-security/systemd/"

# Скрипты
echo "  - Скрипты..."
cp deploy.sh "$BUILD_DIR/utmn-security/"
chmod +x "$BUILD_DIR/utmn-security/deploy.sh"

# Документация
echo "  - Документация..."
cp PRODUCTION_README.md "$BUILD_DIR/utmn-security/README.md"
cp DEPLOYMENT_GUIDE.md "$BUILD_DIR/utmn-security/"
cp QUICK_DEPLOY.md "$BUILD_DIR/utmn-security/"
cp COMMANDS_CHEATSHEET.md "$BUILD_DIR/utmn-security/" 2>/dev/null || true

# Создание .gitignore для архива
cat > "$BUILD_DIR/utmn-security/.gitignore" << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
*.swp
*.swo
EOF

# Создание README для архива
cat > "$BUILD_DIR/utmn-security/INSTALL.txt" << 'EOF'
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Система безопасности ТюмГУ - Production Release        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

БЫСТРАЯ УСТАНОВКА:
==================

1. Загрузить архив на сервер Debian/Ubuntu:
   scp utmn-security-vXXXXXX.zip root@your-server:/root/

2. Подключиться к серверу:
   ssh root@your-server

3. Распаковать и установить:
   unzip utmn-security-vXXXXXX.zip
   cd utmn-security
   chmod +x deploy.sh
   sudo ./deploy.sh

4. Открыть в браузере:
   http://your-server-ip

ДОКУМЕНТАЦИЯ:
=============
- README.md - Обзор и управление
- DEPLOYMENT_GUIDE.md - Полное руководство
- QUICK_DEPLOY.md - Быстрое развертывание

ТРЕБОВАНИЯ:
===========
- Debian 11/12 или Ubuntu 20.04/22.04
- 2 GB RAM (рекомендуется 4 GB)
- 10 GB свободного места
- Root доступ

КОМПОНЕНТЫ (устанавливаются автоматически):
==========================================
- Node.js 20.x
- MySQL 8.0
- Nginx
- systemd

ВРЕМЯ УСТАНОВКИ: 10-15 минут

Подробнее: см. README.md
EOF

# Создание архива
echo ""
echo "Создание ZIP архива..."
cd "$BUILD_DIR"
zip -r "../$ARCHIVE_NAME" utmn-security -q
cd ..

# Очистка
echo "Очистка временных файлов..."
rm -rf "$BUILD_DIR"

# Размер архива
SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Архив создан успешно!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Файл:   $ARCHIVE_NAME"
echo "  Размер: $SIZE"
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Загрузить на сервер:"
echo "   scp $ARCHIVE_NAME root@your-server:/root/"
echo ""
echo "2. На сервере:"
echo "   ssh root@your-server"
echo "   unzip $ARCHIVE_NAME"
echo "   cd utmn-security"
echo "   sudo ./deploy.sh"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
