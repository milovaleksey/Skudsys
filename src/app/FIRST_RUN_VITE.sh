#!/bin/bash

# Первый запуск после исправления Vite
# Автоматически делает всё необходимое

clear

cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                    ПЕРВЫЙ ЗАПУСК ПОСЛЕ ИСПРАВЛЕНИЯ                ║
║              Система безопасности инфраструктуры ТюмГУ            ║
╚═══════════════════════════════════════════════════════════════════╝

EOF

echo "Этот скрипт автоматически:"
echo "  1. Сделает все скрипты исполняемыми"
echo "  2. Проверит структуру проекта"
echo "  3. Протестирует конфигурацию Vite"
echo "  4. Покажет справочную информацию"
echo "  5. Предложит запустить приложение"
echo ""

read -p "Продолжить? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Отменено."
    exit 0
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "ШАГ 1: Делаем скрипты исполняемыми"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

chmod +x FIX_VITE_NOW.sh 2>/dev/null && echo "✅ FIX_VITE_NOW.sh"
chmod +x test-vite-setup.sh 2>/dev/null && echo "✅ test-vite-setup.sh"
chmod +x check-structure.sh 2>/dev/null && echo "✅ check-structure.sh"
chmod +x start-frontend.sh 2>/dev/null && echo "✅ start-frontend.sh"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "ШАГ 2: Проверка структуры проекта"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -f "./check-structure.sh" ]; then
    ./check-structure.sh
else
    echo "⚠️  check-structure.sh не найден"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "ШАГ 3: Тестирование конфигурации Vite"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -f "./test-vite-setup.sh" ]; then
    ./test-vite-setup.sh
else
    echo "⚠️  test-vite-setup.sh не найден"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "ШАГ 4: Справочная информация"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

if [ -f "./vite-help.txt" ]; then
    cat vite-help.txt
else
    echo "📚 Документация:"
    echo "  - НАЧАТЬ_ЗДЕСЬ_VITE.md - Быстрый старт"
    echo "  - VITE_ИСПРАВЛЕНИЕ.md - Инструкция на русском"
    echo "  - VITE_CHEATSHEET.md - Шпаргалка"
    echo ""
    echo "🛠️  Утилиты:"
    echo "  - ./FIX_VITE_NOW.sh - Автозапуск"
    echo "  - ./test-vite-setup.sh - Тесты"
    echo "  - ./check-structure.sh - Структура"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "ШАГ 5: Запуск приложения"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "Варианты запуска:"
echo ""
echo "1) Автоматический (рекомендуется)"
echo "2) Из корня проекта"
echo "3) Из /frontend директории"
echo "4) Не запускать сейчас"
echo ""

read -p "Ваш выбор (1-4): " choice
echo ""

case $choice in
    1)
        if [ -f "./FIX_VITE_NOW.sh" ]; then
            echo "🚀 Запуск автоматического скрипта..."
            echo ""
            ./FIX_VITE_NOW.sh
        else
            echo "⚠️  FIX_VITE_NOW.sh не найден, запускаем из корня"
            echo ""
            npm run dev
        fi
        ;;
    2)
        echo "🚀 Запуск из корня проекта..."
        echo ""
        npm run dev
        ;;
    3)
        if [ -d "./frontend" ]; then
            echo "🚀 Запуск из /frontend..."
            echo ""
            cd frontend
            npm run dev
        else
            echo "❌ Директория /frontend не найдена!"
            exit 1
        fi
        ;;
    4)
        echo ""
        echo "╔═══════════════════════════════════════════════════════════════════╗"
        echo "║                    ГОТОВО К ЗАПУСКУ!                              ║"
        echo "╚═══════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Для запуска используйте:"
        echo "  ./FIX_VITE_NOW.sh         - Автоматический"
        echo "  npm run dev               - Из корня"
        echo "  cd frontend && npm run dev - Из frontend"
        echo ""
        echo "Для справки:"
        echo "  cat vite-help.txt"
        echo "  cat НАЧАТЬ_ЗДЕСЬ_VITE.md"
        echo ""
        exit 0
        ;;
    *)
        echo "❌ Неверный выбор. Выход."
        exit 1
        ;;
esac
