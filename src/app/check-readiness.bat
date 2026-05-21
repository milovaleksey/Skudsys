@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════════
echo         Проверка готовности проекта ТюмГУ
echo ════════════════════════════════════════════════════════
echo.

set PASSED=0
set FAILED=0

:: 1. Проверка Node.js
echo [1/10] Проверка Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo        Версия: %NODE_VERSION%
    echo ✓ Node.js установлен
    set /a PASSED+=1
) else (
    echo ✗ Node.js НЕ установлен
    set /a FAILED+=1
)

:: 2. Проверка npm
echo [2/10] Проверка npm...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo        Версия: %NPM_VERSION%
    echo ✓ npm установлен
    set /a PASSED+=1
) else (
    echo ✗ npm НЕ установлен
    set /a FAILED+=1
)

:: 3. Проверка node_modules
echo [3/10] Проверка зависимостей...
if exist node_modules (
    echo ✓ node_modules существует
    set /a PASSED+=1
) else (
    echo ✗ node_modules НЕ существует ^(запустите fix-all.bat^)
    set /a FAILED+=1
)

:: 4. Проверка package.json
echo [4/10] Проверка package.json...
if exist package.json (
    echo ✓ package.json существует
    set /a PASSED+=1
) else (
    echo ✗ package.json НЕ существует
    set /a FAILED+=1
)

:: 5. Проверка vite.config.ts
echo [5/10] Проверка vite.config.ts...
if exist vite.config.ts (
    findstr /C:"host: '0.0.0.0'" vite.config.ts >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ vite.config.ts настроен для сети
        set /a PASSED+=1
    ) else (
        echo ✗ vite.config.ts НЕ настроен
        set /a FAILED+=1
    )
) else (
    echo ✗ vite.config.ts НЕ существует
    set /a FAILED+=1
)

:: 6. Проверка логотипа
echo [6/10] Проверка логотипа...
if exist public\logo.svg (
    echo ✓ Логотип существует
    set /a PASSED+=1
) else (
    echo ✗ Логотип НЕ существует
    set /a FAILED+=1
)

:: 7. Проверка date-fns
echo [7/10] Проверка date-fns...
if exist node_modules\date-fns (
    echo ✓ date-fns установлен
    set /a PASSED+=1
) else (
    echo ✗ date-fns НЕ установлен
    set /a FAILED+=1
)

:: 8. Проверка figma:asset
echo [8/10] Проверка figma:asset импортов...
findstr /R /C:"figma:asset" components\*.tsx >nul 2>&1
if %errorlevel% equ 0 (
    echo ✗ Найдены figma:asset импорты
    set /a FAILED+=1
) else (
    echo ✓ figma:asset импорты исправлены
    set /a PASSED+=1
)

:: 9. Проверка версий в импортах
echo [9/10] Проверка версий в импортах...
findstr /R /C:"@[0-9]*\.[0-9]*\.[0-9]*" components\*.tsx >nul 2>&1
if %errorlevel% equ 0 (
    echo ✗ Найдены версии в импортах
    set /a FAILED+=1
) else (
    echo ✓ Версии в импортах исправлены
    set /a PASSED+=1
)

:: 10. Проверка TypeScript типов
echo [10/10] Проверка TypeScript типов...
if exist vite-env.d.ts (
    echo ✓ vite-env.d.ts существует
    set /a PASSED+=1
) else (
    echo ✗ vite-env.d.ts НЕ существует
    set /a FAILED+=1
)

echo.
echo ════════════════════════════════════════════════════════
echo                     Результаты
echo ════════════════════════════════════════════════════════
echo.
echo Успешно:  %PASSED%
echo Ошибки:   %FAILED%
echo.

if %FAILED% equ 0 (
    echo ✓ Все проверки пройдены!
    echo.
    echo Запустите проект:
    echo   npm run dev
    echo.
) else (
    echo ✗ Есть проблемы!
    echo.
    echo Исправьте ошибки:
    echo   fix-all.bat
    echo.
)

pause
