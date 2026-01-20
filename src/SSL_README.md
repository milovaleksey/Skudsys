# 🔐 SSL сертификаты для разработки

## ⚡ Быстрый старт

### 1️⃣ Генерация сертификатов

**Linux/Mac:**
```bash
chmod +x scripts/generate-ssl-cert.sh
./scripts/generate-ssl-cert.sh
```

**Windows:**
```cmd
scripts\generate-ssl-cert.bat
```

### 2️⃣ Запуск с HTTPS

**Linux/Mac:**
```bash
chmod +x start-https.sh
./start-https.sh
```

**Windows:**
```cmd
start-https.bat
```

### 3️⃣ Открыть браузер

```
https://localhost:5173
```

**Тестовый вход:**
- Логин: `admin_security`
- Пароль: `test123`

---

## 📋 Что создается

```
certs/
├── server.key      # Приватный ключ (2048 бит RSA)
├── server.crt      # Самоподписанный сертификат (365 дней)
├── server.pem      # Комбинация ключа и сертификата
├── server.csr      # Certificate Signing Request
└── san.cnf         # Конфигурация SAN
```

**Параметры сертификата:**
- Домен: `localhost`
- SAN: `localhost`, `127.0.0.1`, `::1`
- Срок действия: 365 дней
- Алгоритм: RSA 2048
- Организация: TyumGU Security Department

---

## 🔒 Установка сертификата (опционально)

Для того чтобы браузер не показывал предупреждение:

### macOS
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/server.crt
```

### Linux
```bash
sudo cp certs/server.crt /usr/local/share/ca-certificates/utmn-dev.crt
sudo update-ca-certificates
```

### Windows (от администратора)
```cmd
certutil -addstore -f "ROOT" certs\server.crt
```

**После установки:** Перезапустите браузер!

---

## 🌐 URL сервисов

| Сервис | HTTP | HTTPS |
|--------|------|-------|
| Frontend | http://localhost:5173 | **https://localhost:5173** |
| Backend | http://localhost:3000 | **https://localhost:3443** |
| Health | http://localhost:3000/health | **https://localhost:3443/health** |

---

## ⚙️ Ручная настройка

### Backend

**Файл:** `backend/.env`
```env
USE_HTTPS=true
HTTPS_PORT=3443
CORS_ORIGIN=https://localhost:5173
```

**Запуск:**
```bash
cd backend
node src/server-https.js
```

### Frontend

**Запуск:**
```bash
npm run dev -- --config vite.config.https.ts
```

---

## 🐛 Решение проблем

### ❌ "Not Secure" в браузере

**Решение:** Нажмите "Advanced" → "Proceed to localhost"

Или установите сертификат в систему (см. выше).

### ❌ Сертификаты не найдены

**Решение:** Сгенерируйте сертификаты:
```bash
./scripts/generate-ssl-cert.sh  # Linux/Mac
scripts\generate-ssl-cert.bat   # Windows
```

### ❌ OpenSSL не найден (Windows)

**Вариант 1:** Используйте Git Bash:
```bash
"C:\Program Files\Git\bin\bash.exe" scripts/generate-ssl-cert.sh
```

**Вариант 2:** Установите OpenSSL:
- https://slproweb.com/products/Win32OpenSSL.html
- Или: `choco install openssl`

### ❌ CORS ошибки

В `backend/.env` должно быть:
```env
CORS_ORIGIN=https://localhost:5173,http://localhost:5173
```

---

## ⚠️ Важно!

- ✅ Сертификаты **ТОЛЬКО для разработки**
- ❌ **НЕ** использовать в production
- ❌ **НЕ** коммитить `*.key` файлы в Git
- ✅ Для production используйте Let's Encrypt или платные CA

---

## 📚 Документация

- **Подробное руководство:** [SSL_GUIDE.md](SSL_GUIDE.md)
- **Структура проекта:** [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
- **Быстрый старт:** [QUICK_START.md](QUICK_START.md)

---

## 🎯 Зачем HTTPS в разработке?

- ✅ Тестирование PWA (Service Workers)
- ✅ Geolocation API
- ✅ WebRTC (камера/микрофон)
- ✅ HTTP/2 возможности
- ✅ Secure Cookies
- ✅ SSO интеграция
- ✅ Production-like окружение

---

## 🔄 Переключение HTTP ↔ HTTPS

### На HTTP (обычный режим)
```bash
./start.sh  # или npm run dev
```

### На HTTPS (безопасный режим)
```bash
./start-https.sh
```

---

## 📞 Проверка работы

### Backend HTTPS
```bash
curl -k https://localhost:3443/health
```

Ответ:
```json
{
  "success": true,
  "message": "API работает",
  "https": true
}
```

### Frontend HTTPS
Откройте: https://localhost:5173

---

## 🔑 Генерация новых сертификатов

```bash
# Удалить старые
rm -rf certs/

# Создать новые
./scripts/generate-ssl-cert.sh

# Переустановить в систему (если установлены)
# macOS
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/server.crt

# Linux
sudo cp certs/server.crt /usr/local/share/ca-certificates/utmn-dev.crt
sudo update-ca-certificates

# Windows
certutil -addstore -f "ROOT" certs\server.crt
```

---

## ✅ Готово!

Система настроена для работы с HTTPS!

**Версия:** 1.0  
**Дата:** 20.01.2026
