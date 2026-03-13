#!/bin/bash

# ════════════════════════════════════════════════════════════════
#  БЫСТРОЕ ИСПРАВЛЕНИЕ - Копирование hooks
# ════════════════════════════════════════════════════════════════

echo "🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ: Копирование hooks"
echo ""

# Определяем где мы находимся
CURRENT_DIR=$(pwd)
echo "📍 Текущая директория: ${CURRENT_DIR}"
echo ""

# Проверяем структуру
if [ -d "frontend" ]; then
  echo "✅ Обнаружена monorepo структура (frontend/ и backend/)"
  echo ""
  
  # Создаём frontend/hooks если не существует
  mkdir -p frontend/hooks
  echo "📁 Создана директория: frontend/hooks/"
  echo ""
  
  # Копируем hooks
  echo "📦 Копируем hooks из корня в frontend/hooks/..."
  echo ""
  
  if [ -d "hooks" ]; then
    cp -v hooks/*.ts frontend/hooks/ 2>/dev/null
    echo ""
    echo "✅ Hooks скопированы!"
  else
    echo "❌ Корневая директория hooks/ не найдена"
    echo "   Создаём hooks в frontend/hooks/ вручную..."
  fi
  
else
  echo "✅ Обнаружена плоская структура (Figma Make)"
  echo ""
  echo "⚠️  Hooks уже должны быть в /hooks/"
  echo ""
  
  if [ ! -d "hooks" ]; then
    echo "❌ Директория hooks/ не найдена!"
    echo "   Создаём..."
    mkdir -p hooks
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Готово!"
echo ""
echo "📝 Проверьте структуру:"
echo ""

if [ -d "frontend/hooks" ]; then
  echo "frontend/hooks/:"
  ls -la frontend/hooks/ 2>/dev/null || echo "  (пусто)"
fi

if [ -d "hooks" ]; then
  echo ""
  echo "hooks/:"
  ls -la hooks/ 2>/dev/null || echo "  (пусто)"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
