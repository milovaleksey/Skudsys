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

# Копируем TeacherReportPage.tsx
if [ -f "components/TeacherReportPage.tsx" ]; then
  cp components/TeacherReportPage.tsx frontend/components/TeacherReportPage.tsx
  echo "✅ Скопирован components/TeacherReportPage.tsx"
else
  echo "❌ Файл components/TeacherReportPage.tsx не найден!"
fi

echo ""
echo "✨ Копирование завершено!"
echo "📝 Обновленные файлы:"
echo "   - frontend/components/EngineeringPage.tsx"
echo "   - frontend/components/TeacherReportPage.tsx"
echo ""
echo "🆕 НОВАЯ СТРАНИЦА: Отчет по преподавателям! 👨‍🏫"
echo ""
echo "📊 Функционал TeacherReportPage:"
echo "   • Выбор преподавателя из списка 👤"
echo "   • Режимы: Неделя / Месяц 📅"
echo "   • Навигация по периодам ⏮️ ⏭️"
echo "   • Экспорт в Excel 📥"
echo ""
echo "🎨 Визуализация (Timeline):"
echo "   • Временная шкала 6:00 - 23:00 ⏰"
echo "   • Цветовая кодировка:"
echo "     - 🟢 Зеленый: Вход в корпус"
echo "     - 🟠 Оранжевый: Этаж"
echo "     - 🔴 Красно-оранжевый: Аудитория"
echo "     - ⚪ Серый: Вне территории"
echo ""
echo "📖 Расписание занятий:"
echo "   • Полупрозрачные блоки поверх проходов 🎓"
echo "   • Фиолетовый: Лекции"
echo "   • Синий: Практики"
echo "   • Оранжевый: Лабораторные"
echo "   • Tooltip при наведении 💬"
echo ""
echo "⚠️ Определение нарушений:"
echo "   • 🔴 Опоздание: > 3 мин после начала"
echo "   • 🟠 Ранний уход: > 5 мин до конца"
echo "   • Красный значок предупреждения на блоке"
echo ""
echo "📦 Mock данные (для разработки):"
echo "   • 3 преподавателя"
echo "   • Расписание по дням недели"
echo "   • Реалистичные проходы с опозданиями/ранними уходами"
echo ""
echo "🔐 Права доступа:"
echo "   • Новое permission: 'teachers'"
echo "   • Добавлено в ALL_PERMISSIONS"
echo "   • Роут в MainPage: activePage === 'teachers'"
echo ""