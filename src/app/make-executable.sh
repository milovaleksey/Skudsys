#!/bin/bash

# Делаем все скрипты исполняемыми

echo "Установка прав на выполнение для всех скриптов..."

chmod +x deploy.sh
chmod +x deploy-http.sh
chmod +x deploy-external.sh
chmod +x deploy-quick.sh
chmod +x reset-database.sh
chmod +x check-status.sh
chmod +x create-release.sh
chmod +x move-to-old.sh
chmod +x make-executable.sh
chmod +x start-dev.sh
chmod +x verify-deployment.sh
chmod +x start.sh 2>/dev/null || true
chmod +x setup-mysql-external.sh 2>/dev/null || true
chmod +x start-with-database.sh 2>/dev/null || true
chmod +x stop-servers.sh 2>/dev/null || true
chmod +x start-https.sh 2>/dev/null || true

# Скрипты в директории scripts/
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
fi

echo "✓ Готово!"
echo ""
echo "Основные скрипты:"
echo "  ./deploy-quick.sh        - Быстрое развертывание (рекомендуется)"
echo "  ./start-dev.sh           - Запуск в режиме разработки"
echo "  ./verify-deployment.sh   - Проверка развертывания"
echo ""
echo "Дополнительные:"
echo "  ./deploy.sh              - Полная автоустановка (HTTPS)"
echo "  ./deploy-http.sh         - Автоустановка (HTTP)"
echo "  ./reset-database.sh      - Пересоздание БД"
echo "  ./check-status.sh        - Проверка статуса сервисов"