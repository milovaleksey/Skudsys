#!/bin/bash

# 🚀 Скрипт сборки и развертывания (новая структура с /frontend)

set -e

echo "════════════════════════════════════════"
echo "  Сборка UTMN Security System"
echo "════════════════════════════════════════"
echo ""

# Проверка структуры проекта
if [ ! -d "frontend" ]; then
  echo "❌ Ошибка: директория /frontend не найдена!"
  echo "📝 Запустите сначала: ./migrate-to-frontend.sh"
  exit 1
fi

# Frontend
echo "📦 Шаг 1: Сборка Frontend..."
cd frontend

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
  echo "📦 Зависимости не установлены. Установка..."
  npm install
fi

# Сборка
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Ошибка: директория frontend/dist не создана!"
  exit 1
fi

echo "✅ Frontend собран успешно"
echo ""

cd ..

# Подсчет файлов
FILE_COUNT=$(find frontend/dist -type f | wc -l)
echo "📁 Создано файлов: $FILE_COUNT"
echo ""

# Показать размер сборки
DIST_SIZE=$(du -sh frontend/dist | cut -f1)
echo "📊 Размер сборки: $DIST_SIZE"
echo ""

# Инструкции для развертывания
echo "════════════════════════════════════════"
echo "  ✅ Сборка завершена!"
echo "════════════════════════════════════════"
echo ""

echo "📁 Собранные файлы: frontend/dist/"
echo ""

echo "📝 Следующие шаги для развертывания:"
echo ""
echo "1. Скопируйте frontend на сервер:"
echo "   scp -r frontend/dist/* user@server:/var/www/utmn-security/frontend/"
echo ""
echo "2. Скопируйте backend (если изменился):"
echo "   scp -r backend/src/* user@server:/var/www/utmn-security/backend/src/"
echo "   scp backend/package.json user@server:/var/www/utmn-security/backend/"
echo ""
echo "3. На сервере установите зависимости backend (если нужно):"
echo "   ssh user@server"
echo "   cd /var/www/utmn-security/backend"
echo "   npm install"
echo ""
echo "4. Перезапустите сервис:"
echo "   sudo systemctl restart utmn-security"
echo ""
echo "5. Проверьте статус:"
echo "   sudo systemctl status utmn-security"
echo ""
echo "6. Проверьте логи:"
echo "   sudo journalctl -u utmn-security -f --no-pager"
echo ""
