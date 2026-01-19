# Документация по развертыванию
## Система безопасности инфраструктуры ТюмГУ

---

## Содержание
1. [Требования к системе](#требования-к-системе)
2. [Архитектура приложения](#архитектура-приложения)
3. [Развертывание Frontend](#развертывание-frontend)
4. [Развертывание Backend (рекомендации)](#развертывание-backend-рекомендации)
5. [Настройка базы данных](#настройка-базы-данных)
6. [Интеграция с SSO UTMN](#интеграция-с-sso-utmn)
7. [Безопасность](#безопасность)
8. [Мониторинг и логирование](#мониторинг-и-логирование)

---

## Требования к системе

### Минимальные требования сервера

**Frontend сервер:**
- ОС: Ubuntu 20.04 LTS / CentOS 8 / Windows Server 2019
- CPU: 2 ядра
- RAM: 2 GB
- Disk: 20 GB SSD
- Node.js: v18.x или выше
- Nginx: 1.18 или выше

**Backend сервер (рекомендуется):**
- ОС: Ubuntu 20.04 LTS / CentOS 8
- CPU: 4 ядра
- RAM: 8 GB
- Disk: 100 GB SSD (в зависимости от объема данных)
- Node.js: v18.x или выше / Python 3.9+ / .NET 6+
- База данных: PostgreSQL 14+ / MySQL 8+ / SQL Server 2019+

**Сетевые требования:**
- Открытые порты: 80 (HTTP), 443 (HTTPS)
- SSL сертификат для HTTPS
- Доступ к SSO UTMN (если используется)

---

## Архитектура приложения

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Nginx (Proxy)  │
│   Port 80/443   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Frontend│ │ Backend  │
│ React  │ │   API    │
│  App   │ │          │
└────────┘ └─────┬────┘
              │
         ┌────┴────┐
         │         │
         ▼         ▼
    ┌────────┐ ┌──────────┐
    │  БД    │ │ SSO UTMN │
    │Postgres│ │   API    │
    └────────┘ └──────────┘
```

---

## Развертывание Frontend

### Шаг 1: Установка Node.js и npm

**Ubuntu/Debian:**
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка установки
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# Установка Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Проверка установки
node --version
npm --version
```

### Шаг 2: Клонирование и сборка приложения

```bash
# Создание директории для приложения
sudo mkdir -p /var/www/utmn-security
cd /var/www/utmn-security

# Клонирование репозитория (замените на ваш репозиторий)
git clone https://github.com/your-org/utmn-security-frontend.git .

# Установка зависимостей
npm install

# Сборка production версии
npm run build

# Результат сборки будет в папке dist/
```

### Шаг 3: Установка и настройка Nginx

**Установка Nginx:**
```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# Запуск и автозапуск
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Настройка конфигурации Nginx:**
```bash
sudo nano /etc/nginx/sites-available/utmn-security
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name security.utmn.ru;  # Замените на ваш домен

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name security.utmn.ru;  # Замените на ваш домен

    # SSL сертификаты
    ssl_certificate /etc/ssl/certs/utmn-security.crt;
    ssl_certificate_key /etc/ssl/private/utmn-security.key;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Корневая директория
    root /var/www/utmn-security/dist;
    index index.html;

    # Логи
    access_log /var/log/nginx/utmn-security-access.log;
    error_log /var/log/nginx/utmn-security-error.log;

    # Сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Кэширование статических файлов
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Обработка React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API запросов к backend (если есть)
    location /api {
        proxy_pass http://localhost:3001;  # Порт backend сервера
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
}
```

**Активация конфигурации:**
```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### Шаг 4: Настройка SSL сертификата

**Использование Let's Encrypt (бесплатно):**
```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d security.utmn.ru

# Автоматическое обновление (добавляется в cron автоматически)
sudo certbot renew --dry-run
```

**Использование собственного сертификата:**
```bash
# Копирование сертификатов
sudo cp your-certificate.crt /etc/ssl/certs/utmn-security.crt
sudo cp your-private-key.key /etc/ssl/private/utmn-security.key

# Установка прав
sudo chmod 644 /etc/ssl/certs/utmn-security.crt
sudo chmod 600 /etc/ssl/private/utmn-security.key
```

### Шаг 5: Настройка автоматического обновления

**Создание скрипта обновления:**
```bash
sudo nano /usr/local/bin/update-utmn-security.sh
```

Содержимое:
```bash
#!/bin/bash

# Переход в директорию проекта
cd /var/www/utmn-security

# Получение последних изменений
git pull origin main

# Установка зависимостей
npm install

# Сборка
npm run build

# Перезагрузка Nginx
systemctl reload nginx

echo "Обновление завершено: $(date)"
```

**Настройка прав:**
```bash
sudo chmod +x /usr/local/bin/update-utmn-security.sh
```

**Настройка cron для автоматического обновления (опционально):**
```bash
sudo crontab -e

# Добавить строку для обновления каждый день в 3:00 AM
0 3 * * * /usr/local/bin/update-utmn-security.sh >> /var/log/utmn-security-update.log 2>&1
```

---

## Развертывание Backend (рекомендации)

### Вариант 1: Node.js + Express

**Структура проекта:**
```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── passes.controller.js
│   │   ├── students.controller.js
│   │   └── employees.controller.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Pass.js
│   │   ├── Student.js
│   │   └── Employee.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── passes.routes.js
│   │   ├── students.routes.js
│   │   └── employees.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── config/
│   │   └── database.js
│   └── app.js
├── .env
├── package.json
└── server.js
```

**Пример server.js:**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'https://security.utmn.ru',
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/passes', require('./src/routes/passes.routes'));
app.use('/api/students', require('./src/routes/students.routes'));
app.use('/api/employees', require('./src/routes/employees.routes'));

// Error handling
app.use(require('./src/middleware/error.middleware'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Установка и запуск:**
```bash
# Переход в директорию backend
cd /var/www/utmn-security-backend

# Установка зависимостей
npm install express cors helmet morgan dotenv pg sequelize bcrypt jsonwebtoken

# Создание .env файла
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key_change_this
SSO_UTMN_URL=https://sso.utmn.ru
SSO_CLIENT_ID=your_client_id
SSO_CLIENT_SECRET=your_client_secret
EOF

# Запуск с PM2
npm install -g pm2
pm2 start server.js --name utmn-security-backend
pm2 startup
pm2 save
```

### Вариант 2: Python + FastAPI

**Установка:**
```bash
# Установка Python и pip
sudo apt install -y python3 python3-pip python3-venv

# Создание виртуального окружения
cd /var/www/utmn-security-backend
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose[cryptography] passlib[bcrypt] python-multipart
```

**Пример main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://security.utmn.ru"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Подключение роутов
from routers import auth, passes, students, employees
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(passes.router, prefix="/api/passes", tags=["passes"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
```

**Запуск с systemd:**
```bash
sudo nano /etc/systemd/system/utmn-security-backend.service
```

Содержимое:
```ini
[Unit]
Description=UTMN Security Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/utmn-security-backend
Environment="PATH=/var/www/utmn-security-backend/venv/bin"
ExecStart=/var/www/utmn-security-backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 3001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Запуск сервиса
sudo systemctl daemon-reload
sudo systemctl start utmn-security-backend
sudo systemctl enable utmn-security-backend
```

### Вариант 3: .NET Core API

**Установка .NET:**
```bash
# Ubuntu
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-6.0
```

**Создание проекта:**
```bash
dotnet new webapi -n UtmnSecurityApi
cd UtmnSecurityApi
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

**Запуск:**
```bash
dotnet publish -c Release -o /var/www/utmn-security-backend
dotnet /var/www/utmn-security-backend/UtmnSecurityApi.dll
```

---

## Настройка базы данных

### PostgreSQL

**Установка:**
```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# Запуск
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Создание базы данных и пользователя:**
```bash
sudo -u postgres psql

-- В psql консоли:
CREATE DATABASE utmn_security;
CREATE USER utmn_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE utmn_security TO utmn_user;
\q
```

**Структура таблиц:**
```sql
-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    sso_linked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проходы
CREATE TABLE passes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    card_number VARCHAR(50) NOT NULL,
    checkpoint VARCHAR(200) NOT NULL,
    passed_at TIMESTAMP NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('in', 'out')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passes_user_id ON passes(user_id);
CREATE INDEX idx_passes_passed_at ON passes(passed_at);
CREATE INDEX idx_passes_card_number ON passes(card_number);

-- Студенты
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    course INTEGER NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    faculty VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сотрудники
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    position VARCHAR(200) NOT NULL,
    department VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Парковочные места
CREATE TABLE parking_spots (
    id SERIAL PRIMARY KEY,
    spot_number VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(200) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('free', 'occupied', 'reserved')),
    user_id INTEGER REFERENCES users(id),
    occupied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Локации
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    checkpoint VARCHAR(200) NOT NULL,
    location_type VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_detected_at ON locations(detected_at);
```

**Backup и восстановление:**
```bash
# Создание backup
pg_dump -U utmn_user utmn_security > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
psql -U utmn_user utmn_security < backup_20260119_120000.sql

# Автоматический backup (cron)
0 2 * * * pg_dump -U utmn_user utmn_security > /backups/utmn_security_$(date +\%Y\%m\%d).sql
```

---

## Интеграция с SSO UTMN

### OAuth 2.0 / OpenID Connect

**Пример интеграции (Node.js):**
```javascript
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');

passport.use('utmn-sso', new OAuth2Strategy({
    authorizationURL: 'https://sso.utmn.ru/oauth/authorize',
    tokenURL: 'https://sso.utmn.ru/oauth/token',
    clientID: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    callbackURL: 'https://security.utmn.ru/api/auth/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Получение информации о пользователе
      const userInfo = await fetch('https://sso.utmn.ru/api/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => res.json());

      // Поиск или создание пользователя в БД
      let user = await User.findOne({ where: { email: userInfo.email } });
      
      if (!user) {
        user = await User.create({
          username: userInfo.username,
          email: userInfo.email,
          full_name: userInfo.name,
          sso_linked: true
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));
```

**Роуты авторизации:**
```javascript
// Инициализация SSO авторизации
router.get('/sso', passport.authenticate('utmn-sso'));

// Callback после авторизации
router.get('/callback', 
  passport.authenticate('utmn-sso', { session: false }),
  (req, res) => {
    // Генерация JWT токена
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Редирект на frontend с токеном
    res.redirect(`https://security.utmn.ru/auth/success?token=${token}`);
  }
);
```

**Настройки для получения доступа к SSO UTMN:**
1. Обратитесь в IT отдел ТюмГУ
2. Предоставьте информацию:
   - Название приложения: "Система безопасности инфраструктуры"
   - Callback URL: `https://security.utmn.ru/api/auth/callback`
   - Требуемые scope: `openid profile email`
3. Получите `CLIENT_ID` и `CLIENT_SECRET`

---

## Безопасность

### Настройки firewall

**UFW (Ubuntu):**
```bash
# Установка UFW
sudo apt install -y ufw

# Разрешение SSH
sudo ufw allow ssh

# Разрешение HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ограничение доступа к PostgreSQL (только локально)
sudo ufw deny 5432/tcp

# Включение firewall
sudo ufw enable
```

**firewalld (CentOS):**
```bash
# Разрешение HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Настройки PostgreSQL

**Редактирование pg_hba.conf:**
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Разрешить подключения только с localhost:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    utmn_security   utmn_user       127.0.0.1/32           md5
host    all             all             127.0.0.1/32           reject
```

### Защита от DDoS

**Настройка rate limiting в Nginx:**
```nginx
# В http блоке
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    server {
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            # ... остальные настройки
        }
    }
}
```

### Регулярные обновления

```bash
# Создание скрипта автообновления
sudo nano /usr/local/bin/security-updates.sh
```

```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y
systemctl restart nginx
echo "Security updates applied: $(date)" >> /var/log/security-updates.log
```

```bash
sudo chmod +x /usr/local/bin/security-updates.sh

# Добавление в cron (каждое воскресенье в 4:00)
0 4 * * 0 /usr/local/bin/security-updates.sh
```

---

## Мониторинг и логирование

### Настройка логирования

**Ротация логов Nginx:**
```bash
sudo nano /etc/logrotate.d/utmn-security
```

```
/var/log/nginx/utmn-security-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

### Мониторинг с Prometheus + Grafana

**Установка node_exporter:**
```bash
# Скачивание
wget https://github.com/prometheus/node_exporter/releases/download/v1.5.0/node_exporter-1.5.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.5.0.linux-amd64.tar.gz
sudo cp node_exporter-1.5.0.linux-amd64/node_exporter /usr/local/bin/

# Создание сервиса
sudo nano /etc/systemd/system/node_exporter.service
```

```ini
[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

### Алерты и уведомления

**Скрипт мониторинга работоспособности:**
```bash
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

# Проверка доступности сайта
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://security.utmn.ru)

if [ $HTTP_STATUS -ne 200 ]; then
    echo "ALERT: Site is down! HTTP Status: $HTTP_STATUS" | mail -s "UTMN Security Alert" admin@utmn.ru
    systemctl restart nginx
fi

# Проверка использования диска
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is $DISK_USAGE%" | mail -s "Disk Space Alert" admin@utmn.ru
fi
```

```bash
sudo chmod +x /usr/local/bin/health-check.sh

# Запуск каждые 5 минут
*/5 * * * * /usr/local/bin/health-check.sh
```

---

## Чеклист развертывания

- [ ] Установлен и настроен Node.js
- [ ] Установлен и настроен Nginx
- [ ] Настроен SSL сертификат
- [ ] Собрано и развернуто frontend приложение
- [ ] Установлена и настроена база данных PostgreSQL
- [ ] Развернут backend API сервер
- [ ] Настроена интеграция с SSO UTMN
- [ ] Настроен firewall
- [ ] Настроены backup базы данных
- [ ] Настроено логирование и ротация логов
- [ ] Настроен мониторинг
- [ ] Проведено тестирование безопасности
- [ ] Создана документация для администраторов

---

## Контакты и поддержка

**Техническая поддержка:**
- Email: support@utmn.ru
- Телефон: +7 (3452) XX-XX-XX

**Разработчики:**
- GitHub: https://github.com/your-org/utmn-security

**Документация:**
- Wiki: https://wiki.utmn.ru/security-system
- API Docs: https://security.utmn.ru/api/docs

---

## Лицензия

© 2026 Тюменский государственный университет. Все права защищены.
