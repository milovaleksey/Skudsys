# 🌐 Руководство по настройке Nginx

## 📋 Содержание

1. [Быстрая установка](#-быстрая-установка)
2. [Ручная настройка](#-ручная-настройка)
3. [Решение проблем](#-решение-проблем)
4. [Управление Nginx](#-управление-nginx)

---

## 🚀 Быстрая установка

### Автоматическая установка (рекомендуется)

```bash
# 1. Сгенерировать сертификаты (если еще не создали)
./scripts/generate-ssl-cert.sh

# 2. Установить Nginx и сертификаты
sudo ./scripts/setup-nginx.sh
```

Скрипт автоматически:
- ✅ Установит сертификаты в `/etc/ssl/`
- ✅ Установит Nginx (если нужно)
- ✅ Скопирует конфигурации
- ✅ Проверит и перезапустит Nginx

---

## 🔧 Ручная настройка

### Шаг 1: Установка Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
```

**macOS:**
```bash
brew install nginx
```

### Шаг 2: Копирование сертификатов

```bash
# Создать директории
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# Скопировать сертификаты
sudo cp certs/server.crt /etc/ssl/certs/utmn-security.crt
sudo cp certs/server.key /etc/ssl/private/utmn-security.key

# Установить права
sudo chmod 644 /etc/ssl/certs/utmn-security.crt
sudo chmod 600 /etc/ssl/private/utmn-security.key
sudo chown root:root /etc/ssl/certs/utmn-security.crt
sudo chown root:root /etc/ssl/private/utmn-security.key
```

### Шаг 3: Копирование конфигурации

**Для разработки (HTTP):**
```bash
sudo cp nginx/utmn-security-dev.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/utmn-security-dev.conf /etc/nginx/sites-enabled/
```

**Для production (HTTPS):**
```bash
sudo cp nginx/utmn-security.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/utmn-security.conf /etc/nginx/sites-enabled/
```

**macOS (Homebrew):**
```bash
sudo cp nginx/utmn-security.conf /usr/local/etc/nginx/servers/
```

### Шаг 4: Удаление конфликтующих конфигураций

```bash
# Отключить default конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Или переименовать
sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.disabled
```

### Шаг 5: Проверка конфигурации

```bash
sudo nginx -t
```

**Ожидаемый вывод:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Шаг 6: Перезапуск Nginx

**Ubuntu/Debian/CentOS:**
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

**macOS:**
```bash
brew services restart nginx
brew services list
```

---

## 🔍 Проверка работы

### Backend через Nginx

```bash
# HTTP
curl http://localhost/health

# HTTPS
curl -k https://localhost/health
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "API работает"
}
```

### Frontend через Nginx

Откройте браузер:
- HTTP: http://localhost
- HTTPS: https://localhost

---

## 📁 Структура файлов

### Linux (Ubuntu/Debian)

```
/etc/nginx/
├── nginx.conf                          # Главная конфигурация
├── sites-available/
│   ├── utmn-security.conf             # Production (HTTPS)
│   └── utmn-security-dev.conf         # Development (HTTP)
├── sites-enabled/
│   └── utmn-security.conf -> ../sites-available/utmn-security.conf
└── ...

/etc/ssl/
├── certs/
│   └── utmn-security.crt              # Публичный сертификат
└── private/
    └── utmn-security.key              # Приватный ключ (600)

/var/log/nginx/
├── utmn-security-access.log           # Логи доступа
└── utmn-security-error.log            # Логи ошибок
```

### macOS (Homebrew)

```
/usr/local/etc/nginx/
├── nginx.conf
└── servers/
    └── utmn-security.conf

/usr/local/var/log/nginx/
├── utmn-security-access.log
└── utmn-security-error.log
```

---

## ⚙️ Конфигурация Nginx

### Основные блоки

#### 1. Редирект HTTP → HTTPS

```nginx
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}
```

#### 2. HTTPS сервер

```nginx
server {
    listen 443 ssl http2;
    server_name localhost;
    
    ssl_certificate /etc/ssl/certs/utmn-security.crt;
    ssl_certificate_key /etc/ssl/private/utmn-security.key;
    
    # ... остальная конфигурация
}
```

#### 3. Проксирование Frontend

```nginx
location / {
    # Development: проксирование к Vite
    proxy_pass http://localhost:5173;
    
    # Production: статические файлы
    # root /var/www/utmn-security/frontend/dist;
    # try_files $uri $uri/ /index.html;
}
```

#### 4. Проксирование Backend API

```nginx
location /v1/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 🐛 Решение проблем

### ❌ Error: cannot load certificate

**Ошибка:**
```
cannot load certificate "/etc/ssl/certs/utmn-security.crt": 
BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory)
```

**Причина:** Сертификат не найден в указанном месте

**Решение:**

1. Проверьте существование файла:
```bash
ls -la /etc/ssl/certs/utmn-security.crt
ls -la /etc/ssl/private/utmn-security.key
```

2. Если файлы отсутствуют:
```bash
# Сгенерировать сертификаты
./scripts/generate-ssl-cert.sh

# Скопировать в нужное место
sudo cp certs/server.crt /etc/ssl/certs/utmn-security.crt
sudo cp certs/server.key /etc/ssl/private/utmn-security.key
```

3. Проверьте права доступа:
```bash
sudo chmod 644 /etc/ssl/certs/utmn-security.crt
sudo chmod 600 /etc/ssl/private/utmn-security.key
```

### ❌ nginx: configuration file test failed

**Причина:** Ошибка в конфигурации

**Решение:**

1. Посмотрите подробности ошибки:
```bash
sudo nginx -t
```

2. Проверьте синтаксис:
```bash
sudo nginx -T | grep -i error
```

3. Проверьте логи:
```bash
sudo tail -f /var/log/nginx/error.log
```

### ❌ Address already in use (порт 80/443 занят)

**Причина:** Другой процесс использует порт

**Решение:**

1. Найти процесс:
```bash
# Linux
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# macOS
sudo lsof -i :80
sudo lsof -i :443
```

2. Остановить конфликтующий сервис:
```bash
# Если это Apache
sudo systemctl stop apache2

# Или изменить порт в nginx конфигурации
listen 8080;  # вместо 80
listen 8443 ssl;  # вместо 443
```

### ❌ 502 Bad Gateway

**Причина:** Backend не запущен или недоступен

**Решение:**

1. Проверьте Backend:
```bash
curl http://localhost:3000/health
```

2. Если не отвечает, запустите Backend:
```bash
cd backend
npm run dev
```

3. Проверьте логи Nginx:
```bash
sudo tail -f /var/log/nginx/utmn-security-error.log
```

### ❌ 504 Gateway Timeout

**Причина:** Backend слишком долго отвечает

**Решение:**

Увеличьте таймауты в конфигурации:

```nginx
location /v1/ {
    proxy_pass http://localhost:3000;
    
    # Увеличенные таймауты
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}
```

### ❌ Permission denied (доступ запрещен)

**Причина:** Nginx не имеет прав на файлы

**Решение:**

1. Проверьте пользователя Nginx:
```bash
ps aux | grep nginx
```

2. Проверьте права на файлы:
```bash
# Сертификаты
sudo ls -la /etc/ssl/certs/utmn-security.crt
sudo ls -la /etc/ssl/private/utmn-security.key

# Должно быть:
# -rw-r--r-- root root utmn-security.crt
# -rw------- root root utmn-security.key
```

3. Исправьте права:
```bash
sudo chown root:root /etc/ssl/certs/utmn-security.crt
sudo chown root:root /etc/ssl/private/utmn-security.key
sudo chmod 644 /etc/ssl/certs/utmn-security.crt
sudo chmod 600 /etc/ssl/private/utmn-security.key
```

---

## 🎛️ Управление Nginx

### Основные команды

**Linux (systemd):**
```bash
# Запуск
sudo systemctl start nginx

# Остановка
sudo systemctl stop nginx

# Перезапуск
sudo systemctl restart nginx

# Перезагрузка конфигурации (без остановки)
sudo systemctl reload nginx

# Статус
sudo systemctl status nginx

# Автозапуск
sudo systemctl enable nginx

# Отключить автозапуск
sudo systemctl disable nginx
```

**macOS (Homebrew):**
```bash
# Запуск
brew services start nginx

# Остановка
brew services stop nginx

# Перезапуск
brew services restart nginx

# Список сервисов
brew services list
```

**Проверка конфигурации:**
```bash
# Проверить синтаксис
sudo nginx -t

# Показать всю конфигурацию
sudo nginx -T

# Версия
nginx -v

# Подробная информация
nginx -V
```

### Логи

**Просмотр логов:**
```bash
# Логи доступа
sudo tail -f /var/log/nginx/utmn-security-access.log

# Логи ошибок
sudo tail -f /var/log/nginx/utmn-security-error.log

# Все логи Nginx
sudo tail -f /var/log/nginx/*.log

# Последние 100 строк
sudo tail -n 100 /var/log/nginx/utmn-security-error.log
```

**Очистка логов:**
```bash
sudo truncate -s 0 /var/log/nginx/*.log
```

---

## 🌐 Переключение режимов

### Development → Production

```bash
# 1. Отключить dev конфигурацию
sudo rm /etc/nginx/sites-enabled/utmn-security-dev.conf

# 2. Включить production конфигурацию
sudo ln -s /etc/nginx/sites-available/utmn-security.conf /etc/nginx/sites-enabled/

# 3. Проверить
sudo nginx -t

# 4. Перезапустить
sudo systemctl reload nginx
```

### Production → Development

```bash
# 1. Отключить production конфигурацию
sudo rm /etc/nginx/sites-enabled/utmn-security.conf

# 2. Включить dev конфигурацию
sudo ln -s /etc/nginx/sites-available/utmn-security-dev.conf /etc/nginx/sites-enabled/

# 3. Проверить
sudo nginx -t

# 4. Перезапустить
sudo systemctl reload nginx
```

---

## 📊 Мониторинг

### Статистика в реальном времени

```bash
# Активные подключения
watch -n 1 'ps aux | grep nginx | wc -l'

# Размер логов
watch -n 1 'du -sh /var/log/nginx/'

# Последние запросы
tail -f /var/log/nginx/utmn-security-access.log | grep -v "health"
```

### Анализ логов

```bash
# Топ IP адресов
cat /var/log/nginx/utmn-security-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Топ URL
cat /var/log/nginx/utmn-security-access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -20

# Коды ответов
cat /var/log/nginx/utmn-security-access.log | awk '{print $9}' | sort | uniq -c | sort -rn

# Ошибки 5xx
cat /var/log/nginx/utmn-security-access.log | awk '$9 ~ /^5/ {print $0}'
```

---

## 🔐 Безопасность

### Рекомендации

1. **Обновляйте Nginx:**
```bash
sudo apt update && sudo apt upgrade nginx
```

2. **Используйте firewall:**
```bash
# Ubuntu (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

3. **Скрывайте версию Nginx:**

В `/etc/nginx/nginx.conf`:
```nginx
http {
    server_tokens off;
}
```

4. **Rate limiting:**

```nginx
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;
}

server {
    location /v1/ {
        limit_req zone=mylimit burst=20;
        proxy_pass http://localhost:3000;
    }
}
```

---

## 🚀 Production развертывание

### С Let's Encrypt (бесплатный SSL)

```bash
# 1. Установить certbot
sudo apt install certbot python3-certbot-nginx

# 2. Получить сертификат
sudo certbot --nginx -d your-domain.com

# 3. Автообновление
sudo certbot renew --dry-run
```

### Обновление конфигурации для Let's Encrypt

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # Let's Encrypt сертификаты
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... остальная конфигурация
}
```

---

## 📚 Полезные ссылки

- [Официальная документация Nginx](https://nginx.org/ru/docs/)
- [Nginx Security Best Practices](https://www.nginx.com/blog/nginx-security-best-practices/)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

---

**Версия:** 1.0  
**Дата:** 20.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
