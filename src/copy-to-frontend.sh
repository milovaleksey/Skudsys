#!/bin/bash

# Быстрое копирование всех файлов в /frontend

echo "📦 Копирование файлов в /frontend..."

# Копирование директорий
echo "  - components/"
cp -r components frontend/ 2>/dev/null || echo "    ⚠️  components/ не найдена"

echo "  - contexts/"
cp -r contexts frontend/ 2>/dev/null || echo "    ⚠️  contexts/ не найдена"

echo "  - lib/"
cp -r lib frontend/ 2>/dev/null || echo "    ⚠️  lib/ не найдена"

echo "  - styles/"
cp -r styles frontend/ 2>/dev/null || echo "    ⚠️  styles/ не найдена"

echo "  - public/"
if [ -d "public" ]; then
  cp -r public frontend/
else
  mkdir -p frontend/public
  echo "    ℹ️  Создана пустая директория public/"
fi

echo ""
echo "✅ Копирование завершено!"
echo ""
echo "🚀 Теперь запустите:"
echo "   cd frontend && npm run build"
