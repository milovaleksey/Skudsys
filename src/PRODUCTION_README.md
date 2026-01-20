# 🚀 Production развертывание - Система безопасности ТюмГУ

## 📋 Обзор

Полная система автоматического развертывания на **Debian/Ubuntu сервере** с использованием:
- **Nginx** - веб-сервер и reverse proxy
- **MySQL** - база данных
- **Node.js** - backend runtime
- **systemd** - управление сервисами

---

## ⚡ Быстрый старт

### Автоматическая установка (рекомендуется)

```bash
# 1. Загрузить ZIP на сервер
scp utmn-security.zip root@your-server:/root/

# 2. Подключиться
ssh root@your-server

# 3. Запустить установку
unzip utmn-security.zip
cd utmn-security
chmod +x deploy.sh
sudo ./deploy.sh
```

**Время:** 10-15 минут  
**Результат:** Полностью рабочая система на http://your-server-ip

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** ⭐ | Быстрое развертывание (5 шагов) |
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Полное руководство по развертыванию |
| **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** | Установка для разработки |
| **[COMMANDS_CHEATSHEET.md](COMMANDS_CHEATSHEET.md)** | Шпаргалка команд |

---

## 🗂️ Структура проекта

```
utmn-security/
│
├── 📜 deploy.sh                 # ⭐ Главный скрипт установки
│
├── 📂 nginx/
│   └── production.conf          # Конфигурация Nginx для HTTP
│
├── 📂 systemd/
│   └── utmn-security.service    # Systemd сервис
│
├── 📂 backend/
│   ├── .env.production          # Шаблон production настроек
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── scripts/
│   │       └── initDatabase.js # Инициализация БД
│   └── package.json
│
├── 📂 src/                      # Frontend исходники
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
│
├── 📂 public/
│
├── 📄 package.json              # Frontend зависимости
├── 📄 vite.config.ts           # Vite конфигурация
│
└── 📄 Документация:
    ├── PRODUCTION_README.md     # ⭐ Этот файл
    ├── DEPLOYMENT_GUIDE.md      # Полное руководство
    ├── QUICK_DEPLOY.md          # Быстрое развертывание
    └── ...
```

---

## 🔧 Что делает deploy.sh?

Автоматический скрипт установки выполняет:

1. ✅ Проверка ОС (Debian/Ubuntu)
2. ✅ Установка Node.js 20.x
3. ✅ Установка MySQL Server
4. ✅ Установка Nginx
5. ✅ Создание базы данных `utmn_security`
6. ✅ Создание пользователя БД (опционально)
7. ✅ Распаковка приложения в `/var/www/utmn-security`
8. ✅ Установка зависимостей backend (production)
9. ✅ Генерация `.env` с безопасными настройками
10. ✅ Инициализация таблиц БД
11. ✅ Установка зависимостей frontend
12. ✅ Сборка frontend (`npm run build`)
13. ✅ Настройка Nginx (reverse proxy + static files)
14. ✅ Создание systemd сервиса
15. ✅ Настройка прав доступа
16. ✅ Настройка firewall (опционально)
17. ✅ Запуск и проверка работы

---

## 🌐 Архитектура после установки

```
Internet
    │
    ▼
┌─────────────────────────────────┐
│  Nginx (порт 80)                │
│  - Статические файлы (/dist)    │
│  - Reverse proxy для API        │
└──────────┬──────────────────────┘
           │
           ├─── /          → Frontend (статика)
           │
           └─── /v1/      → Backend API (proxy)
                           │
                           ▼
                   ┌───────────────────┐
                   │  Node.js Backend  │
                   │  (порт 3000)      │
                   │  systemd сервис   │
                   └────────┬──────────┘
                            │
                            ▼
                   ┌───────────────────┐
                   │  MySQL Database   │
                   │  utmn_security    │
                   └───────────────────┘
```

---

## 📁 Расположение файлов

### Приложение

```bash
/var/www/utmn-security/          # Корень приложения
├── backend/
│   ├── .env                     # Конфигурация (НЕ коммитить!)
│   ├── node_modules/
│   └── src/
├── dist/                        # Собранный frontend
└── node_modules/
```

### Nginx

```bash
/etc/nginx/sites-available/utmn-security    # Конфигурация
/etc/nginx/sites-enabled/utmn-security      # Симлинк
/var/log/nginx/utmn-security-*.log          # Логи
```

### Systemd

```bash
/etc/systemd/system/utmn-security.service   # Сервис
```

### Логи

```bash
journalctl -u utmn-security                 # Логи backend
/var/log/nginx/utmn-security-access.log     # Nginx access
/var/log/nginx/utmn-security-error.log      # Nginx errors
```

---

## 🎛️ Управление

### Сервис Backend

```bash
# Статус
systemctl status utmn-security

# Запуск
systemctl start utmn-security

# Остановка
systemctl stop utmn-security

# Перезапуск
systemctl restart utmn-security

# Автозапуск
systemctl enable utmn-security

# Логи в реальном времени
journalctl -u utmn-security -f
```

### Nginx

