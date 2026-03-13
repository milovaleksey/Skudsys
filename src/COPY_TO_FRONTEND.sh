#!/bin/bash

# Скрипт для копирования обновленных файлов в папку frontend

echo "🚀 Копирование обновленных файлов в /frontend..."

# Убедимся, что папки существуют
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
echo "🐈 ОБНОВЛЕНИЕ: КОТ В 2 РАЗА БОЛЬШЕ! 💩"
echo ""
echo "🎨 Компонент DiggingCat:"
echo "   • Размер SVG: 80×64px (было 40×32px) ⬆️"
echo "   • ViewBox: 120×80 (без изменений)"
echo "   • Текст 'MQTT Live' УБРАН ❌"
echo ""
echo "📦 Элементы:"
echo "   • Лоток с песком 📦"
echo "   • Оранжевый кот 🐱"
echo "   • Копающаяся лапа (3 позиции) 🐾"
echo "   • Виляющий хвост 〰️"
echo "   • Песчинки вылетают ✨"
echo "   • Следы от копания"
echo ""
echo "🎬 Анимация (цикл 1.2 сек):"
echo "   Кадр 1: Лапа в центре"
echo "   Кадр 2: Лапа копает влево + песок летит! 💨"
echo "   Кадр 3: Лапа копает вправо"
echo "   → Хвост виляет постоянно (1.5 сек цикл)"
echo ""
echo "📍 Отображение:"
echo "   ✅ MQTT подключен → КОТ КОПАЕТСЯ! 🐈💩"
echo "   ❌ MQTT отключен → Серая точка + текст"
echo ""
echo "🎯 ИТОГ: Большой котик без текста!"
echo "   = Чистый минималистичный индикатор 🎉"
echo ""
