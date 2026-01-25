# Быстрая настройка доступа к MySQL извне

## Шаг 1: Настроить MySQL для внешних подключений

```bash
# Редактировать конфигурацию
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Изменить:
bind-address = 0.0.0.0

# Сохранить (Ctrl+X, Y, Enter) и перезапустить
sudo systemctl restart mysql
```

## Шаг 2: Создать пользователя для удаленного доступа

```bash
# Войти в MySQL
sudo mysql -u root -p
```

```sql
-- Создать пользователя (замените НАДЕЖНЫЙ_ПАРОЛЬ)
CREATE USER 'utmn_remote'@'%' IDENTIFIED BY 'НАДЕЖНЫЙ_ПАРОЛЬ';

-- Дать права на базу
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_remote'@'%';

-- Применить
FLUSH PRIVILEGES;

-- Выйти
EXIT;
```

## Шаг 3: Открыть порт в firewall

```bash
# Ubuntu/Debian с ufw
sudo ufw allow 3306/tcp
sudo ufw reload

# CentOS/RHEL с firewalld
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload
```

## Шаг 4: Проверить доступ

```bash
# С удаленной машины
mysql -h IP_ВАШЕГО_СЕРВЕРА -u utmn_remote -p

# Или
telnet IP_ВАШЕГО_СЕРВЕРА 3306
```

## Данные для подключения

```
Хост: IP_адрес_сервера
Порт: 3306
База: utmn_security
Юзер: utmn_remote
Пароль: ваш_пароль
```

## 🔒 Безопасность (рекомендуется)

### Ограничить доступ по IP

```sql
-- Удалить доступ отовсюду
DROP USER 'utmn_remote'@'%';

-- Создать для конкретного IP
CREATE USER 'utmn_remote'@'IP_АДРЕС' IDENTIFIED BY 'ПАРОЛЬ';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_remote'@'IP_АДРЕС';
FLUSH PRIVILEGES;
```

### Настроить firewall для конкретного IP

```bash
sudo ufw delete allow 3306/tcp
sudo ufw allow from IP_АДРЕС to any port 3306
sudo ufw reload
```

## Генерация безопасного пароля

```bash
openssl rand -base64 32
```

## Проверка подключений

```sql
-- Активные подключения
SHOW PROCESSLIST;

-- Пользователи
SELECT User, Host FROM mysql.user;
```

## Устранение проблем

### MySQL не принимает подключения

```bash
# Проверить статус
sudo systemctl status mysql

# Проверить порт
sudo netstat -tlnp | grep 3306

# Проверить bind-address
sudo grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
```

### Firewall блокирует

```bash
# Проверить правила
sudo ufw status verbose

# Проверить логи
sudo tail -f /var/log/ufw.log
```

### Ошибка доступа

```bash
# Проверить права пользователя
sudo mysql -u root -p
SHOW GRANTS FOR 'utmn_remote'@'%';

# Проверить логи MySQL
sudo tail -f /var/log/mysql/error.log
```

---

**Важно:** После настройки доступа извне регулярно проверяйте логи MySQL на подозрительную активность!