```bash
# Статус
systemctl status nginx

# Проверка конфигурации
nginx -t

# Перезагрузка конфигурации
systemctl reload nginx

# Перезапуск
systemctl restart nginx

# Логи
tail -f /var/log/nginx/utmn-security-access.log
```

### MySQL

```bash
# Статус
systemctl status mysql

# Подключение
mysql -u utmn_user -p utmn_security

# Резервная копия
mysqldump -u utmn_user -p utmn_security > backup.sql
```

---

## 🔄 Обновление приложения

### Через Git (рекомендуется)

```bash
cd /var/www/utmn-security

# Остановить сервис
systemctl stop utmn-security

# Обновить код
git pull origin main

# Обновить backend
cd backend && npm install --production && cd ..

# Пересобрать frontend
npm install && npm run build

# Запустить
systemctl start utmn-security
systemctl reload nginx
```

### Через ZIP архив

```bash
# Создать бэкап
cp -r /var/www/utmn-security /var/www/utmn-security.backup
cp /var/www/utmn-security/backend/.env /tmp/

# Остановить
systemctl stop utmn-security

# Обновить
rm -rf /var/www/utmn-security/*
unzip utmn-security-new.zip -d /var/www/utmn-security

# Восстановить конфиг
cp /tmp/.env /var/www/utmn-security/backend/

# Установить и собрать
cd /var/www/utmn-security/backend && npm install --production && cd ..
npm install && npm run build

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

# Запустить вручную для отладки
cd /var/www/utmn-security/backend
node src/server.js
```

### 502 Bad Gateway

```bash
# Проверить backend
curl http://localhost:3000/health

# Если не работает
systemctl start utmn-security
```

### Ошибка подключения к БД

```bash
# Проверить MySQL
systemctl status mysql

# Проверить .env
cat /var/www/utmn-security/backend/.env

# Тестовое подключение
mysql -u utmn_user -p utmn_security
```

---

## 🔒 Безопасность

### После установки:

1. **Смените пароли:**
   ```bash
   # MySQL root пароль
   mysql -u root -p
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'NEW_PASSWORD';
   
   # Пароли пользователей в системе
   # Войдите и измените через интерфейс
   ```

2. **Измените JWT секрет:**
   ```bash
   nano /var/www/utmn-security/backend/.env
   # Генерировать: openssl rand -base64 32
   ```

3. **Настройте firewall:**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw enable
   ```

4. **Отключите root SSH:**
   ```bash
   nano /etc/ssh/sshd_config
   # PermitRootLogin no
   systemctl restart sshd
   ```

---

## 📊 Мониторинг

```bash
# Использование ресурсов
htop

# Проверка дискового пространства
df -h

# Проверка портов
netstat -tulpn | grep -E ':(80|3000|3306)'

# Логи в реальном времени
journalctl -u utmn-security -f
tail -f /var/log/nginx/utmn-security-access.log
```

---

## 💾 Резервное копирование

### Автоматический бэкап

```bash
# Создать скрипт
cat > /usr/local/bin/backup-utmn.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/utmn-security"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# База данных
mysqldump -u utmn_user -p'PASSWORD' utmn_security > $BACKUP_DIR/db_$DATE.sql

# Приложение
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/utmn-security

# Удалить старые (>7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-utmn.sh

# Добавить в cron (ежедневно в 2:00)
crontab -e
# 0 2 * * * /usr/local/bin/backup-utmn.sh
```

---

## 🎯 Чеклист production

- [ ] Сервер обновлен (`apt update && apt upgrade`)
- [ ] Приложение установлено (`./deploy.sh`)
- [ ] Сервисы запущены (`systemctl status`)
- [ ] Firewall настроен (`ufw status`)
- [ ] Пароли изменены (MySQL, admin)
- [ ] JWT_SECRET изменен
- [ ] Резервное копирование настроено
- [ ] SSL сертификаты готовы (для HTTPS в будущем)
- [ ] Мониторинг настроен
- [ ] Доступ по http://server-ip работает

---

## 🚀 Следующие шаги

### После успешного запуска на HTTP:

1. **Тестирование**
   - Проверить все функции
   - Протестировать разные роли
   - Проверить производительность

2. **Настройка HTTPS** (после отладки)
   - Получить SSL сертификат (Let's Encrypt)
   - Обновить Nginx конфигурацию
   - Настроить редирект HTTP → HTTPS

3. **Оптимизация**
   - Настроить кеширование
   - Настроить сжатие
   - Настроить CDN (опционально)

4. **Мониторинг**
   - Настроить alerts
   - Интегрировать с системой мониторинга
   - Настроить логирование

---

## 📞 Поддержка

**Документация:**
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - полное руководство
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - быстрое развертывание
- [COMMANDS_CHEATSHEET.md](COMMANDS_CHEATSHEET.md) - команды

**Логи:**
```bash
journalctl -u utmn-security -f
tail -f /var/log/nginx/utmn-security-error.log
```

---

**Готово к production развертыванию! 🚀**

**Версия:** 1.0  
**Дата:** 20.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
