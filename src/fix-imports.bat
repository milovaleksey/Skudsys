@echo off
chcp 65001 >nul

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║   Исправление импортов TypeScript                         ║
echo ║   Удаление версий из импортов (@x.x.x)                   ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo [1/2] Исправление импортов в components...
powershell -Command "Get-ChildItem -Path './components' -Recurse -Include *.tsx,*.ts | ForEach-Object { (Get-Content $_.FullName) -replace '@\d+\.\d+\.\d+', '' | Set-Content $_.FullName }"

if exist "contexts" (
    echo [2/2] Исправление импортов в contexts...
    powershell -Command "Get-ChildItem -Path './contexts' -Recurse -Include *.tsx,*.ts | ForEach-Object { (Get-Content $_.FullName) -replace '@\d+\.\d+\.\d+', '' | Set-Content $_.FullName }"
)

echo.
echo ✓ Все импорты исправлены!
echo.
echo Теперь запустите: npm run dev
echo.

pause
