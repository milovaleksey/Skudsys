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
echo "🐈 НОВАЯ АНИМАЦИЯ: КОТИК КОПАЕТСЯ В ЛОТКЕ! 💩"
echo ""
echo "🎨 Компонент DiggingCat (мини-версия из LoadingCatWidget):"
echo "   • Лоток с песком 📦"
echo "   • Оранжевый кот с ушками 🐱"
echo "   • Копающаяся лапа (3 позиции) 🐾"
echo "   • Виляющий хвост 〰️"
echo "   • Песчинки вылетают при копании ✨"
echo "   • Следы от копания в песке"
echo ""
echo "🎬 Анимация (цикл 1.2 секунды):"
echo "   Кадр 1: Лапа в центре"
echo "   Кадр 2: Лапа копает влево (песок летит!)"
echo "   Кадр 3: Лапа копает вправо"
echo "   → Хвост виляет от удовольствия"
echo ""
echo "⏰ Время отображения: +3 часа к UTC"
echo ""
echo "🎯 ИТОГ: Кот копается в лотке пока ждёт MQTT события!"
echo "   = Точно как на странице 'Отчет по иностранным студентам' 🎉"
echo ""
