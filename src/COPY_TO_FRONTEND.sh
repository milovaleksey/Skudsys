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
echo "   1. Добавлена коррекция времени: +3 часа при отображении"
echo "   2. Сортировка по времени работает с 3 состояниями"
echo "   3. Фильтры, поиск и экспорт в Excel"
echo ""
echo "⏰ Коррекция времени:"
echo "   Backend отдаёт: '2026-03-13T01:55:47.000Z'"
echo "   Frontend +3 часа: '13.03.2026 04:55:47'"
echo ""
echo "🎯 Формула: отображаемое_время = UTC_время + 3 часа"
echo ""
