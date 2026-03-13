@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║                    VITE - Автоматическое исправление                  ║
echo ║              Система безопасности инфраструктуры ТюмГУ                ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Быстрое исправление и запуск Vite Setup
echo ========================================
echo.

REM Проверка существования Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js 18+ и попробуйте снова.
    echo    Скачать: https://nodejs.org/
    pause
    exit /b 1
)

REM Проверка версии Node.js
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js версия: %NODE_VERSION%
echo.

REM Шаг 1: Проверка структуры
echo ═══════════════════════════════════════════════════════════════════════
echo 📂 Шаг 1: Проверка структуры проекта...
echo ═══════════════════════════════════════════════════════════════════════
echo.

if exist "components" (
    echo ✅ Папка components/ найдена
) else (
    echo ❌ Папка components/ не найдена!
)

if exist "contexts" (
    echo ✅ Папка contexts/ найдена
) else (
    echo ❌ Папка contexts/ не найдена!
)

if exist "lib" (
    echo ✅ Папка lib/ найдена
) else (
    echo ❌ Папка lib/ не найдена!
)

if exist "App.tsx" (
    echo ✅ Файл App.tsx найден
) else (
    echo ❌ Файл App.tsx не найден!
)

if exist "frontend" (
    echo ✅ Папка frontend/ найдена
) else (
    echo ❌ Папка frontend/ не найдена!
)

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo 🧪 Шаг 2: Проверка конфигурации...
echo ═══════════════════════════════════════════════════════════════════════
echo.

if exist "frontend\vite.config.ts" (
    echo ✅ frontend\vite.config.ts существует
    findstr /C:"../components" frontend\vite.config.ts >nul 2>nul
    if !errorlevel! equ 0 (
        echo    ✅ Алиасы указывают на корневые папки
    ) else (
        echo    ⚠️  Алиасы могут быть некорректными
    )
) else (
    echo ❌ frontend\vite.config.ts не найден!
)

if exist "frontend\App.tsx" (
    echo ✅ frontend\App.tsx существует
    findstr /C:"../components/LoginPage" frontend\App.tsx >nul 2>nul
    if !errorlevel! equ 0 (
        echo    ✅ Импорты корректные
    ) else (
        echo    ⚠️  Импорты могут быть некорректными
    )
) else (
    echo ❌ frontend\App.tsx не найден!
)

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo 📚 Шаг 3: Справочная информация
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo 📖 Документация:
echo    - НАЧАТЬ_ЗДЕСЬ_VITE.md - Быстрый старт
echo    - VITE_ИСПРАВЛЕНИЕ.md - Инструкция на русском
echo    - VITE_CHEATSHEET.md - Шпаргалка
echo    - vite-help.txt - Справка
echo.
echo 🛠️  Утилиты:
echo    - test-vite-setup.sh - Тестирование (Linux/Mac)
echo    - check-structure.sh - Структура (Linux/Mac)
echo    - FIX_VITE_NOW.bat - Этот скрипт (Windows)
echo.

echo ═══════════════════════════════════════════════════════════════════════
echo 🚀 Шаг 4: Запуск приложения
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo Выберите вариант запуска:
echo.
echo 1) Из корня проекта (рекомендуется)
echo 2) Из папки frontend
echo 3) Только проверка (не запускать)
echo 4) Выход
echo.

set /p choice="Ваш выбор (1-4): "
echo.

if "%choice%"=="1" (
    echo 🚀 Запуск из корня проекта...
    echo.
    npm run dev
) else if "%choice%"=="2" (
    if exist "frontend" (
        echo 🚀 Запуск из папки frontend...
        echo.
        cd frontend
        npm run dev
    ) else (
        echo ❌ Папка frontend не найдена!
        pause
        exit /b 1
    )
) else if "%choice%"=="3" (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════════════╗
    echo ║                    ПРОВЕРКА ЗАВЕРШЕНА                                 ║
    echo ╚═══════════════════════════════════════════════════════════════════════╝
    echo.
    echo Для запуска используйте:
    echo   npm run dev                 - Из корня
    echo   cd frontend ^&^& npm run dev  - Из frontend
    echo.
    echo Для справки:
    echo   type vite-help.txt
    echo   type НАЧАТЬ_ЗДЕСЬ_VITE.md
    echo.
    pause
    exit /b 0
) else if "%choice%"=="4" (
    echo Выход.
    exit /b 0
) else (
    echo ❌ Неверный выбор. Запуск из корня по умолчанию...
    echo.
    npm run dev
)

pause
