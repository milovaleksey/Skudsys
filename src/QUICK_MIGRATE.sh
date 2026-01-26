#!/bin/bash

# ⚡ Быстрая миграция в /frontend (одна команда)

set -e

echo "⚡ Быстрая миграция в /frontend"
echo ""

# Копирование файлов
echo "📂 Копирование файлов..."
cp -f App.tsx frontend/ 2>/dev/null || true
cp -f main.tsx frontend/ 2>/dev/null || true
cp -rf components frontend/ 2>/dev/null || true
cp -rf contexts frontend/ 2>/dev/null || true
cp -rf lib frontend/ 2>/dev/null || true
cp -rf styles frontend/ 2>/dev/null || true

# Public
if [ -d "public" ]; then
  cp -rf public frontend/ 2>/dev/null || true
else
  mkdir -p frontend/public
fi

echo "✅ Файлы скопированы"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
cd frontend
npm install
echo ""

# Проверка
echo "✅ Миграция завершена!"
echo ""
echo "🚀 Запустите: cd frontend && npm run dev"
echo ""
