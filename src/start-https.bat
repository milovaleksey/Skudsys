@echo off
REM Запуск системы в HTTPS режиме для Windows

echo.
echo ============================================
echo   Запуск системы в HTTPS режиме
echo ============================================
echo.

REM Проверка сертификатов
if not exist "certs\server.key" (
    echo [WARNING] SSL сертификаты не найдены
    echo.
    set /p GENERATE="Сгенерировать сертификаты? (y/n): "
    
    if /i "%GENERATE%"=="y" (
        echo.
        echo Генерация сертификатов...
        call scripts\generate-ssl-cert.bat
        if %errorlevel% neq 0 (
            echo [ERROR] Ошибка генерации сертификатов
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] Сертификаты необходимы для HTTPS
        pause
        exit /b 1
    )
)

echo [OK] SSL сертификаты найдены
echo.

REM Проверка backend/.env
if not exist "backend\.env" (
    echo [WARNING] backend\.env не найден
    cd backend
    copy .env.example .env
    echo [OK] Создан backend\.env
    cd ..
)

REM Настройка backend для HTTPS
echo Настройка backend для HTTPS...
cd backend

REM Включить HTTPS
powershell -Command "(gc .env) -replace 'USE_HTTPS=.*', 'USE_HTTPS=true' | Out-File -encoding ASCII .env.tmp"
if exist .env.tmp (
    move /y .env.tmp .env >nul
) else (
    echo USE_HTTPS=true>> .env
)

REM Порт HTTPS
powershell -Command "(gc .env) -replace 'HTTPS_PORT=.*', 'HTTPS_PORT=3443' | Out-File -encoding ASCII .env.tmp"
if exist .env.tmp (
    move /y .env.tmp .env >nul
) else (
    echo HTTPS_PORT=3443>> .env
)

REM CORS для HTTPS
powershell -Command "(gc .env) -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=https://localhost:5173,http://localhost:5173' | Out-File -encoding ASCII .env.tmp"
if exist .env.tmp (
    move /y .env.tmp .env >nul
) else (
    echo CORS_ORIGIN=https://localhost:5173,http://localhost:5173>> .env
)

echo [OK] Backend настроен
cd ..

REM Проверка зависимостей Backend
if not exist "backend\node_modules" (
    echo.
    echo Установка зависимостей Backend...
    cd backend
    call npm install
    cd ..
)

REM Проверка зависимостей Frontend
if not exist "node_modules" (
    echo.
    echo Установка зависимостей Frontend...
    call npm install
)

REM Информация
echo.
echo ============================================
echo [OK] Все готово к запуску!
echo ============================================
echo.
echo Backend:  https://localhost:3443
echo Frontend: https://localhost:5173
echo.
echo [WARNING] Браузер покажет предупреждение
echo   Это нормально для самоподписанных сертификатов
echo   Нажмите: Advanced -^> Proceed to localhost
echo.
echo Тестовый вход:
echo   Логин:  admin_security
echo   Пароль: test123
echo.
echo ============================================

REM Установка сертификата (опционально)
echo.
set /p INSTALL_CERT="Установить сертификат в Windows? (y/n): "

if /i "%INSTALL_CERT%"=="y" (
    echo.
    echo Установка сертификата...
    echo [INFO] Требуются права администратора
    
    certutil -addstore -f "ROOT" certs\server.crt
    if %errorlevel% equ 0 (
        echo [OK] Сертификат установлен
        echo.
        echo [INFO] Перезапустите браузер
    ) else (
        echo [WARNING] Ошибка установки
        echo   Запустите от администратора:
        echo   certutil -addstore -f "ROOT" certs\server.crt
    )
)

REM Запуск серверов
echo.
set /p START_SERVERS="Запустить серверы? (y/n): "

if /i "%START_SERVERS%"=="y" (
    echo.
    echo Запуск серверов...
    echo.
    
    REM Backend HTTPS
    start "UTMN Security - Backend HTTPS" cmd /k "cd backend && node src/server-https.js"
    
    REM Задержка
    timeout /t 3 /nobreak >nul
    
    REM Frontend HTTPS
    start "UTMN Security - Frontend HTTPS" cmd /k "npm run dev -- --config vite.config.https.ts"
    
    echo [OK] Серверы запускаются...
    echo.
    echo Откройте браузер: https://localhost:5173
    echo.
) else (
    echo.
    echo Для запуска вручную:
    echo.
    echo Terminal 1 (Backend HTTPS):
    echo   cd backend
    echo   node src/server-https.js
    echo.
    echo Terminal 2 (Frontend HTTPS):
    echo   npm run dev -- --config vite.config.https.ts
    echo.
    echo Затем откройте: https://localhost:5173
    echo.
)

echo [OK] Готово!
echo.
pause
