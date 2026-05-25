#!/bin/bash

# Скрипт для исправления WebSocket путей на сервере
# Запуск: bash fix-websocket-paths.sh

echo "🔧 Исправление WebSocket путей..."

# Backup
echo "📦 Создание бэкапов..."
cp backend/src/websocket/parking.ws.js backend/src/websocket/parking.ws.js.backup
cp backend/src/websocket/foreign-students.ws.js backend/src/websocket/foreign-students.ws.js.backup

# Исправление parking.ws.js
echo "✏️  Исправление parking.ws.js..."
sed -i "s|'/parking-ws'|'/ws/parking'|g" backend/src/websocket/parking.ws.js
sed -i "s|для /parking-ws|для /ws/parking|g" backend/src/websocket/parking.ws.js

# Исправление foreign-students.ws.js
echo "✏️  Исправление foreign-students.ws.js..."
sed -i "s|path: '/ws'|path: '/ws/foreign-students'|g" backend/src/websocket/foreign-students.ws.js
sed -i "s|для /ws|для /ws/foreign-students|g" backend/src/websocket/foreign-students.ws.js

echo "✅ Backend файлы исправлены!"

# Проверка изменений
echo ""
echo "📝 Проверка изменений в parking.ws.js:"
grep "path:" backend/src/websocket/parking.ws.js | head -1

echo ""
echo "📝 Проверка изменений в foreign-students.ws.js:"
grep "path:" backend/src/websocket/foreign-students.ws.js | head -1

echo ""
echo "✅ Готово! Теперь нужно:"
echo "   1. Скопировать исправленные frontend файлы"
echo "   2. Пересобрать frontend: cd frontend && VITE_CJS_IGNORE_WARNING=true npx vite build"
echo "   3. Перезапустить backend: pm2 restart all"
echo ""
echo "Список исправленных frontend файлов:"
echo "   - hooks/useParkingMQTT.ts"
echo "   - hooks/useStorageMQTT.ts"
echo "   - hooks/useForeignStudentsMQTT.ts"
echo "   - components/EngineeringPage.tsx"
echo "   - contexts/AuthContext.tsx"
echo "   - App.tsx"
