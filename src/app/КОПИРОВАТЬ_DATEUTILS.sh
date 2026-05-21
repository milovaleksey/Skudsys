#!/bin/bash

# Копирование dateUtils.ts в frontend/lib/

echo "📦 Копирование dateUtils.ts..."

# Проверяем что мы в правильной директории
if [ ! -d "frontend" ]; then
  echo "❌ Директория frontend/ не найдена!"
  echo "   Запустите из: /var/www/utmn-security/debug/"
  exit 1
fi

# Создаём директорию если нужно
mkdir -p frontend/lib

# Копируем файл
if [ -f "lib/dateUtils.ts" ]; then
  cp lib/dateUtils.ts frontend/lib/dateUtils.ts
  echo "✅ Файл скопирован: frontend/lib/dateUtils.ts"
  
  # Проверяем
  if [ -f "frontend/lib/dateUtils.ts" ]; then
    echo "✅ Проверка: файл существует"
    ls -lh frontend/lib/dateUtils.ts
  fi
else
  echo "❌ Исходный файл не найден: lib/dateUtils.ts"
  exit 1
fi

echo ""
echo "✅ Готово! Теперь EngineeringPage будет показывать время в UTC+5"
