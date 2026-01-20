@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   Исправление и установка зависимостей                    ║
echo ║   Система безопасности ТюмГУ                             ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/3] Очистка старых зависимостей...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ node_modules удалена
)
if exist package-lock.json (
    del /f package-lock.json
    echo ✓ package-lock.json удален
)

echo.
echo [2/3] Установка зависимостей...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ⚠ Обычная установка не удалась, пробуем с --legacy-peer-deps...
    call npm install --legacy-peer-deps
)

echo.
echo [3/3] Проверка установки...
call npm list date-fns

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ✓ Установка завершена!                                 ║
echo ║                                                           ║
echo ║   Запустите проект:                                      ║
echo ║   npm run dev                                            ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

pause
