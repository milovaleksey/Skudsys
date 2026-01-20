# 🔧 Исправление ошибки: cannot load certificate

## ❌ Ваша ошибка

```
cannot load certificate "/etc/ssl/certs/utmn-security.crt": 
BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory)
nginx: configuration file /etc/nginx/nginx.conf test failed
```

## 🎯 Причина

Nginx не может найти SSL сертификат в `/etc/ssl/certs/utmn-security.crt`

---

## ✅ Быстрое решение (автоматически)

```bash
# 1. Сгенерировать сертификаты (если еще нет)
chmod +x scripts/generate-ssl-cert.sh
./scripts/generate-ssl-cert.sh

# 2. Установить сертификаты и настроить Nginx
chmod +x scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh
```

**Скрипт автоматически:**
- ✅ Скопирует сертификаты в `/etc/ssl/`
- ✅ Установит правильные права доступа
- ✅ Настроит Nginx конфигурацию
- ✅ Проверит и перезапустит Nginx

---

## 🔧 Ручное решение

### Шаг 1: Проверить сертификаты

```bash
# Проверить наличие в проекте
ls -la certs/

# Должно быть:
# server.key
# server.crt
```

**Если сертификаты отсутствуют:**

```bash
# Сгенерировать
chmod +x scripts/generate-ssl-cert.sh
./scripts/generate-ssl-cert.sh
```

### Шаг 2: Скопировать сертификаты

```bash
# Создать директории (если нужно)
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# Скопировать файлы
sudo cp certs/server.crt /etc/ssl/certs/utmn-security.crt
sudo cp certs/server.key /etc/ssl/private/utmn-security.key

# Установить правильные права
sudo chmod 644 /etc/ssl/certs/utmn-security.crt
sudo chmod 600 /etc/ssl/private/utmn-security.key
sudo chown root:root /etc/ssl/certs/utmn-security.crt
sudo chown root:root /etc/ssl/private/utmn-security.key
```

### Шаг 3: Проверить конфигурацию Nginx

```bash
# Проверить синтаксис
sudo nginx -t
```

**Ожидаемый вывод:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Шаг 4: Перезапустить Nginx

```bash
# Ubuntu/Debian/CentOS
sudo systemctl restart nginx
sudo systemctl status nginx

# macOS
brew services restart nginx
```

---

## 🔍 Проверка работы

### 1. Проверить сертификаты

```bash
# Проверить существование
ls -la /etc/ssl/certs/utmn-security.crt
ls -la /etc/ssl/private/utmn-security.key

# Проверить содержимое сертификата
openssl x509 -in /etc/ssl/certs/utmn-security.crt -text -noout | head -20

# Проверить приватный ключ
openssl rsa -in /etc/ssl/private/utmn-security.key -check
```

### 2. Проверить Nginx

```bash
# Статус
sudo systemctl status nginx

# Логи
sudo tail -f /var/log/nginx/error.log

# Тест конфигурации
sudo nginx -t
```

### 3. Проверить доступность

```bash
# HTTPS endpoint
curl -k https://localhost/health

# Или в браузере
# https://localhost
```

---

## 📋 Альтернативные пути

Если вы хотите использовать другие пути для сертификатов:

### Вариант 1: Изменить пути в Nginx конфигурации

Отредактируйте `/etc/nginx/sites-available/utmn-security.conf`:

```nginx
server {
    listen 443 ssl http2;
    
    # Изменить на ваши пути
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # ... остальная конфигурация
}
```

### Вариант 2: Использовать абсолютные пути проекта

```nginx
server {
    listen 443 ssl http2;
    
    # Пути в проекте
    ssl_certificate /home/user/utmn-security/certs/server.crt;
    ssl_certificate_key /home/user/utmn-security/certs/server.key;
    
    # ... остальная конфигурация
}
```

**Важно:** Nginx должен иметь права на чтение этих файлов!

```bash
# Установить права
sudo chmod 644 /path/to/server.crt
sudo chmod 600 /path/to/server.key

# Или изменить владельца
sudo chown www-data:www-data /path/to/server.crt
sudo chown www-data:www-data /path/to/server.key
```

---

## 🐛 Другие возможные ошибки

### Ошибка: Permission denied

```
nginx: [emerg] BIO_new_file("/etc/ssl/private/utmn-security.key") failed 
(SSL: error:0200100D:system library:fopen:Permission denied)
```

**Решение:**

```bash
# Проверить права
sudo ls -la /etc/ssl/private/utmn-security.key

# Должно быть: -rw------- root root

# Исправить
sudo chmod 600 /etc/ssl/private/utmn-security.key
sudo chown root:root /etc/ssl/private/utmn-security.key
```

### Ошибка: PEM routines:PEM_read_bio:no start line

```
nginx: [emerg] PEM_read_bio_X509_AUX("/etc/ssl/certs/utmn-security.crt") failed 
(SSL: error:0909006C:PEM routines:PEM_read_bio:no start line)
```

**Причина:** Файл сертификата поврежден или неправильного формата

**Решение:**

```bash
# Проверить содержимое
cat /etc/ssl/certs/utmn-security.crt

# Должно начинаться с:
# -----BEGIN CERTIFICATE-----
# И заканчиваться:
# -----END CERTIFICATE-----

# Если файл неправильный, пересоздайте сертификаты
./scripts/generate-ssl-cert.sh
sudo cp certs/server.crt /etc/ssl/certs/utmn-security.crt
```

---

## 📦 Быстрый чеклист

- [ ] Сертификаты сгенерированы: `ls certs/`
- [ ] Сертификаты скопированы: `ls /etc/ssl/certs/utmn-security.crt`
- [ ] Права доступа правильные: `ls -la /etc/ssl/private/utmn-security.key` (должно быть 600)
- [ ] Конфигурация Nginx корректна: `sudo nginx -t`
- [ ] Nginx запущен: `sudo systemctl status nginx`
- [ ] Порты доступны: `curl -k https://localhost/health`

---

## 💡 Полезные команды

```bash
# Найти все упоминания сертификатов в конфигурации
sudo grep -r "ssl_certificate" /etc/nginx/

# Проверить, какие файлы читает Nginx
sudo strace -e open,openat nginx -t 2>&1 | grep ssl

# Проверить права доступа всех SSL файлов
sudo find /etc/ssl/ -name "*utmn*" -ls

# Логи в реальном времени
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 Если ничего не помогает

### 1. Удалите Nginx конфигурацию

```bash
sudo rm /etc/nginx/sites-enabled/utmn-security*
sudo rm /etc/nginx/sites-available/utmn-security*
```

### 2. Запустите проект БЕЗ Nginx

```bash
# Используйте встроенный HTTPS сервер
./start-https.sh

# Или без SSL
./start.sh
```

### 3. Обратитесь к документации

- [NGINX_GUIDE.md](NGINX_GUIDE.md) - подробное руководство
- [SSL_GUIDE.md](SSL_GUIDE.md) - руководство по SSL

---

## ✅ Готово!

После выполнения шагов:

1. Проверьте: `sudo nginx -t`
2. Перезапустите: `sudo systemctl restart nginx`
3. Откройте: https://localhost

**Если проблема остается, пришлите:**
- Вывод `sudo nginx -t`
- Вывод `ls -la /etc/ssl/certs/utmn-security.crt`
- Содержимое `/etc/nginx/sites-enabled/`

---

**Дата:** 20.01.2026  
**Система безопасности ТюмГУ**
