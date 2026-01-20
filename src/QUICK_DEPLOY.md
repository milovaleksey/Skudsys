# ⚡ Быстрое развертывание на Debian сервере

## 🎯 Одна команда - полная установка!

```bash
# Скачать, распаковать и запустить
wget https://your-server/utmn-security.zip && \
unzip utmn-security.zip && \
cd utmn-security && \
chmod +x deploy.sh && \
sudo ./deploy.sh
```

---

## 📦 Вручную за 5 шагов

### 1️⃣ Загрузить на сервер

```bash
# С локального компьютера
scp utmn-security.zip root@your-server-ip:/root/

# Подключиться
ssh root@your-server-ip
```

### 2️⃣ Распаковать

```bash
unzip utmn-security.zip
cd utmn-security
```

### 3️⃣ Запустить установку

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

### 4️⃣ Следовать инструкциям скрипта

Скрипт спросит:
- ✅ Пароль root для MySQL
- ✅ Создать ли отдельного пользователя БД
- ✅ Настроить ли firewall

### 5️⃣ Открыть в браузере

```
http://your-server-ip
```

**Логин:** `admin_security`  
**Пароль:** `AdminSecure2024!`

---

## ✅ Что устанавливается?

- ✅ Node.js 20.x
- ✅ MySQL 8.0
- ✅ Nginx
- ✅ Backend API (порт 3000)
- ✅ Frontend (собранный в `/var/www/utmn-security/dist`)
- ✅ Systemd сервис (автозапуск)
- ✅ База данных с тестовыми данными

---

## ⏱️ Время установки

**10-15 минут** (зависит от скорости интернета)

---

## 🔧 После установки

### Управление сервисом

```bash
# Статус
systemctl status utmn-security

# Перезапуск
systemctl restart utmn-security

# Логи
journalctl -u utmn-security -f
```

### Управление Nginx

```bash
# Статус
systemctl status nginx

# Проверка
nginx -t

# Перезагрузка
systemctl reload nginx
```

### Логи

```bash
# Backend логи
journalctl -u utmn-security -f

# Nginx логи
tail -f /var/log/nginx/utmn-security-access.log
tail -f /var/log/nginx/utmn-security-error.log
```

---

## 📁 Где что находится?

```
/var/www/utmn-security/          # Приложение
├── backend/                     # Backend API
│   ├── .env                    # Конфигурация
│   └── ...
├── dist/                       # Frontend (статика)
└── ...

/etc/nginx/sites-available/
└── utmn-security               # Nginx конфигурация

/etc/systemd/system/
└── utmn-security.service       # Systemd сервис

/var/log/nginx/
├── utmn-security-access.log    # Логи доступа
└── utmn-security-error.log     # Логи ошибок
```

---

## 🐛 Проблемы?

### Сервис не запустился

```bash
# Проверить логи
journalctl -u utmn-security -n 50

# Запустить вручную
cd /var/www/utmn-security/backend
node src/server.js
```

### 502 Bad Gateway

```bash
# Проверить backend
curl http://localhost:3000/health

# Запустить сервис
systemctl start utmn-security
```

### Не подключается к БД

```bash
# Проверить .env
cat /var/www/utmn-security/backend/.env

# Проверить MySQL
mysql -u utmn_user -p utmn_security
```

---

## 📚 Полная документация

См. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** для подробной информации.

---

**Готово к развертыванию! 🚀**

**Версия:** 1.0  
**Дата:** 20.01.2026
