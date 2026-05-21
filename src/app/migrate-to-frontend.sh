#!/bin/bash

# 🔄 Скрипт автоматической миграции frontend файлов

set -e

echo "════════════════════════════════════════"
echo "  Миграция Frontend в /frontend"
echo "════════════════════════════════════════"
echo ""

# Проверка что запущено из корня проекта
if [ ! -f "package.json" ]; then
  echo "❌ Ошибка: запустите скрипт из корня проекта!"
  exit 1
fi

# Создание директории frontend если не существует
echo "📁 Создание структуры /frontend..."
mkdir -p frontend

# Копирование главных файлов
echo "📄 Копирование главных файлов..."
[ -f "App.tsx" ] && cp App.tsx frontend/
[ -f "main.tsx" ] && cp main.tsx frontend/

# Копирование директорий
echo "📂 Копирование директорий..."
if [ -d "components" ]; then
  echo "   - components/"
  cp -r components frontend/
fi

if [ -d "contexts" ]; then
  echo "   - contexts/"
  cp -r contexts frontend/
fi

if [ -d "lib" ]; then
  echo "   - lib/"
  cp -r lib frontend/
fi

if [ -d "styles" ]; then
  echo "   - styles/"
  cp -r styles frontend/
fi

if [ -d "public" ]; then
  echo "   - public/"
  cp -r public frontend/
else
  # Создать public и скопировать logo
  mkdir -p frontend/public
  [ -f "public/logo.svg" ] && cp public/logo.svg frontend/public/ 2>/dev/null || true
fi

echo ""
echo "✅ Файлы скопированы успешно!"
echo ""

# Подсчет файлов
COMPONENT_COUNT=$(find frontend/components -name "*.tsx" 2>/dev/null | wc -l)
CONTEXT_COUNT=$(find frontend/contexts -name "*.tsx" 2>/dev/null | wc -l)
LIB_COUNT=$(find frontend/lib -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)

echo "📊 Статистика:"
echo "   - Компоненты: $COMPONENT_COUNT файлов"
echo "   - Контексты: $CONTEXT_COUNT файлов"
echo "   - Библиотеки: $LIB_COUNT файлов"
echo ""

# Установка зависимостей
echo "════════════════════════════════════════"
read -p "📦 Установить зависимости для frontend? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Установка зависимостей..."
  cd frontend
  npm install
  cd ..
  echo "✅ Зависимости установлены!"
else
  echo "⏭️  Пропущено. Установите позже командой:"
  echo "   cd frontend && npm install"
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Миграция завершена!"
echo "════════════════════════════════════════"
echo ""

echo "📝 Следующие шаги:"
echo ""
echo "1. Перейдите в frontend:"
echo "   cd frontend"
echo ""
echo "2. Запустите dev сервер:"
echo "   npm run dev"
echo ""
echo "3. Или соберите production:"
echo "   npm run build"
echo ""
echo "4. После успешной проверки можете удалить старые файлы из корня"
echo ""
echo "📖 Подробности в RESTRUCTURE.md"
echo ""
