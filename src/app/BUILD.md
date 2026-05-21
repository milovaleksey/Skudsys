# 🏗️ Инструкции по сборке проекта

## 📋 Содержание

1. [Development сборка](#development-сборка)
2. [Production сборка](#production-сборка)
3. [Сборка для разных окружений](#сборка-для-разных-окружений)
4. [Оптимизация](#оптимизация)
5. [Устранение проблем](#устранение-проблем)

---

## 💻 Development сборка

### Быстрый запуск

```bash
# Автоматический запуск (рекомендуется)
chmod +x start-dev.sh
./start-dev.sh
```

### Ручной запуск

```bash
# 1. Установка зависимостей
npm install
cd backend && npm install && cd ..

# 2. Настройка backend
cd backend
cp .env.example .env
nano .env  # Отредактируйте параметры

# 3. Запуск backend (в отдельном терминале)
cd backend
npm run dev
# или
node src/server.js

# 4. Запуск frontend (в другом терминале)
cd ..
npm run dev
```

### Доступ в режиме разработки

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/v1
- **Health Check:** http://localhost:3000/health

**Из сети:**
- **Frontend:** http://<IP>:5173
- **Backend API:** http://<IP>:3000/v1

---

## 🚀 Production сборка

### Полная автоматическая установка

```bash
chmod +x deploy-quick.sh
sudo ./deploy-quick.sh
```

Скрипт выполнит:
1. ✅ Проверку зависимостей
2. ✅ Настройку базы данных
3. ✅ Установку зависимостей backend
4. ✅ Сборку frontend
5. ✅ Настройку Nginx
6. ✅ Создание systemd сервиса
7. ✅ Настройку прав доступа

### Ручная production сборка

#### 1. Сборка Frontend

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Результат в папке dist/
ls -la dist/
```

Структура `dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

#### 2. Настройка Backend

```bash
cd backend

# Установка production зависимостей
npm install --production

# Создание .env
cp .env.example .env

# Отредактируйте .env
nano .env
```

Обязательные параметры в `.env`:
```env
NODE_ENV=production
DB_HOST=localhost
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=your_secure_password
JWT_SECRET=<generated_secret>
CORS_ORIGIN=http://your-server-ip
```

Генерация JWT_SECRET:
```bash
openssl rand -base64 32
```

#### 3. Развертывание

```bash
# Создайте директорию для приложения
sudo mkdir -p /var/www/utmn-security

# Скопируйте файлы
sudo cp -r dist /var/www/utmn-security/
sudo cp -r backend /var/www/utmn-security/

# Настройте права
sudo chown -R www-data:www-data /var/www/utmn-security
sudo chmod 600 /var/www/utmn-security/backend/.env
```

#### 4. Настройка Nginx

```bash
# Скопируйте конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/utmn-security

# Активируйте
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Проверьте и перезагрузите
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Настройка systemd

```bash
# Скопируйте сервис
sudo cp systemd/utmn-security.service /etc/systemd/system/

# Запустите
sudo systemctl daemon-reload
sudo systemctl enable utmn-security
sudo systemctl start utmn-security
```

---

## 🌍 Сборка для разных окружений

### Локальная сеть (Development)

**Frontend .env:**
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
```

```bash
npm run dev
```

### Локальная сеть (Production через Nginx)

**Frontend .env:**
```env
# Пустой - используется Nginx proxy
VITE_API_BASE_URL=
VITE_API_VERSION=v1
```

**Backend .env:**
```env
CORS_ORIGIN=http://192.168.1.100
```

```bash
npm run build
sudo ./deploy-quick.sh
```

### Внешний сервер (с доменом)

**Frontend .env:**
```env
# Пустой для Nginx proxy
VITE_API_BASE_URL=
VITE_API_VERSION=v1
```

**Backend .env:**
```env
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

**Nginx:** Настройте HTTPS с Let's Encrypt

```bash
sudo certbot --nginx -d your-domain.com
```

---

## ⚡ Оптимизация

### Frontend оптимизация

**vite.config.ts уже настроен на:**

1. **Code splitting** - разделение кода на chunk'и
2. **Tree shaking** - удаление неиспользуемого кода
3. **Minification** - минификация JavaScript/CSS
4. **Asset optimization** - оптимизация изображений

**Дополнительная оптимизация:**

```bash
# Анализ размера bundle
npm run build -- --mode analyze

# Предварительное сжатие
npm install -D vite-plugin-compression
```

### Backend оптимизация

**В production уже включены:**

1. ✅ Compression middleware (gzip)
2. ✅ Helmet.js (безопасность)
3. ✅ Rate limiting
4. ✅ Connection pooling (MySQL)

**PM2 для production (опционально):**

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск backend через PM2
cd /var/www/utmn-security/backend
pm2 start src/server.js --name utmn-security

# Автозапуск
pm2 startup
pm2 save

# Мониторинг
pm2 monit
```

### Nginx оптимизация

**Уже настроено в nginx.conf:**

1. ✅ Gzip сжатие
2. ✅ Кеширование статики
3. ✅ Безопасные заголовки

**Дополнительно:**

```nginx
# Добавьте в server блок
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Brotli сжатие (если установлен)
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

### MySQL оптимизация

```sql
-- Индексы уже созданы в schema.sql

-- Проверка медленных запросов
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Оптимизация таблиц
OPTIMIZE TABLE users, students, employees, access_logs;

-- Анализ запросов
EXPLAIN SELECT * FROM v_users_with_roles;
```

---

## 🐛 Устранение проблем

### Ошибки сборки Frontend

#### `npm install` падает

```bash
# Очистите кеш
npm cache clean --force
rm -rf node_modules package-lock.json

# Попробуйте с legacy-peer-deps
npm install --legacy-peer-deps
```

#### TypeScript ошибки

```bash
# Проверьте версию TypeScript
npm ls typescript

# Пересоберите типы
rm -rf node_modules/.vite
npm run build
```

#### Vite build fails

```bash
# Увеличьте память для Node.js
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Проверьте vite.config.ts
npm run build -- --debug
```

### Ошибки Backend

#### Не устанавливаются зависимости

```bash
cd backend

# Удалите node_modules
rm -rf node_modules package-lock.json

# Установите заново
npm install

# Проверьте версию Node.js
node -v  # Должно быть >= 18.0.0
```

#### MySQL connection error

```bash
# Проверьте .env
cat backend/.env | grep DB_

# Проверьте подключение
mysql -u utmn_user -p utmn_security -e "SELECT 1;"

# Проверьте, что MySQL запущен
sudo systemctl status mysql
```

### Ошибки Nginx

#### 502 Bad Gateway

```bash
# Проверьте, что backend запущен
sudo systemctl status utmn-security
curl http://localhost:3000/health

# Проверьте логи Nginx
sudo tail -f /var/log/nginx/utmn-security-error.log
```

#### 404 Not Found

```bash
# Проверьте файлы
ls -la /var/www/utmn-security/dist/

# Проверьте конфигурацию
sudo nginx -t

# Проверьте права
sudo chown -R www-data:www-data /var/www/utmn-security/
```

### Проблемы с доступом из сети

#### Не открывается из сети

```bash
# Проверьте файрвол
sudo ufw status
sudo ufw allow 80/tcp

# Проверьте, что Nginx слушает на всех интерфейсах
sudo netstat -tulpn | grep :80

# Проверьте IP
hostname -I
```

#### CORS ошибки

```bash
# Обновите CORS_ORIGIN в backend/.env
nano /var/www/utmn-security/backend/.env

# Добавьте IP сервера
CORS_ORIGIN=http://192.168.1.100,http://localhost

# Перезапустите backend
sudo systemctl restart utmn-security
```

---

## 📊 Проверка сборки

### Размер bundle

```bash
# После сборки
npm run build

# Проверьте размер
du -sh dist/
du -h dist/assets/*.js | sort -h
```

Примерные размеры:
- **Общий размер:** ~2-5 MB
- **Main bundle:** ~500-800 KB (gzipped: ~150-250 KB)
- **Vendor bundle:** ~300-500 KB (gzipped: ~100-150 KB)

### Performance тесты

```bash
# Lighthouse CI
npm install -g @lhci/cli

# Запустите тесты
lhci autorun --collect.url=http://localhost

# Проверка скорости загрузки
curl -w "@curl-format.txt" -o /dev/null -s http://localhost
```

### Тест API

```bash
# Health check
curl http://localhost:3000/health

# Login test
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_security","password":"test123","authType":"local"}'
```

---

## 📝 Чек-лист перед production

- [ ] Сменены все тестовые пароли
- [ ] Настроен JWT_SECRET (не дефолтный)
- [ ] Настроены правильные CORS_ORIGIN
- [ ] NODE_ENV=production в backend/.env
- [ ] Включен HTTPS (Let's Encrypt)
- [ ] Настроен файрвол (UFW)
- [ ] Настроено резервное копирование БД
- [ ] Протестированы все роли
- [ ] Проверены логи на ошибки
- [ ] Настроен мониторинг (PM2/systemd)

---

**Версия:** 2.0  
**Дата:** 25.01.2026
