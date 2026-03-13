#!/bin/bash

# Скрипт для запуска frontend приложения
# Определяет правильную структуру и запускает из нужной папки

echo "🔍 Проверка структуры проекта..."

# Проверяем, есть ли компоненты в корне
if [ -d "./components" ]; then
    echo "✅ Найдена корневая структура с компонентами"
    STRUCTURE="root"
fi

# Проверяем, есть ли components во frontend
if [ -d "./frontend/components" ]; then
    echo "✅ Найдена frontend структура с компонентами"
    STRUCTURE="frontend"
fi

# Если компоненты только в корне, запускаем из корня
if [ "$STRUCTURE" = "root" ] && [ ! -d "./frontend/components" ]; then
    echo "📦 Запуск из корневой директории..."
    npm run dev
    exit 0
fi

# Если компоненты только во frontend, запускаем из frontend
if [ "$STRUCTURE" = "frontend" ] && [ ! -d "./components" ]; then
    echo "📦 Запуск из директории frontend..."
    cd frontend
    npm run dev
    exit 0
fi

# Если компоненты в обоих местах - спросим пользователя
if [ -d "./components" ] && [ -d "./frontend/components" ]; then
    echo "⚠️  Обнаружены компоненты в двух местах!"
    echo "Выберите, откуда запустить:"
    echo "1) Из корня (текущая рабочая версия)"
    echo "2) Из /frontend (новая monorepo структура)"
    read -p "Ваш выбор (1 или 2): " choice
    
    if [ "$choice" = "2" ]; then
        echo "📦 Запуск из директории frontend..."
        cd frontend
        npm run dev
    else
        echo "📦 Запуск из корневой директории..."
        npm run dev
    fi
    exit 0
fi

# Если ничего не найдено
echo "❌ Ошибка: не найдены компоненты ни в корне, ни во frontend!"
echo "Проверьте структуру проекта."
exit 1
