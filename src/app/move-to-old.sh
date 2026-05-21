#!/bin/bash

################################################################################
# Перемещение старой HTTPS документации в папку OLD
################################################################################

echo "Перемещение старых HTTPS файлов в папку OLD..."

# Создать папку OLD
mkdir -p OLD

# Переместить SSL/HTTPS документацию
echo "Перемещение документации..."
mv SSL_GUIDE.md OLD/ 2>/dev/null || true
mv SSL_README.md OLD/ 2>/dev/null || true
mv NGINX_GUIDE.md OLD/ 2>/dev/null || true
mv FIX_SSL_ERROR.md OLD/ 2>/dev/null || true
mv SSL_NGINX_README.md OLD/ 2>/dev/null || true

# Переместить HTTPS скрипты
echo "Перемещение скриптов..."
mkdir -p OLD/scripts
mv scripts/generate-ssl-cert.sh OLD/scripts/ 2>/dev/null || true
mv scripts/generate-ssl-cert.bat OLD/scripts/ 2>/dev/null || true
mv scripts/setup-nginx.sh OLD/scripts/ 2>/dev/null || true

# Переместить старые Nginx конфигурации
echo "Перемещение конфигураций Nginx..."
mkdir -p OLD/nginx
mv nginx/utmn-security.conf OLD/nginx/ 2>/dev/null || true
mv nginx/utmn-security-dev.conf OLD/nginx/ 2>/dev/null || true

# Переместить HTTPS скрипты запуска
echo "Перемещение скриптов запуска..."
mv start-https.sh OLD/ 2>/dev/null || true
mv start-https.bat OLD/ 2>/dev/null || true

# Переместить HTTPS конфигурации
echo "Перемещение конфигураций..."
mv vite.config.https.ts OLD/ 2>/dev/null || true

# Переместить HTTPS server
echo "Перемещение backend HTTPS сервера..."
mkdir -p OLD/backend
mv backend/src/server-https.js OLD/backend/ 2>/dev/null || true

# Создать README в OLD
cat > OLD/README.md << 'EOF'
# OLD - Архив HTTPS/SSL документации

Эта папка содержит старую документацию и скрипты для работы с HTTPS/SSL сертификатами.

## Содержимое:

### Документация:
- `SSL_GUIDE.md` - Руководство по SSL сертификатам
- `SSL_README.md` - Обзор SSL настройки
- `NGINX_GUIDE.md` - Полное руководство по Nginx
- `FIX_SSL_ERROR.md` - Исправление SSL ошибок
- `SSL_NGINX_README.md` - Общий обзор SSL и Nginx

### Скрипты:
- `scripts/generate-ssl-cert.sh` - Генерация самоподписанных сертификатов (Linux/Mac)
- `scripts/generate-ssl-cert.bat` - Генерация сертификатов (Windows)
- `scripts/setup-nginx.sh` - Установка Nginx с SSL

### Конфигурации:
- `nginx/utmn-security.conf` - Nginx конфигурация с HTTPS
- `nginx/utmn-security-dev.conf` - Nginx для разработки
- `vite.config.https.ts` - Vite конфигурация с HTTPS

### Backend:
- `backend/server-https.js` - HTTPS сервер для Node.js

### Скрипты запуска:
- `start-https.sh` - Запуск с HTTPS (Linux/Mac)
- `start-https.bat` - Запуск с HTTPS (Windows)

---

## Когда использовать?

Эти файлы нужны для:
- Разработки с самоподписанными сертификатами
- Тестирования HTTPS локально
- Отладки SSL проблем

## Для production:

Используйте новые файлы:
- `deploy.sh` - автоматическая установка
- `nginx/production.conf` - Nginx для HTTP
- `DEPLOYMENT_GUIDE.md` - руководство по развертыванию

После успешного запуска на HTTP, можно настроить HTTPS с Let's Encrypt.

---

**Дата архивации:** 20.01.2026
EOF

echo ""
echo "✓ Файлы перемещены в папку OLD/"
echo ""
echo "Перемещено:"
echo "  - SSL/HTTPS документация"
echo "  - Скрипты генерации сертификатов"
echo "  - Старые Nginx конфигурации"
echo "  - HTTPS скрипты запуска"
echo ""
echo "Текущая структура для production:"
echo "  - deploy.sh - главный скрипт установки"
echo "  - nginx/production.conf - Nginx для HTTP"
echo "  - systemd/utmn-security.service - systemd сервис"
echo "  - PRODUCTION_README.md - документация"
echo ""
