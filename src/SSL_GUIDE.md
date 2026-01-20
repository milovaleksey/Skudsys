# 🔐 Руководство по использованию HTTPS для разработки

## 📋 Содержание

1. [Быстрый старт](#-быстрый-старт)
2. [Генерация сертификатов](#-генерация-сертификатов)
3. [Установка сертификатов](#-установка-сертификатов)
4. [Запуск с HTTPS](#-запуск-с-https)
5. [Решение проблем](#-решение-проблем)
6. [Дополнительная информация](#-дополнительная-информация)

---

## 🚀 Быстрый старт

### Автоматический запуск с HTTPS

**Linux/Mac:**
```bash
chmod +x start-https.sh
./start-https.sh
```

**Windows:**
```cmd
start-https.bat
```

Скрипт автоматически:
- ✅ Сгенерирует сертификаты (если их нет)
- ✅ Настроит backend и frontend
- ✅ Предложит установить сертификат
- ✅ Запустит серверы

---

## 🔑 Генерация сертификатов

### Вариант 1: Через скрипт (рекомендуется)

**Linux/Mac:**
```bash
chmod +x scripts/generate-ssl-cert.sh
./scripts/generate-ssl-cert.sh
```

**Windows:**
```cmd
scripts\generate-ssl-cert.bat
```

### Вариант 2: Вручную через OpenSSL

```bash
# Создать папку
mkdir -p certs
cd certs

# Генерация приватного ключа (2048 бит)
openssl genrsa -out server.key 2048

# Создание конфигурации SAN
cat > san.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=RU
ST=Tyumen
L=Tyumen
O=TyumGU
OU=Security Department
CN=localhost
emailAddress=security@utmn.ru

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Генерация CSR
openssl req -new -key server.key -out server.csr -config san.cnf

# Генерация самоподписанного сертификата (365 дней)
openssl x509 -req -days 365 \
  -in server.csr \
  -signkey server.key \
  -out server.crt \
  -extfile san.cnf \
  -extensions v3_req

# Создание PEM файла (опционально)
cat server.crt server.key > server.pem

cd ..
```

### Вариант 3: Через mkcert (простейший способ)

**Установка mkcert:**

```bash
# macOS
brew install mkcert
brew install nss # для Firefox

# Linux
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Windows (через Chocolatey)
choco install mkcert
```

**Генерация сертификатов:**

```bash
# Создать папку
mkdir -p certs
cd certs

# Установить локальный CA
mkcert -install

# Генерировать сертификаты
mkcert localhost 127.0.0.1 ::1

# Переименовать (опционально)
mv localhost+2.pem server.crt
mv localhost+2-key.pem server.key

cd ..
```

---

## 📦 Структура файлов

После генерации в папке `certs/` будут файлы:

```
certs/
├── server.key      # Приватный ключ (НЕ КОММИТИТЬ!)
├── server.crt      # Публичный сертификат
├── server.csr      # Certificate Signing Request
├── server.pem      # Комбинация (key + crt)
├── san.cnf         # Конфигурация SAN
├── .gitignore      # Игнорирование файлов
└── README.md       # Документация
```

⚠️ **ВАЖНО:** Файлы `.key` и `.pem` содержат приватный ключ и **НЕ должны** коммититься в Git!

---

## 🔒 Установка сертификатов

Для того чтобы браузер доверял самоподписанному сертификату, его нужно установить в систему.

### macOS

```bash
sudo security add-trusted-cert \
  -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  certs/server.crt
```

**Проверка:**
```bash
security find-certificate -c "localhost" -a
```

**Удаление:**
```bash
sudo security delete-certificate \
  -c "localhost" \
  /Library/Keychains/System.keychain
```

### Linux (Ubuntu/Debian)

```bash
# Копировать сертификат
sudo cp certs/server.crt /usr/local/share/ca-certificates/utmn-dev.crt

# Обновить CA сертификаты
sudo update-ca-certificates
```

**Проверка:**
```bash
ls -la /usr/local/share/ca-certificates/
```

**Удаление:**
```bash
sudo rm /usr/local/share/ca-certificates/utmn-dev.crt
sudo update-ca-certificates --fresh
```

### Windows

**Через certutil (командная строка от администратора):**

```cmd
certutil -addstore -f "ROOT" certs\server.crt
```

**Через GUI:**

1. Открыть `certs\server.crt` двойным кликом
2. Нажать "Install Certificate..."
3. Выбрать "Local Machine"
4. "Place all certificates in the following store"
5. Выбрать "Trusted Root Certification Authorities"
6. Нажать "Finish"

**Проверка:**
```cmd
certutil -store "ROOT" | findstr "localhost"
```

**Удаление:**
```cmd
certutil -delstore "ROOT" "localhost"
```

### Firefox (отдельно)

Firefox использует собственное хранилище сертификатов:

1. Открыть `about:preferences#privacy`
2. Прокрутить до "Certificates"
3. Нажать "View Certificates"
4. Вкладка "Authorities"
5. "Import..." → выбрать `certs/server.crt`
6. Отметить "Trust this CA to identify websites"

---

## 🚀 Запуск с HTTPS

### Автоматический запуск

**Linux/Mac:**
```bash
./start-https.sh
```

**Windows:**
```cmd
start-https.bat
```

### Ручной запуск

#### Backend HTTPS

**Вариант 1: Через отдельный файл**

```bash
cd backend
node src/server-https.js
```

**Вариант 2: Через переменную окружения**

```bash
cd backend

# Установить USE_HTTPS=true в .env
echo "USE_HTTPS=true" >> .env

# Запустить обычный сервер
npm run dev
```

#### Frontend HTTPS

**Через конфигурацию Vite:**

```bash
npm run dev -- --config vite.config.https.ts
```

**Или через обычную конфигурацию с HTTPS:**

Отредактировать `vite.config.ts`:

```typescript
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./certs/server.key'),
      cert: fs.readFileSync('./certs/server.crt')
    }
  }
});
```

Затем:
```bash
npm run dev
```

---

## 🌐 URL после запуска

| Сервис | HTTP | HTTPS |
|--------|------|-------|
| Frontend | http://localhost:5173 | https://localhost:5173 |
| Backend | http://localhost:3000 | https://localhost:3443 |
| Health Check | http://localhost:3000/health | https://localhost:3443/health |

---

## ⚙️ Настройка Backend

### server-https.js

Файл `/backend/src/server-https.js` уже содержит всю необходимую логику:

```javascript
const https = require('https');
const fs = require('fs');

// Загрузка сертификатов
const options = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};

// Запуск HTTPS сервера
https.createServer(options, app).listen(3443);
```

### .env конфигурация

```env
# HTTPS режим
USE_HTTPS=true
HTTPS_PORT=3443

# Редирект HTTP → HTTPS (опционально)
HTTP_REDIRECT=true

# CORS для HTTPS
CORS_ORIGIN=https://localhost:5173,http://localhost:5173
```

---

## ⚙️ Настройка Frontend

### vite.config.https.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./certs/server.key'),
      cert: fs.readFileSync('./certs/server.crt')
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3443',
        changeOrigin: true,
        secure: false // Для самоподписанных сертификатов
      }
    }
  }
});
```

---

## 🐛 Решение проблем

### ❌ Браузер показывает "Not Secure"

**Причина:** Самоподписанный сертификат не установлен в систему

**Решение:**
1. Установите сертификат (см. раздел "Установка сертификатов")
2. Перезапустите браузер
3. Или нажмите "Advanced" → "Proceed to localhost"

### ❌ Error: ENOENT: no such file or directory, open 'certs/server.key'

**Причина:** Сертификаты не сгенерированы

**Решение:**
```bash
./scripts/generate-ssl-cert.sh  # Linux/Mac
scripts\generate-ssl-cert.bat   # Windows
```

### ❌ CORS Error при запросах к API

**Причина:** Backend не настроен для HTTPS origin

**Решение:**

В `backend/.env`:
```env
CORS_ORIGIN=https://localhost:5173,http://localhost:5173
```

Перезапустить backend.

### ❌ Mixed Content Error

**Причина:** Frontend на HTTPS, Backend на HTTP (или наоборот)

**Решение:**
- Либо оба на HTTP
- Либо оба на HTTPS

Рекомендуется: оба на HTTPS

### ❌ Error: OpenSSL не найден (Windows)

**Причина:** OpenSSL не установлен или не в PATH

**Решение:**

1. **Использовать Git Bash** (содержит OpenSSL):
   ```bash
   "C:\Program Files\Git\bin\bash.exe" scripts/generate-ssl-cert.sh
   ```

2. **Установить OpenSSL:**
   - Скачать: https://slproweb.com/products/Win32OpenSSL.html
   - Или: `choco install openssl`

3. **Использовать mkcert** (проще):
   ```bash
   choco install mkcert
   mkcert localhost
   ```

### ❌ Сертификат истек

**Причина:** Прошло 365 дней с момента генерации

**Решение:**

Сгенерировать новые сертификаты:
```bash
./scripts/generate-ssl-cert.sh
```

Переустановить в систему.

---

## 📚 Дополнительная информация

### Зачем нужен HTTPS в разработке?

1. **Тестирование PWA** - Service Workers требуют HTTPS
2. **Geolocation API** - Современные браузеры требуют HTTPS
3. **Камера/Микрофон** - getUserMedia работает только на HTTPS
4. **HTTP/2** - Тестирование HTTP/2 возможностей
5. **Cookies Secure** - Тестирование secure cookies
6. **SSO интеграция** - Многие SSO требуют HTTPS callback
7. **Production-like** - Окружение близкое к production

### Самоподписанные vs CA сертификаты

| Характеристика | Самоподписанные | CA сертификаты |
|----------------|-----------------|----------------|
| Стоимость | Бесплатно | Платно/Let's Encrypt |
| Доверие браузера | ❌ Нужна установка | ✅ Автоматически |
| Время создания | Секунды | Минуты-часы |
| Использование | Только разработка | Production |
| Срок действия | Любой | 90 дней (Let's Encrypt) |

### Безопасность

⚠️ **ВАЖНО:**

- Самоподписанные сертификаты **ТОЛЬКО для разработки**
- **НЕ** используйте их в production
- **НЕ** коммитьте приватные ключи в Git
- **НЕ** передавайте ключи третьим лицам

В production используйте:
- Let's Encrypt (бесплатно)
- Платные CA сертификаты
- Сертификаты от вашего хостинг-провайдера

### Срок действия сертификата

По умолчанию: **365 дней**

Изменить при генерации:
```bash
# В скрипте изменить DAYS=365
DAYS=730  # 2 года

# Или вручную
openssl x509 -req -days 730 ...
```

### Проверка сертификата

```bash
# Информация о сертификате
openssl x509 -in certs/server.crt -text -noout

# Срок действия
openssl x509 -in certs/server.crt -noout -dates

# Subject Alternative Names
openssl x509 -in certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"

# Проверка приватного ключа
openssl rsa -in certs/server.key -check

# Проверка совпадения ключа и сертификата
openssl x509 -in certs/server.crt -noout -modulus | openssl md5
openssl rsa -in certs/server.key -noout -modulus | openssl md5
# MD5 должны совпадать
```

---

## 🎯 Чеклист

### Перед запуском HTTPS

- [ ] OpenSSL установлен (или mkcert)
- [ ] Сертификаты сгенерированы (`ls certs/`)
- [ ] Backend настроен (`USE_HTTPS=true`)
- [ ] Frontend настроен (vite.config.https.ts)
- [ ] CORS настроен для HTTPS
- [ ] (Опционально) Сертификат установлен в систему

### После запуска

- [ ] Backend работает на https://localhost:3443
- [ ] Frontend работает на https://localhost:5173
- [ ] Health check доступен: https://localhost:3443/health
- [ ] Браузер не показывает ошибок (если сертификат установлен)
- [ ] API запросы проходят успешно

---

## 📞 Помощь

### Полезные команды

```bash
# Проверить порты
netstat -an | grep LISTEN | grep -E "3443|5173"

# Убить процесс на порту (если занят)
# Linux/Mac
lsof -ti:3443 | xargs kill -9

# Windows
netstat -ano | findstr :3443
taskkill /PID <PID> /F
```

### Логи

**Backend:**
- Консоль где запущен `node src/server-https.js`
- Должно быть: `🔐 HTTPS сервер запущен`

**Frontend:**
- Консоль где запущен `npm run dev`
- Консоль браузера (F12)

---

## 🔗 Ссылки

- [OpenSSL Docs](https://www.openssl.org/docs/)
- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Let's Encrypt](https://letsencrypt.org/)
- [MDN: How to create a self-signed certificate](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security#how_to_set_up_a_server)

---

**Версия:** 1.0  
**Дата:** 20.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
