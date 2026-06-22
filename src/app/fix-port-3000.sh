#!/bin/bash

# Скрипт для удаления хардкода порта 3000 из WebSocket подключений
# Запуск: bash fix-port-3000.sh

echo "🔧 Удаление хардкода порта 3000..."

cd /opt/utmn-security/src/app/frontend/hooks

# Backup
echo "📦 Создание бэкапов..."
cp useAnalyticsMQTT.ts useAnalyticsMQTT.ts.backup
cp useMQTT.ts useMQTT.ts.backup
cp useStorageWebSocket.ts useStorageWebSocket.ts.backup

# Удаление :3000 из URL
echo "✏️  Исправление useAnalyticsMQTT.ts..."
sed -i 's|:3000/ws/mqtt|/ws/mqtt|g' useAnalyticsMQTT.ts
sed -i 's|window.location.hostname;|window.location.host;|g' useAnalyticsMQTT.ts

echo "✏️  Исправление useMQTT.ts..."
sed -i 's|:3000/ws/mqtt|/ws/mqtt|g' useMQTT.ts
sed -i 's|window.location.hostname;|window.location.host;|g' useMQTT.ts

echo "✏️  Исправление useStorageWebSocket.ts..."
sed -i 's|:3000/ws/storage|/ws/storage|g' useStorageWebSocket.ts
sed -i 's|window.location.hostname;|window.location.host;|g' useStorageWebSocket.ts

echo ""
echo "✅ Готово! Проверка изменений:"
echo ""
echo "useAnalyticsMQTT.ts:"
grep "window.location.host" useAnalyticsMQTT.ts | head -2
echo ""
echo "useMQTT.ts:"
grep "window.location.host" useMQTT.ts | head -2
echo ""
echo "useStorageWebSocket.ts:"
grep "window.location.host" useStorageWebSocket.ts | head -2
echo ""
echo "✅ Исправления применены!"
echo ""
echo "Теперь WebSocket будет использовать:"
echo "  - wss://report.utmn.ru/ws/mqtt"
echo "  - wss://report.utmn.ru/ws/storage"
echo ""
echo "Вместо:"
echo "  - wss://report.utmn.ru:3000/ws/mqtt"
echo "  - wss://report.utmn.ru:3000/ws/storage"
echo ""
echo "Следующие шаги:"
echo "  1. cd /opt/utmn-security/src/app/frontend"
echo "  2. VITE_CJS_IGNORE_WARNING=true npx vite build"
echo "  3. sudo rm -rf /var/www/utmn-security/*"
echo "  4. sudo cp -r dist/* /var/www/utmn-security/"
echo "  5. sudo chown -R www-data:www-data /var/www/utmn-security"
echo "  6. sudo systemctl reload nginx"
