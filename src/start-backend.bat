@echo off
REM Скрипт для проверки и запуска backend сервера (Windows)

echo.
echo 🔍 Проверка backend сервера...
echo.

cd /d "%~dp0backend"

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo 📦 node_modules не найдены. Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
    echo ✅ Зависимости установлены
    echo.
)

REM Проверка .env файла
if not exist ".env" (
    echo ⚠️  Файл .env не найден!
    echo Создайте файл .env на основе .env.example
    echo.
    if exist ".env.example" (
        echo Пример команды:
        echo   copy .env.example .env
        echo   notepad .env
    )
    pause
    exit /b 1
)

REM Проверка MQTT конфигурации
if not exist ".env.mqtt" (
    echo ℹ️  Файл .env.mqtt не найден ^(опционально^)
    if exist ".env.mqtt.example" (
        echo Для использования MQTT создайте:
        echo   copy .env.mqtt.example .env.mqtt
        echo   notepad .env.mqtt
    )
    echo.
)

echo ✅ Все проверки пройдены!
echo.

REM Проверка порта 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ⚠️  Порт 3000 уже занят!
    echo.
    echo Возможно, сервер уже запущен.
    echo.
    set /p answer="Остановить процесс и перезапустить? (y/n): "
    if /i "%answer%"=="y" (
        echo 🛑 Остановка процесса на порту 3000...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
        timeout /t 2 /nobreak >nul
    ) else (
        exit /b 0
    )
)

echo 🚀 Запуск backend сервера...
echo.
echo Логи сервера:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Запуск сервера
call npm run dev
