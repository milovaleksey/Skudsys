# 🚀 Руководство по развертыванию системы безопасности ТюмГУ

## 📋 Содержание

1. [Требования](#требования)
2. [Быстрое развертывание](#быстрое-развертывание)
3. [Ручная установка](#ручная-установка)
4. [Настройка для локальной разработки](#настройка-для-локальной-разработки)
5. [Доступ из сети](#доступ-из-сети)
6. [Управление сервисом](#управление-сервисом)
7. [Решение проблем](#решение-проблем)

---

## 📦 Требования

### Операционная система
- Debian 11/12 или Ubuntu 20.04/22.04/24.04
- 2+ CPU cores
- 4+ GB RAM
- 20+ GB свободного места

### Программное обеспечение
- Node.js 20.x
- MySQL 8.0+
- Nginx 1.18+
- Git (опционально)

---

## ⚡ Быстрое развертывание

### Автоматическая установка (рекомендуется)

```bash
# 1. Скачайте проект
git clone <repository-url>
cd utmn-security

# 2. Сделайте скрипт исполняемым
chmod +x deploy-quick.sh

# 3. Запустите установку
sudo ./deploy-quick.sh
```

Скрипт автоматически:
- ✅ Проверит все зависимости
- ✅ Создаст базу данных MySQL
- ✅ Настроит backend с безопасными параметрами
- ✅ Соберет frontend для production
- ✅ Настроит Nginx для HTTP доступа
- ✅ Создаст systemd сервис для автозапуска
- ✅ Настроит права доступа

### Доступ к системе

После успешной установки:

```
🌐 URL: http://<IP-адрес-сервера>

👤 Тестовый администратор:
   Логин:  admin_security
   Пароль: test123
```

**⚠️ ВАЖНО:** Смените пароль администратора после первого входа!

---

## 🔧 Ручная установка

### 1. Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка базовых пакетов
sudo apt install -y curl wget git unzip

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Установка MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Установка Nginx
sudo apt install -y nginx
```

### 2. Настройка MySQL

```bash
# Войдите в MySQL
sudo mysql -u root -p

# Создайте базу данных и пользователя
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'utmn_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Импортируйте схему
mysql -u utmn_user -p utmn_security < database/schema.sql
```

### 3. Настройка Backend

```bash
cd backend

# Установите зависимости
npm install --production

# Создайте .env файл
cp .env.example .env
nano .env

# Отредактируйте параметры:
# - DB_USER, DB_PASSWORD (параметры MySQL)
# - JWT_SECRET (сгенерируйте: openssl rand -base64 32)
# - CORS_ORIGIN (IP-адрес сервера)

# Запустите backend
node src/server.js
```

### 4. Сборка Frontend

```bash
cd ..

# Установите зависимости
npm install

# Соберите production версию
npm run build

# Файлы будут в папке dist/
```

### 5. Настройка Nginx

```bash
# Создайте конфигурацию
sudo nano /etc/nginx/sites-available/utmn-security

# Вставьте содержимое из файла nginx.conf

# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

### 6. Настройка systemd

```bash
# Создайте сервис
sudo nano /etc/systemd/system/utmn-security.service

# Вставьте содержимое из systemd/utmn-security.service

# Запустите сервис
sudo systemctl daemon-reload
sudo systemctl enable utmn-security
sudo systemctl start utmn-security

# Проверьте статус
sudo systemctl status utmn-security
```

---

## 💻 Настройка для локальной разработки

### Development режим (без сборки)

```bash
# 1. Установите зависимости
npm install
cd backend && npm install && cd ..

# 2. Запустите MySQL и создайте базу данных
# (см. раздел "Настройка MySQL")

# 3. Настройте backend/.env
cd backend
cp .env.example .env
# Отредактируйте .env

# 4. Запустите backend
npm run dev
# или
node src/server.js

# 5. В другом терминале запустите frontend
cd ..
npm run dev
```

Frontend будет доступен на `http://localhost:5173`  
Backend API на `http://localhost:3000`

### Доступ из локальной сети

Vite уже настроен на прослушивание всех интерфейсов (`host: '0.0.0.0'`).

```bash
# Запустите frontend
npm run dev

# Приложение будет доступно по:
# - http://localhost:5173 (локально)
# - http://<IP-адрес>:5173 (из сети)
```

---

## 🌐 Доступ из сети

### Настройка файрвола (UFW)

```bash
# Разрешите HTTP и SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # Если планируете HTTPS

# Включите файрвол
sudo ufw enable

# Проверьте статус
sudo ufw status
```

### Узнать IP-адрес сервера

```bash
# Локальный IP
hostname -I | awk '{print $1}'

# Внешний IP (если сервер в интернете)
curl ifconfig.me
```

### Настройка CORS для внешнего доступа

Если фронтенд и бэкенд на разных серверах, обновите `backend/.env`:

```env
CORS_ORIGIN=http://192.168.1.100,http://example.com
```

---

## 🎮 Управление сервисом

### Systemd команды

```bash
# Статус
sudo systemctl status utmn-security

# Запуск
sudo systemctl start utmn-security

# Остановка
sudo systemctl stop utmn-security

# Перезапуск
sudo systemctl restart utmn-security

# Включить автозапуск
sudo systemctl enable utmn-security

# Отключить автозапуск
sudo systemctl disable utmn-security

# Просмотр логов
sudo journalctl -u utmn-security -f
```

### Nginx команды

```bash
# Статус
sudo systemctl status nginx

# Перезагрузка конфигурации
sudo systemctl reload nginx

# Перезапуск
sudo systemctl restart nginx

# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/utmn-security-*.log
```

### MySQL команды

```bash
# Вход в MySQL
mysql -u utmn_user -p utmn_security

# Статус
sudo systemctl status mysql

# Перезапуск
sudo systemctl restart mysql

# Резервное копирование
mysqldump -u utmn_user -p utmn_security > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u utmn_user -p utmn_security < backup_20260125.sql
```

---

## 🔧 Решение проблем

### Backend не запускается

```bash
# Проверьте логи
sudo journalctl -u utmn-security -n 50

# Проверьте порт 3000
sudo netstat -tulpn | grep 3000

# Проверьте .env файл
cat /var/www/utmn-security/backend/.env

# Проверьте подключение к MySQL
mysql -u utmn_user -p utmn_security -e "SELECT 1;"
```

### Frontend не загружается

```bash
# Проверьте логи Nginx
sudo tail -f /var/log/nginx/utmn-security-error.log

# Проверьте файлы
ls -la /var/www/utmn-security/dist/

# Проверьте права
sudo chown -R www-data:www-data /var/www/utmn-security/
```

### API запросы не работают

```bash
# Проверьте health endpoint
curl http://localhost:3000/health

# Проверьте через Nginx
curl http://localhost/health

# Проверьте CORS в backend/.env
cat /var/www/utmn-security/backend/.env | grep CORS
```

### Ошибка подключения к базе данных

```bash
# Проверьте, что MySQL запущен
sudo systemctl status mysql

# Проверьте пароль и права
mysql -u utmn_user -p

# Проверьте параметры в .env
cat /var/www/utmn-security/backend/.env | grep DB_
```

### Не могу подключиться из сети

```bash
# Проверьте файрвол
sudo ufw status

# Проверьте, что Nginx слушает на всех интерфейсах
sudo netstat -tulpn | grep :80

# Проверьте локальный доступ
curl http://localhost/

# Проверьте IP-адрес
hostname -I
```

---

## 📝 Дополнительная информация

### Структура проекта после установки

```
/var/www/utmn-security/
├── backend/
│   ├── src/
│   ├── .env              # Конфигурация backend
│   └── package.json
├── dist/                 # Собранный frontend
│   ├── index.html
│   └── assets/
└── database/
    └── schema.sql
```

### Порты

- **80** - Nginx (HTTP)
- **3000** - Backend API (внутренний)
- **3306** - MySQL (внутренний)
- **5173** - Vite dev server (только development)

### Логи

- **Backend:** `journalctl -u utmn-security -f`
- **Nginx Access:** `/var/log/nginx/utmn-security-access.log`
- **Nginx Error:** `/var/log/nginx/utmn-security-error.log`
- **MySQL:** `/var/log/mysql/error.log`

---

## 🔒 Безопасность

### Рекомендации

1. **Смените пароль администратора** после первого входа
2. **Создайте резервную копию** базы данных регулярно
3. **Настройте HTTPS** для production (используйте Let's Encrypt)
4. **Ограничьте доступ** к MySQL только localhost
5. **Обновляйте систему** регулярно
6. **Мониторьте логи** на подозрительную активность

### Настройка HTTPS (опционально)

```bash
# Установите Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получите сертификат
sudo certbot --nginx -d your-domain.com

# Автообновление сертификатов
sudo certbot renew --dry-run
```

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте раздел "Решение проблем"
2. Изучите логи системы
3. Создайте issue в репозитории проекта

---

**Версия документации:** 2.0  
**Дата:** 25.01.2026  
**Фирменный цвет ТюмГУ:** #00aeef
