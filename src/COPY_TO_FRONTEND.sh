#!/bin/bash

# Скрипт для копирования обновленных файлов в папку frontend

echo "🚀 Копирование обновленных файлов в /frontend..."

# Убедимся, что папки существуют
mkdir -p frontend/components
mkdir -p frontend/styles

# Копируем EngineeringPage.tsx
if [ -f "components/EngineeringPage.tsx" ]; then
  cp components/EngineeringPage.tsx frontend/components/EngineeringPage.tsx
  echo "✅ Скопирован components/EngineeringPage.tsx"
else
  echo "❌ Файл components/EngineeringPage.tsx не найден!"
fi

# Копируем globals.css
if [ -f "styles/globals.css" ]; then
  cp styles/globals.css frontend/styles/globals.css
  echo "✅ Скопирован styles/globals.css"
else
  echo "❌ Файл styles/globals.css не найден!"
fi

echo ""
echo "✨ Копирование завершено!"
echo "📝 Обновленные файлы:"
echo "   - frontend/components/EngineeringPage.tsx"
echo "   - frontend/styles/globals.css"
echo ""
echo "🐈 Что изменилось:"
echo "   1. Бегущий кот теперь с анимацией ног! 🐈‍⬛ 🐱 🐾"
echo "   2. Коррекция времени: +3 часа при отображении"
echo "   3. CSS анимация для плавного движения кота"
echo ""
echo "🎬 Анимация кота:"
echo "   - Кадр 1: 🐈 (кот смотрит вправо)"
echo "   - Кадр 2: 🐈‍⬛ (черный кот)"
echo "   - Кадр 3: 🐱 (мордочка кота)"
echo "   - Кадр 4: 🐾 (следы лап)"
echo "   - Скорость: 150ms на кадр"
echo "   - Движение: 3 секунды слева направо"
echo ""
