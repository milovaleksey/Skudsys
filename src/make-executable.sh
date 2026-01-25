#!/bin/bash

# Делаем все скрипты исполняемыми

echo "Установка прав на выполнение для всех скриптов..."

chmod +x deploy.sh
chmod +x deploy-http.sh
chmod +x deploy-external.sh
chmod +x reset-database.sh
chmod +x check-status.sh
chmod +x create-release.sh
chmod +x move-to-old.sh
chmod +x make-executable.sh
chmod +x start.sh 2>/dev/null || true

echo "✓ Готово!"
echo ""
echo "Теперь можно запускать:"
echo "  ./deploy.sh             - автоустановка на Debian (HTTPS)"
echo "  ./deploy-http.sh        - автоустановка на Debian (HTTP за reverse proxy)"
echo "  ./deploy-external.sh    - автоустановка с внешним доступом (для тестирования)"
echo "  ./reset-database.sh     - полная очистка и пересоздание БД"
echo "  ./check-status.sh       - проверка статуса всех сервисов"
echo "  ./create-release.sh     - создание ZIP архива"
echo "  ./move-to-old.sh        - перемещение HTTPS файлов в OLD"
echo "  ./start.sh              - запуск для разработки"