@echo off
chcp 65001 >nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   Полное исправление и установка                          ║
echo ║   Система безопасности ТюмГУ                             ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/3] Очистка и установка зависимостей...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ node_modules удалена
)
if exist package-lock.json (
    del /f package-lock.json
    echo ✓ package-lock.json удален
)

echo.
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ Обычная установка не удалась, пробуем с --legacy-peer-deps...
    call npm install --legacy-peer-deps
) else (
    echo ✓ Зависимости установлены
)

echo.
echo [2/3] Исправление импортов TypeScript...
powershell -Command "Get-ChildItem -Path './components' -Recurse -Include *.tsx,*.ts | ForEach-Object { (Get-Content $_.FullName) -replace '@\d+\.\d+\.\d+', '' | Set-Content $_.FullName }" >nul 2>&1

if exist "contexts" (
    powershell -Command "Get-ChildItem -Path './contexts' -Recurse -Include *.tsx,*.ts | ForEach-Object { (Get-Content $_.FullName) -replace '@\\d+\\.\\d+\\.\\d+', '' | Set-Content $_.FullName }" >nul 2>&1
)

echo ✓ Импорты исправлены

echo.
echo [3/3] Проверка...
call npm list date-fns 2>nul | findstr "date-fns"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   ✓ Установка завершена!                                 ║
echo ║                                                           ║
echo ║   Запустите проект:                                      ║
echo ║   npm run dev                                            ║
echo ║                                                           ║
echo ║   Откройте: http://localhost:5173                        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

pause