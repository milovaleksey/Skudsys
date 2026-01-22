# Настройка системы для работы через HTTP за Reverse Proxy

Эта инструкция описывает как развернуть систему безопасности ТюмГУ на сервере Debian с Nginx в режиме HTTP, где SSL termination выполняется на внешнем reverse proxy.

## Архитектура

```
[Внешний Reverse Proxy (HTTPS)]
            ↓
[Nginx (HTTP)] ← Этот сервер
            ↓
   ┌────────┴────────┐
   ↓                 ↓
[Frontend]      [Backend API]
(Vite/React)    (Node.js:3000)
   :5173            ↓
                [MySQL:3306]
```

## 1. Подготовка сервера

### Установка зависимостей

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y nginx mysql-server nodejs npm git curl

# Установка Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node --version  # должно быть v18.x или выше
npm --version
nginx -v
mysql --version
```

## 2. Клонирование и настройка проекта

```bash
# Создание директории проекта
sudo mkdir -p /var/www/utmn-security
sudo chown -R $USER:$USER /var/www/utmn-security
cd /var/www/utmn-security

# Клонирование репозитория или распаковка архива
# git clone <your-repo-url> .
# или
# unzip utmn-security.zip -d .

# Установка зависимостей
npm install
cd backend && npm install && cd ..
```

## 3. Настройка MySQL

```bash
# Запуск MySQL secure installation
sudo mysql_secure_installation

# Создание базы данных и пользователя
sudo mysql -u root -p
```

В MySQL консоли:

```sql
-- Создание базы данных
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'utmn_admin'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Выдача прав
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_admin'@'localhost';
FLUSH PRIVILEGES;

-- Проверка
SHOW DATABASES;
SELECT User, Host FROM mysql.user;

EXIT;
```

### Импорт схемы базы данных

```bash
# Импорт схемы
mysql -u utmn_admin -p utmn_security < database/schema.sql

# Проверка импорта
mysql -u utmn_admin -p utmn_security -e "SHOW TABLES;"
```

## 4. Настройка Backend

```bash
cd /var/www/utmn-security/backend

# Создание конфигурационного файла
cp .env.example .env
nano .env
```

Настройте `.env` файл:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=utmn_admin
DB_PASSWORD=your_secure_password_here
DB_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_very_secure_refresh_token_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost
ALLOWED_HOSTS=localhost,utmn-security.local
```

### Создание администратора

```bash
# Генерация пароля
node scripts/generate-password.js

# Создание первого администратора
mysql -u utmn_admin -p utmn_security < scripts/create-admin.sql
```

## 5. Настройка Nginx (HTTP режим)

```bash
# Копирование конфигурации
sudo cp /var/www/utmn-security/nginx/utmn-security-http.conf /etc/nginx/sites-available/utmn-security

# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 6. Настройка Frontend

```bash
cd /var/www/utmn-security

# Создание файла конфигурации для production
cp .env.example .env.production

nano .env.production
```

Содержимое `.env.production`:

```env
# Backend API URL (для HTTP режима)
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
NODE_ENV=production
```

### Production build (после отладки)

```bash
# Сборка production версии
npm run build

# Обновите Nginx конфигурацию для использования статических файлов
# Раскомментируйте секцию "Для production" в /etc/nginx/sites-available/utmn-security
```

## 7. Запуск сервисов

### Вариант 1: Ручной запуск (для разработки/отладки)

```bash
# Terminal 1 - Backend
cd /var/www/utmn-security/backend
npm start

# Terminal 2 - Frontend (dev mode)
cd /var/www/utmn-security
npm run dev
```

### Вариант 2: Systemd сервисы (для production)

**Backend сервис:**

```bash
sudo nano /etc/systemd/system/utmn-backend.service
```

```ini
[Unit]
Description=UTMN Security Backend API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/utmn-security/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Запуск сервиса:**

```bash
sudo systemctl daemon-reload
sudo systemctl start utmn-backend
sudo systemctl enable utmn-backend
sudo systemctl status utmn-backend
```

## 8. Проверка работы системы

### Health Check

```bash
# Проверка backend
curl http://localhost:3000/health

# Проверка через Nginx
curl http://localhost/health

# Проверка API
curl http://localhost/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"your_password"}'
```

### Проверка логов

```bash
# Backend логи
journalctl -u utmn-backend -f

# Nginx логи
sudo tail -f /var/log/nginx/utmn-security-access.log
sudo tail -f /var/log/nginx/utmn-security-error.log
```

## 9. Настройка внешнего Reverse Proxy

Ваш внешний reverse proxy должен быть настроен следующим образом:

