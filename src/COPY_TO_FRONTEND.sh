#!/bin/bash

# Скрипт для копирования обновленного файла в папку frontend

echo "🚀 Копирование обновленного файла в /frontend..."

# Убедимся, что папка существует
mkdir -p frontend/components

# Копируем EngineeringPage.tsx
if [ -f "components/EngineeringPage.tsx" ]; then
  cp components/EngineeringPage.tsx frontend/components/EngineeringPage.tsx
  echo "✅ Скопирован components/EngineeringPage.tsx"
else
  echo "❌ Файл components/EngineeringPage.tsx не найден!"
fi

echo ""
echo "✨ Копирование завершено!"
echo "📝 Обновленный файл:"
echo "   - frontend/components/EngineeringPage.tsx"
echo ""
echo "🔧 Что изменилось:"
echo "   1. Добавлена сортировка по колонке 'Дата и время' (клик на заголовок)"
echo "   2. 3 состояния сортировки: новые сверху ↓, старые сверху ↑, новые сверху ↓"
echo "   3. Время отображается БЕЗ конвертации часового пояса"
echo ""
echo "⚠️  ВАЖНО: time_label приходит УЖЕ в локальном времени UTC+5"
echo "   Backend отдаёт: '2026-03-13T01:55:47.000Z'"
echo "   Frontend показывает: '13.03.2026 01:55:47' (без добавления +5)"
echo ""
echo "📊 Принцип работы:"
echo "   - MSSQL хранит локальное время Тюмени (UTC+5)"
echo "   - MSSQL драйвер добавляет 'Z', НО НЕ конвертирует время"
echo "   - Frontend просто парсит строку и отображает 'как есть'"
echo ""
