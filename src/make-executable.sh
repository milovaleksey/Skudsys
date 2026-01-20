#!/bin/bash

# Делаем все скрипты исполняемыми

echo "Установка прав на выполнение для всех скриптов..."

chmod +x deploy.sh
chmod +x create-release.sh
chmod +x move-to-old.sh
chmod +x make-executable.sh
chmod +x start.sh 2>/dev/null || true

echo "✓ Готово!"
echo ""
echo "Теперь можно запускать:"
echo "  ./deploy.sh          - автоустановка на Debian"
echo "  ./create-release.sh  - создание ZIP архива"
echo "  ./move-to-old.sh     - перемещение HTTPS файлов в OLD"
echo "  ./start.sh           - запуск для разработки"
