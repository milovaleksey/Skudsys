# Быстрая справка

## 🚀 Развертывание системы

```bash
sudo ./deploy.sh
```

Система развернется за 10-15 минут. После завершения:
- **Веб-интерфейс:** http://ваш-сервер/
- **Логин:** admin
- **Пароль:** admin123

## 🔌 Настройка MySQL доступа извне

### Автоматическая настройка (рекомендуется)

```bash
chmod +x setup-mysql-external.sh
sudo ./setup-mysql-external.sh
```

Скрипт:
- ✅ Настроит MySQL для внешних подключений
- ✅ Создаст пользователя с доступом извне
- ✅ Откроет порт в firewall
- ✅ Сгенерирует безопасный пароль
- ✅ Сохранит данные подключения

### Ручная настройка

```bash
# 1. Открыть доступ
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# bind-address = 0.0.0.0
sudo systemctl restart mysql

# 2. Создать пользователя
sudo mysql -u root -p
```

```sql
CREATE USER 'utmn_remote'@'%' IDENTIFIED BY 'ПАРОЛЬ';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_remote'@'%';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 3. Открыть firewall
sudo ufw allow 3306/tcp
sudo ufw reload
```

## 📊 Управление сервисами

```bash
# Backend
sudo systemctl status utmn-security
sudo systemctl restart utmn-security

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# MySQL
sudo systemctl status mysql
sudo systemctl restart mysql
```

## 📝 Просмотр логов

```bash
# Backend
sudo journalctl -u utmn-security -f

# Nginx
sudo tail -f /var/log/nginx/error.log

# MySQL
sudo tail -f /var/log/mysql/error.log
```

## 💾 Резервное копирование

```bash
# Создать бэкап
mysqldump -u root -p utmn_security > backup_$(date +%Y%m%d).sql

# Восстановить
mysql -u root -p utmn_security < backup_20260123.sql
```

## 🔍 Проверка доступа к MySQL

```bash
# Локально
mysql -u utmn_remote -p utmn_security

# С удаленной машины
mysql -h IP_СЕРВЕРА -u utmn_remote -p

# Telnet проверка
telnet IP_СЕРВЕРА 3306
```

## 🔧 Устранение проблем

### MySQL не принимает подключения

```bash
# Проверить bind-address
sudo grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf

# Проверить порт
sudo netstat -tlnp | grep 3306

# Проверить firewall
sudo ufw status
```

### Backend не запускается

```bash
# Логи
sudo journalctl -u utmn-security -n 100

# Запустить вручную
cd /opt/utmn-security/backend
node src/server.js
```

### Забыли пароль админа

```bash
# Сбросить пароль
sudo mysql -u root -p utmn_security

# В MySQL
UPDATE users 
SET password = '$2b$10$rX3vY5YkZ8qP2mW1nO3L9.jK4lN5mQ6rS7tU8vW9xA0yB1zC2dE3f' 
WHERE username = 'admin';
-- Новый пароль: admin123
```

## 📍 Расположение файлов

```
/opt/utmn-security/          # Основная директория
/opt/utmn-security/backend/  # Backend код
/etc/nginx/sites-available/  # Конфиги Nginx
/etc/systemd/system/         # Systemd сервисы
/var/log/nginx/              # Логи Nginx
/var/log/mysql/              # Логи MySQL
/root/mysql-external-access.txt  # Данные MySQL доступа
```

## 🌐 API примеры

```bash
# Авторизация
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Получить пользователей (с токеном)
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Создать пользователя
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"pass123","role":"operator","fullName":"Новый Пользователь"}'
```

## 🔐 Безопасность

### Сменить пароль админа

1. Войти как admin
2. Перейти в "Управление пользователями"
3. Найти пользователя admin
4. Изменить пароль

### Ограничить MySQL доступ по IP

```sql
DROP USER 'utmn_remote'@'%';
CREATE USER 'utmn_remote'@'IP_АДРЕС' IDENTIFIED BY 'ПАРОЛЬ';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_remote'@'IP_АДРЕС';
FLUSH PRIVILEGES;
```

### Сгенерировать безопасный пароль

```bash
openssl rand -base64 32
```

## 📞 Полезные команды

```bash
# Проверить версии
node --version
npm --version
mysql --version
nginx -v

# Проверить статус всех сервисов
sudo systemctl status utmn-security nginx mysql

# Перезапустить всё
sudo systemctl restart utmn-security nginx mysql

# Проверить открытые порты
sudo netstat -tlnp | grep -E '(80|3001|3306)'

# Проверить использование ресурсов
htop
df -h
free -h
```

## 📚 Документация

- **README.md** - Полная документация
- **MYSQL_EXTERNAL_ACCESS.md** - Настройка MySQL извне
- **DEVELOPER_GUIDE.md** - Руководство для разработчиков

---

**Версия:** 1.0 | **Дата:** 23.01.2026 | **Организация:** ТюмГУ
