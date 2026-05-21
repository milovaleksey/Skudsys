@echo off
REM Генерация самоподписанных SSL сертификатов для Windows

echo.
echo ============================================
echo   Генерация SSL сертификатов для разработки
echo ============================================
echo.

REM Проверка OpenSSL
where openssl >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] OpenSSL не найден!
    echo.
    echo Установите OpenSSL:
    echo 1. Скачайте с: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. Или установите через Chocolatey: choco install openssl
    echo 3. Или используйте Git Bash (содержит OpenSSL)
    echo.
    pause
    exit /b 1
)

echo [OK] OpenSSL найден
echo.

REM Параметры
set CERT_DIR=certs
set DOMAIN=localhost
set DAYS=365
set COUNTRY=RU
set STATE=Tyumen
set CITY=Tyumen
set ORGANIZATION=TyumGU
set OU=Security Department
set EMAIL=security@utmn.ru

REM Создать папку
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

echo Параметры сертификата:
echo   Домен: %DOMAIN%
echo   Срок: %DAYS% дней
echo   Организация: %ORGANIZATION%
echo.

REM Генерация приватного ключа
echo [1/5] Генерация приватного ключа...
openssl genrsa -out "%CERT_DIR%\server.key" 2048
if %errorlevel% neq 0 (
    echo [ERROR] Ошибка генерации ключа
    pause
    exit /b 1
)
echo [OK] Ключ создан: %CERT_DIR%\server.key
echo.

REM Создание конфигурации
echo [2/5] Создание конфигурации...
(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo distinguished_name = dn
echo req_extensions = v3_req
echo.
echo [dn]
echo C=%COUNTRY%
echo ST=%STATE%
echo L=%CITY%
echo O=%ORGANIZATION%
echo OU=%OU%
echo CN=%DOMAIN%
echo emailAddress=%EMAIL%
echo.
echo [v3_req]
echo basicConstraints = CA:FALSE
echo keyUsage = nonRepudiation, digitalSignature, keyEncipherment
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = localhost
echo DNS.2 = *.localhost
echo DNS.3 = 127.0.0.1
echo IP.1 = 127.0.0.1
echo IP.2 = ::1
) > "%CERT_DIR%\san.cnf"
echo [OK] Конфигурация создана: %CERT_DIR%\san.cnf
echo.

REM Генерация CSR
echo [3/5] Генерация CSR...
openssl req -new -key "%CERT_DIR%\server.key" -out "%CERT_DIR%\server.csr" -config "%CERT_DIR%\san.cnf"
if %errorlevel% neq 0 (
    echo [ERROR] Ошибка генерации CSR
    pause
    exit /b 1
)
echo [OK] CSR создан: %CERT_DIR%\server.csr
echo.

REM Генерация сертификата
echo [4/5] Генерация самоподписанного сертификата...
openssl x509 -req -days %DAYS% -in "%CERT_DIR%\server.csr" -signkey "%CERT_DIR%\server.key" -out "%CERT_DIR%\server.crt" -extfile "%CERT_DIR%\san.cnf" -extensions v3_req
if %errorlevel% neq 0 (
    echo [ERROR] Ошибка генерации сертификата
    pause
    exit /b 1
)
echo [OK] Сертификат создан: %CERT_DIR%\server.crt
echo.

REM Генерация PEM
echo [5/5] Создание PEM файла...
copy /b "%CERT_DIR%\server.crt" + "%CERT_DIR%\server.key" "%CERT_DIR%\server.pem" >nul
echo [OK] PEM создан: %CERT_DIR%\server.pem
echo.

REM Вывод информации
echo ============================================
echo Информация о сертификате:
echo ============================================
openssl x509 -in "%CERT_DIR%\server.crt" -noout -subject
openssl x509 -in "%CERT_DIR%\server.crt" -noout -dates
echo ============================================
echo.

REM Создание .gitignore
(
echo # Игнорировать все сертификаты
echo *.key
echo *.crt
echo *.csr
echo *.pem
echo *.cnf
echo.
echo # Кроме README
echo !README.md
) > "%CERT_DIR%\.gitignore"

REM Создание README
(
echo # SSL Сертификаты для разработки
echo.
echo WARNING: ТОЛЬКО ДЛЯ РАЗРАБОТКИ! НЕ ИСПОЛЬЗОВАТЬ В PRODUCTION!
echo.
echo ## Файлы
echo.
echo - server.key - Приватный ключ
echo - server.crt - Сертификат
echo - server.pem - Комбинация
echo.
echo ## Установка в Windows
echo.
echo Запустите PowerShell от администратора:
echo ```
echo certutil -addstore -f "ROOT" certs\server.crt
echo ```
echo.
echo ## Удаление
echo.
echo ```
echo certutil -delstore "ROOT" "localhost"
echo ```
echo.
echo ## Регенерация
echo.
echo ```
echo scripts\generate-ssl-cert.bat
echo ```
) > "%CERT_DIR%\README.md"

echo ============================================
echo [OK] Сертификаты успешно созданы!
echo ============================================
echo.
echo Файлы находятся в: %CERT_DIR%\
echo.
echo Следующие шаги:
echo.
echo 1. Установите сертификат (PowerShell от админа):
echo    certutil -addstore -f "ROOT" %CERT_DIR%\server.crt
echo.
echo 2. Настройте Backend и Frontend
echo    См. примеры в: %CERT_DIR%\README.md
echo.
echo 3. Перезапустите браузер
echo.
echo ВАЖНО: Эти сертификаты только для разработки!
echo.
pause
