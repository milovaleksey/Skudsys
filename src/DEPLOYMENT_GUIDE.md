# 🚀 Руководство по развертыванию на Production сервере

## 📋 Содержание

1. [Требования](#-требования)
2. [Подготовка сервера](#-подготовка-сервера)
3. [Автоматическая установка](#-автоматическая-установка)
4. [Ручная установка](#-ручная-установка)
5. [Настройка после установки](#-настройка-после-установки)
6. [Обслуживание](#-обслуживание)
7. [Обновление](#-обновление)
8. [Решение проблем](#-решение-проблем)

---

## ✅ Требования

### Сервер:
- **ОС:** Debian 11/12 или Ubuntu 20.04/22.04 LTS
- **RAM:** 2 GB минимум (рекомендуется 4 GB)
- **Диск:** 10 GB свободного места
- **CPU:** 1 ядро минимум (рекомендуется 2+)
- **Права:** root или sudo доступ

### Сеть:
- Открытые порты: 80 (HTTP), 443 (HTTPS - для будущего), 22 (SSH)
- Статический IP адрес (рекомендуется)
- Доменное имя (опционально)

---

## 🔧 Подготовка сервера

### Шаг 1: Подключение к серверу

```bash
ssh root@your-server-ip
# или
ssh your-username@your-server-ip
```

### Шаг 2: Обновление системы

```bash
# Обновить списки пакетов
apt update

# Обновить все пакеты
apt upgrade -y

# Установить базовые утилиты
apt install -y curl wget git unzip
```

### Шаг 3: Создание пользователя (если нужно)

```bash
# Создать пользователя deploy
adduser deploy

# Добавить в sudo группу
usermod -aG sudo deploy

# Переключиться на пользователя
su - deploy
```

---

## 🚀 Автоматическая установка

### Способ 1: Запуск из ZIP архива

```bash
# 1. Загрузить ZIP архив на сервер
scp utmn-security.zip root@your-server-ip:/root/

# 2. Подключиться к серверу
ssh root@your-server-ip

# 3. Распаковать архив
unzip utmn-security.zip
cd utmn-security

# 4. Запустить установку
chmod +x deploy.sh
sudo ./deploy.sh
```

### Способ 2: Клонирование из Git

```bash
# 1. Подключиться к серверу
ssh root@your-server-ip

# 2. Клонировать репозиторий
git clone <URL_репозитория>
cd utmn-security

# 3. Запустить установку
chmod +x deploy.sh
sudo ./deploy.sh
```

### Что делает скрипт deploy.sh?

✅ Устанавливает Node.js 20.x  
✅ Устанавливает MySQL Server  
✅ Устанавливает Nginx  
✅ Создает базу данных  
✅ Разворачивает приложение в `/var/www/utmn-security`  
✅ Устанавливает зависимости backend и frontend  
✅ Собирает frontend в production режиме  
✅ Настраивает Nginx для проксирования  
✅ Создает systemd сервис для автозапуска  
✅ Настраивает права доступа  
✅ Запускает приложение  

**Время установки:** 10-15 минут

---

## 🔨 Ручная установка

Если автоматическая установка не подходит:

### Шаг 1: Установка зависимостей

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# MySQL
apt install -y mysql-server

# Nginx
apt install -y nginx

# Проверка
node -v    # должно быть v20.x.x
npm -v
mysql --version
nginx -v
```

### Шаг 2: Настройка MySQL

```bash
# Запустить безопасную настройку
mysql_secure_installation

# Войти в MySQL
mysql -u root -p

# Создать БД
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Создать пользователя
CREATE USER 'utmn_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Шаг 3: Развертывание приложения

```bash
# Создать директорию
mkdir -p /var/www/utmn-security

# Распаковать архив
unzip utmn-security.zip -d /var/www/utmn-security

# Или клонировать
git clone <URL> /var/www/utmn-security
```

### Шаг 4: Настройка Backend

```bash
cd /var/www/utmn-security/backend

# Установить зависимости
npm install --production

# Создать .env
cp .env.production .env

# Отредактировать .env
nano .env
# Указать:
# - DB_PASSWORD
# - JWT_SECRET (генерировать: openssl rand -base64 32)
# - CORS_ORIGIN (IP вашего сервера)

# Инициализировать БД
node src/scripts/initDatabase.js
```

### Шаг 5: Сборка Frontend

```bash
cd /var/www/utmn-security

# Установить зависимости
npm install

# Собрать production версию
npm run build

# Проверить
ls -la dist/
```

### Шаг 6: Настройка Nginx

```bash
# Скопировать конфигурацию
cp nginx/production.conf /etc/nginx/sites-available/utmn-security

# Активировать
ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/

# Удалить default
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезапустить
systemctl restart nginx
```

### Шаг 7: Создание systemd сервиса

```bash
# Скопировать сервис
cp systemd/utmn-security.service /etc/systemd/system/

# Перезагрузить systemd
systemctl daemon-reload

# Запустить сервис
systemctl start utmn-security

# Добавить в автозагрузку
systemctl enable utmn-security

# Проверить статус
systemctl status utmn-security
```

### Шаг 8: Настройка прав доступа

```bash
# Установить владельца
chown -R www-data:www-data /var/www/utmn-security

# Установить права
find /var/www/utmn-security -type f -exec chmod 644 {} \;
find /var/www/utmn-security -type d -exec chmod 755 {} \;

# Защитить .env
chmod 600 /var/www/utmn-security/backend/.env
```

---

## ⚙️ Настройка после установки

### 1. Настройка Firewall (UFW)

```bash
# Установить UFW
apt install -y ufw

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP
ufw allow 80/tcp

# Разрешить HTTPS (для будущего)
ufw allow 443/tcp

# Включить
ufw enable

# Проверить
ufw status
```

### 2. Настройка автоматических обновлений

```bash
# Установить unattended-upgrades
apt install -y unattended-upgrades

# Включить автообновления безопасности
dpkg-reconfigure -plow unattended-upgrades
```

### 3. Настройка логирования

```bash
# Создать директорию для логов
mkdir -p /var/www/utmn-security/backend/logs

# Установить права
chown -R www-data:www-data /var/www/utmn-security/backend/logs

# Настроить ротацию логов
cat > /etc/logrotate.d/utmn-security << 'EOF'
/var/www/utmn-security/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload utmn-security
    endscript
}
EOF
```

### 4. Настройка мониторинга

```bash
# Установить htop для мониторинга
apt install -y htop

# Мониторинг в реальном времени
htop

# Проверка использования диска
df -h

# Проверка памяти
free -m
```

---

## 🔄 Обслуживание

### Управление сервисом

```bash
# Статус
systemctl status utmn-security

# Запуск
systemctl start utmn-security

# Остановка
systemctl stop utmn-security

# Перезапуск
systemctl restart utmn-security

# Перезагрузка конфигурации
systemctl reload utmn-security

# Просмотр логов
journalctl -u utmn-security -f

# Последние 100 строк
journalctl -u utmn-security -n 100
```

### Управление Nginx

```bash
# Статус
systemctl status nginx

# Проверка конфигурации
nginx -t

# Перезагрузка
systemctl reload nginx

# Перезапуск
systemctl restart nginx

# Логи
tail -f /var/log/nginx/utmn-security-access.log
tail -f /var/log/nginx/utmn-security-error.log
```

### Управление MySQL

```bash
# Статус
systemctl status mysql

# Подключение
mysql -u utmn_user -p utmn_security

# Резервная копия
mysqldump -u utmn_user -p utmn_security > backup_$(date +%Y%m%d).sql

# Восстановление
mysql -u utmn_user -p utmn_security < backup_20260120.sql
```

---

## 📦 Обновление приложения

### Способ 1: Через Git

```bash
# Перейти в директорию
cd /var/www/utmn-security

# Остановить сервис
systemctl stop utmn-security

# Обновить код
git pull origin main

# Обновить зависимости backend
cd backend
npm install --production

# Обновить зависимости frontend и пересобрать
cd ..
npm install
npm run build

# Запустить сервис
systemctl start utmn-security

# Перезагрузить Nginx
systemctl reload nginx
```

### Способ 2: Через ZIP архив

```bash
# Остановить сервис
systemctl stop utmn-security

# Создать резервную копию
cp -r /var/www/utmn-security /var/www/utmn-security.backup

# Сохранить .env
cp /var/www/utmn-security/backend/.env /tmp/

# Удалить старые файлы
rm -rf /var/www/utmn-security/*

# Распаковать новую версию
unzip utmn-security-new.zip -d /var/www/utmn-security

# Восстановить .env
cp /tmp/.env /var/www/utmn-security/backend/

# Установить зависимости
cd /var/www/utmn-security/backend
npm install --production

cd ..
npm install
npm run build

# Восстановить права
chown -R www-data:www-data /var/www/utmn-security

# Запустить
systemctl start utmn-security
systemctl reload nginx
```

---

## 🐛 Решение проблем

### Сервис не запускается

```bash
# Проверить логи
journalctl -u utmn-security -n 50

# Проверить статус
systemctl status utmn-security

# Запустить вручную для отладки
cd /var/www/utmn-security/backend
node src/server.js
```

### Nginx возвращает 502 Bad Gateway

**Причина:** Backend не работает

```bash
# Проверить backend
curl http://localhost:3000/health

# Проверить статус сервиса
systemctl status utmn-security

# Запустить сервис
systemctl start utmn-security
```

### Ошибка подключения к БД

```bash
# Проверить MySQL
systemctl status mysql

# Проверить доступность
mysql -u utmn_user -p utmn_security

# Проверить .env
cat /var/www/utmn-security/backend/.env | grep DB_
```

### Высокое использование памяти

```bash
# Проверить использование
free -m
htop

# Перезапустить сервис
systemctl restart utmn-security

# Проверить логи на утечки памяти
journalctl -u utmn-security | grep -i memory
```

### Проблемы с правами доступа

```bash
# Восстановить права
chown -R www-data:www-data /var/www/utmn-security
find /var/www/utmn-security -type f -exec chmod 644 {} \;
find /var/www/utmn-security -type d -exec chmod 755 {} \;
chmod 600 /var/www/utmn-security/backend/.env
```

---

## 📊 Мониторинг

### Проверка состояния системы

```bash
# CPU и память
htop

# Диск
df -h

# Сетевые подключения
netstat -tulpn | grep -E ':(80|3000|3306)'

# Логи в реальном времени
tail -f /var/log/nginx/utmn-security-access.log
journalctl -u utmn-security -f
```

### Проверка производительности

```bash
# Время ответа API
time curl http://localhost:3000/health

# Статистика Nginx
curl http://localhost/health

# Нагрузка на БД
mysql -u utmn_user -p -e "SHOW PROCESSLIST;" utmn_security
```

---

## 🔒 Безопасность

### Базовая защита

```bash
# Изменить пароль MySQL root
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NEW_STRONG_PASSWORD';

# Отключить вход root через SSH
nano /etc/ssh/sshd_config
# Установить: PermitRootLogin no
systemctl restart sshd

# Установить fail2ban
apt install -y fail2ban
systemctl enable fail2ban
```

### Резервное копирование

```bash
# Скрипт автоматического бэкапа
cat > /usr/local/bin/backup-utmn.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/utmn-security"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# База данных
mysqldump -u utmn_user -p'PASSWORD' utmn_security > $BACKUP_DIR/db_$DATE.sql

# Приложение
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/utmn-security

# Удалить старые бэкапы (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-utmn.sh

# Добавить в cron (ежедневно в 2:00)
crontab -e
# Добавить:
# 0 2 * * * /usr/local/bin/backup-utmn.sh
```

---

## 🎉 Готово!

Система установлена и готова к использованию.

**URL:** http://your-server-ip

**Тестовый вход:**
- Логин: `admin_security`
- Пароль: `AdminSecure2024!`

---

## 📚 Дополнительные материалы

- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Установка для разработки
- [COMMANDS_CHEATSHEET.md](COMMANDS_CHEATSHEET.md) - Шпаргалка команд
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API документация

---

**Версия:** 1.0  
**Дата:** 20.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
