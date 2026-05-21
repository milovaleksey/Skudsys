#!/bin/bash

# Копирование всех файлов в /frontend (быстрая версия)

echo "📦 Копирование файлов..."

# Components
if [ -d "components" ]; then
  echo "  ✓ components/"
  cp -r components frontend/
fi

# Lib  
if [ -d "lib" ]; then
  echo "  ✓ lib/"
  cp -r lib frontend/
fi

# Styles
if [ -d "styles" ]; then
  echo "  ✓ styles/"
  cp -r styles frontend/
fi

# Public
if [ -d "public" ]; then
  echo "  ✓ public/"
  cp -r public frontend/
else
  mkdir -p frontend/public
  echo "  ✓ public/ (создана)"
fi

echo ""
echo "✅ Готово! Теперь запустите:"
echo "   cd frontend && npm run build"