### Пример для Nginx (внешний)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://your-internal-server-ip:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Пример для Apache (внешний)

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    ProxyPreserveHost On
    ProxyPass / http://your-internal-server-ip:80/
    ProxyPassReverse / http://your-internal-server-ip:80/
    
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

## 10. Импорт данных

### Студенты

```bash
cd /var/www/utmn-security/database
# Подготовьте CSV файл students.csv
mysql -u utmn_admin -p utmn_security -e "LOAD DATA LOCAL INFILE 'students.csv' INTO TABLE students FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\\n' IGNORE 1 ROWS;"
```

### Сотрудники

```bash
mysql -u utmn_admin -p utmn_security -e "LOAD DATA LOCAL INFILE 'employees.csv' INTO TABLE employees FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\\n' IGNORE 1 ROWS;"
```

### Парковочные записи

```bash
mysql -u utmn_admin -p utmn_security -e "LOAD DATA LOCAL INFILE 'parking_records.csv' INTO TABLE parking_records FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\\n' IGNORE 1 ROWS;"
```

## 11. Безопасность

### Firewall настройки

```bash
# Установка UFW
sudo apt install ufw

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить HTTP (для reverse proxy)
sudo ufw allow 80/tcp

# Заблокировать прямой доступ к backend (опционально)
# sudo ufw deny 3000/tcp

# Включить firewall
sudo ufw enable
sudo ufw status
```

### Дополнительные меры

1. **Fail2ban для защиты от брутфорса:**

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

2. **Регулярные обновления:**

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

3. **Бэкапы базы данных:**

```bash
# Создание скрипта бэкапа
sudo nano /usr/local/bin/backup-utmn-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u utmn_admin -p'your_password' utmn_security > $BACKUP_DIR/utmn_security_$DATE.sql
gzip $BACKUP_DIR/utmn_security_$DATE.sql

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
chmod +x /usr/local/bin/backup-utmn-db.sh

# Добавление в cron (ежедневно в 2:00)
sudo crontab -e
# 0 2 * * * /usr/local/bin/backup-utmn-db.sh
```

## 12. Мониторинг

### Установка htop для мониторинга

```bash
sudo apt install htop
htop
```

### Мониторинг логов в реальном времени

```bash
# Создание скрипта для мониторинга
cat > ~/monitor-logs.sh << 'EOF'
#!/bin/bash
echo "=== Backend Logs ==="
journalctl -u utmn-backend -n 20
echo ""
echo "=== Nginx Access Logs ==="
tail -n 20 /var/log/nginx/utmn-security-access.log
echo ""
echo "=== Nginx Error Logs ==="
tail -n 20 /var/log/nginx/utmn-security-error.log
EOF

chmod +x ~/monitor-logs.sh
```

## Готовые команды для быстрого старта

```bash
# Статус всех сервисов
sudo systemctl status nginx utmn-backend mysql

# Перезапуск всех сервисов
sudo systemctl restart nginx utmn-backend mysql

# Просмотр логов
journalctl -u utmn-backend -f
sudo tail -f /var/log/nginx/utmn-security-error.log

# Проверка соединения с MySQL
mysql -u utmn_admin -p utmn_security -e "SELECT COUNT(*) FROM users;"

# Тест API
curl -X POST http://localhost/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### Backend не запускается

```bash
# Проверка логов
journalctl -u utmn-backend -n 50

# Проверка портов
sudo netstat -tulpn | grep 3000

# Проверка переменных окружения
sudo -u www-data env | grep NODE_ENV
```

### Nginx ошибки

```bash
# Проверка конфигурации
sudo nginx -t

# Проверка логов
sudo tail -f /var/log/nginx/error.log

# Проверка прав доступа
ls -la /var/www/utmn-security/
```

### MySQL проблемы

```bash
# Проверка статуса
sudo systemctl status mysql

# Проверка соединения
mysql -u utmn_admin -p -e "SHOW DATABASES;"

# Проверка прав
mysql -u root -p -e "SHOW GRANTS FOR 'utmn_admin'@'localhost';"
```

## Следующие шаги

После успешного развертывания:

1. ✅ Протестируйте авторизацию через веб-интерфейс
2. ✅ Импортируйте реальные данные студентов и сотрудников
3. ✅ Настройте права доступа для пользователей
4. ✅ Проверьте работу всех модулей (студенты, сотрудники, парковка)
5. ✅ Настройте регулярные бэкапы
6. ✅ Настройте мониторинг
7. ✅ После отладки соберите production build

---

**Важно:** Все пароли в примерах необходимо заменить на реальные безопасные пароли!
