#!/bin/bash

# Сделать все скрипты исполняемыми

echo "🔧 Установка прав на выполнение для всех скриптов..."
echo ""

# Список скриптов
chmod +x copy-all-now.sh
chmod +x deploy-from-sync.sh
chmod +x quick-deploy.sh
chmod +x rollback.sh
chmod +x status.sh
chmod +x migrate-to-frontend.sh
chmod +x QUICK_MIGRATE.sh
chmod +x BUILD_AND_DEPLOY_NEW.sh

echo "✅ Права установлены для:"
echo "   - copy-all-now.sh"
echo "   - deploy-from-sync.sh"
echo "   - quick-deploy.sh"
echo "   - rollback.sh"
echo "   - status.sh"
echo "   - migrate-to-frontend.sh"
echo "   - QUICK_MIGRATE.sh"
echo "   - BUILD_AND_DEPLOY_NEW.sh"
echo ""
echo "Готово! 🎉"
