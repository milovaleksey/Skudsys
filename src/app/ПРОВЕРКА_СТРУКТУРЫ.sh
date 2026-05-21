#!/bin/bash

# ════════════════════════════════════════════════════════════════
#  Проверка структуры проекта на сервере
# ════════════════════════════════════════════════════════════════

echo "🔍 Проверка структуры проекта..."
echo ""

BASE="/var/www/utmn-security/debug"

echo "📂 Базовая директория: ${BASE}"
echo ""

echo "1️⃣  Проверка frontend/hooks/"
echo "─────────────────────────────────────────────────────────────"
if [ -d "${BASE}/frontend/hooks" ]; then
  echo "✅ Директория существует"
  ls -la "${BASE}/frontend/hooks/" 2>/dev/null || echo "⚠️  Пусто"
else
  echo "❌ Директория НЕ существует"
  echo "   Создать: mkdir -p ${BASE}/frontend/hooks"
fi

echo ""
echo "2️⃣  Проверка корневой hooks/ (Figma Make структура)"
echo "─────────────────────────────────────────────────────────────"
if [ -d "${BASE}/hooks" ]; then
  echo "✅ Директория существует"
  ls -la "${BASE}/hooks/" 2>/dev/null
else
  echo "❌ Директория НЕ существует"
fi

echo ""
echo "3️⃣  Где находятся компоненты?"
echo "─────────────────────────────────────────────────────────────"
if [ -d "${BASE}/frontend/components" ]; then
  echo "✅ ${BASE}/frontend/components/"
elif [ -d "${BASE}/components" ]; then
  echo "✅ ${BASE}/components/"
else
  echo "❌ Компоненты не найдены"
fi

echo ""
echo "4️⃣  Где находится lib/api.ts?"
echo "─────────────────────────────────────────────────────────────"
if [ -f "${BASE}/frontend/lib/api.ts" ]; then
  echo "✅ ${BASE}/frontend/lib/api.ts"
elif [ -f "${BASE}/lib/api.ts" ]; then
  echo "✅ ${BASE}/lib/api.ts"
else
  echo "❌ api.ts не найден"
fi

echo ""
echo "5️⃣  Проверка импортов в MainPage.tsx"
echo "─────────────────────────────────────────────────────────────"
if [ -f "${BASE}/frontend/components/MainPage.tsx" ]; then
  grep "import.*hooks" "${BASE}/frontend/components/MainPage.tsx" | head -5
elif [ -f "${BASE}/components/MainPage.tsx" ]; then
  grep "import.*hooks" "${BASE}/components/MainPage.tsx" | head -5
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "💡 Рекомендация:"
echo ""
echo "Если структура monorepo (frontend/ и backend/):"
echo "  • Hooks должны быть в: frontend/hooks/"
echo "  • Импорт: import { ... } from '../hooks/useMQTT';"
echo ""
echo "Если плоская структура (Figma Make):"
echo "  • Hooks в корне: /hooks/"
echo "  • Импорт: import { ... } from '../hooks/useMQTT';"
echo "════════════════════════════════════════════════════════════════"
