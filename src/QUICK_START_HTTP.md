# 🚀 Быстрый старт (HTTP за Reverse Proxy)

Краткая инструкция по развертыванию системы безопасности ТюмГУ в режиме HTTP за внешним reverse proxy.

## Подготовка (одна команда)

```bash
# Установка зависимостей на Debian/Ubuntu
sudo apt update && sudo apt install -y nginx mysql-server nodejs npm git curl

# Установка Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Автоматическое развертывание

### Вариант 1: Полностью автоматический (рекомендуется)

```bash
# 1. Распаковать проект
unzip utmn-security.zip
cd utmn-security

# 2. Сделать скрипт исполняемым
chmod +x deploy-http.sh

# 3. Запустить автоматическую установку
./deploy-http.sh
```

Скрипт автоматически:
- ✅ Установит все зависимости
- ✅ Создаст базу данных MySQL
- ✅ Импортирует схему
- ✅ Создаст администратора (admin/admin123)
- ✅ Настроит Nginx для HTTP режима
- ✅ Создаст systemd сервис для backend
- ✅ Запустит все сервисы

**Время выполнения:** ~5-10 минут

### Вариант 2: Ручная установка

Следуйте подробной инструкции в файле `HTTP_REVERSE_PROXY_SETUP.md`

## После установки

### 1. Запуск в режиме разработки

```bash
cd /var/www/utmn-security

# Терминал 1 - Backend уже запущен через systemd
# Проверка: sudo systemctl status utmn-backend

# Терминал 2 - Frontend dev server
npm run dev
```

Откройте в браузере: `http://localhost:5173`

### 2. Вход в систему

```
Логин: admin
Пароль: admin123

⚠️ ОБЯЗАТЕЛЬНО измените пароль после первого входа!
```

### 3. Проверка работы

```bash
# Проверка backend API
curl http://localhost:3000/health

# Проверка через Nginx
curl http://localhost/health

# Статус сервисов
sudo systemctl status nginx utmn-backend mysql
```

## Основные команды

### Управление сервисами

```bash
# Статус
sudo systemctl status utmn-backend
sudo systemctl status nginx
sudo systemctl status mysql

# Перезапуск
sudo systemctl restart utmn-backend
sudo systemctl restart nginx

# Остановка
sudo systemctl stop utmn-backend

# Просмотр логов
journalctl -u utmn-backend -f
sudo tail -f /var/log/nginx/utmn-security-error.log
```

### Работа с базой данных

```bash
# Подключение к MySQL
mysql -u utmn_admin -p utmn_security

# Просмотр таблиц
mysql -u utmn_admin -p utmn_security -e "SHOW TABLES;"

# Подсчет записей
mysql -u utmn_admin -p utmn_security -e "
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'students', COUNT(*) FROM students
  UNION ALL
  SELECT 'employees', COUNT(*) FROM employees;
"
```

## Импорт данных

### Студенты (пример CSV)

Создайте файл `students.csv`:

```csv
student_id,full_name,faculty,course,group_number,phone,email
ST001,Иванов Иван Иванович,ИМиКН,2,ИВТ-21,+79123456789,ivanov@utmn.ru
ST002,Петрова Мария Петровна,ИБ,3,ЭК-20,+79123456790,petrova@utmn.ru
```

Импорт:

```bash
mysql -u utmn_admin -p utmn_security << EOF
LOAD DATA LOCAL INFILE 'students.csv' 
INTO TABLE students 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n' 
IGNORE 1 ROWS;
EOF
```

### Сотрудники (пример CSV)

Создайте файл `employees.csv`:

```csv
employee_id,full_name,department,position,phone,email
EMP001,Сидоров Петр Сидорович,ИМиКН,Преподаватель,+79123456791,sidorov@utmn.ru
EMP002,Смирнова Анна Ивановна,ИБ,Декан,+79123456792,smirnova@utmn.ru
```

Импорт:

```bash
mysql -u utmn_admin -p utmn_security << EOF
LOAD DATA LOCAL INFILE 'employees.csv' 
INTO TABLE employees 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n' 
IGNORE 1 ROWS;
EOF
```

### Парковочные записи (автоматическая генерация 300+)

```bash
# Создание скрипта генерации тестовых данных
cat > generate_parking_data.sql << 'EOF'
-- Создание парковочных зон
INSERT INTO parking_lots (name, capacity, current_occupancy) VALUES
('Главный корпус', 150, 0),
('Библиотека', 80, 0),
('Общежитие №1', 50, 0);

-- Генерация 300 парковочных записей
DELIMITER $$
CREATE PROCEDURE generate_parking_records()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE random_lot INT;
  DECLARE random_plate VARCHAR(15);
  DECLARE random_name VARCHAR(100);
  
  WHILE i <= 300 DO
    SET random_lot = FLOOR(1 + RAND() * 3);
    SET random_plate = CONCAT(
      CHAR(FLOOR(65 + RAND() * 26)),
      LPAD(FLOOR(RAND() * 1000), 3, '0'),
      CHAR(FLOOR(65 + RAND() * 26)),
      CHAR(FLOOR(65 + RAND() * 26)),
      LPAD(FLOOR(RAND() * 100), 2, '0')
    );
    SET random_name = CONCAT('Водитель ', i);
    
    INSERT INTO parking_records (lot_id, license_plate, owner_name, entry_time)
    VALUES (
      random_lot,
      random_plate,
      random_name,
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY)
    );
    
    SET i = i + 1;
  END WHILE;
END$$
DELIMITER ;

CALL generate_parking_records();
DROP PROCEDURE generate_parking_records;
EOF

# Выполнение
mysql -u utmn_admin -p utmn_security < generate_parking_data.sql
```

## Production сборка

После отладки соберите production версию:

```bash
cd /var/www/utmn-security

# Сборка frontend
npm run build

# Обновление Nginx конфига
sudo nano /etc/nginx/sites-available/utmn-security

# Раскомментируйте секцию:
# root /var/www/utmn-security/dist;
# try_files $uri $uri/ /index.html;

# И закомментируйте секцию с proxy_pass к Vite

# Перезапуск Nginx
sudo systemctl restart nginx
```

## Настройка внешнего Reverse Proxy

Настройте ваш внешний reverse proxy для проксирования HTTPS трафика на этот сервер:

### Nginx (внешний)

```nginx
upstream utmn_internal {
    server 192.168.1.100:80;  # IP вашего сервера
}

server {
    listen 443 ssl http2;
    server_name utmn-security.example.com;

    ssl_certificate /etc/letsencrypt/live/utmn-security.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/utmn-security.example.com/privkey.pem;

    location / {
        proxy_pass http://utmn_internal;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## Безопасность

### Базовые настройки firewall

```bash
sudo apt install ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (для reverse proxy)
sudo ufw enable
```

### Регулярные бэкапы

```bash
# Создание скрипта бэкапа
sudo nano /usr/local/bin/backup-utmn.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/utmn"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
mysqldump -u utmn_admin -p'YOUR_PASSWORD' utmn_security > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Удаление старых бэкапов (>30 дней)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
chmod +x /usr/local/bin/backup-utmn.sh

# Автоматизация через cron (ежедневно в 2:00)
sudo crontab -e
# 0 2 * * * /usr/local/bin/backup-utmn.sh
```

## Troubleshooting

### Backend не запускается

```bash
# Просмотр подробных логов
journalctl -u utmn-backend -n 100 --no-pager

# Проверка портов
sudo netstat -tulpn | grep 3000

# Проверка файлов конфигурации
cat backend/.env
```

### Nginx ошибки

```bash
# Проверка синтаксиса
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/utmn-security-error.log
```

### MySQL проблемы

```bash
# Проверка статуса
sudo systemctl status mysql

# Тест соединения
mysql -u utmn_admin -p -e "SELECT 1;"

# Проверка прав доступа
mysql -u root -p -e "SHOW GRANTS FOR 'utmn_admin'@'localhost';"
```

## Мониторинг

```bash
# Создание скрипта мониторинга
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
clear
echo "=== Статус сервисов ==="
sudo systemctl status nginx utmn-backend mysql --no-pager | grep Active

echo ""
echo "=== Использование портов ==="
sudo netstat -tulpn | grep -E ':(80|3000|3306)'

echo ""
echo "=== Последние логи backend ==="
journalctl -u utmn-backend -n 5 --no-pager

echo ""
echo "=== Статистика БД ==="
mysql -u utmn_admin -p utmn_security -e "
  SELECT 'Пользователи' as Таблица, COUNT(*) as Записей FROM users
  UNION ALL SELECT 'Студенты', COUNT(*) FROM students
  UNION ALL SELECT 'Сотрудники', COUNT(*) FROM employees
  UNION ALL SELECT 'Парковка', COUNT(*) FROM parking_records;
"
EOF

chmod +x ~/monitor.sh
./monitor.sh
```

## Полезные ссылки

- 📖 Подробная инструкция: `HTTP_REVERSE_PROXY_SETUP.md`
- 🔧 Документация API: `API_ENDPOINTS.md`
- 👥 Управление ролями: `ROLES.md`
- 🗄️ Схема БД: `database/schema.sql`

## Поддержка

При возникновении проблем:

1. Проверьте логи: `journalctl -u utmn-backend -f`
2. Проверьте статус сервисов: `sudo systemctl status nginx utmn-backend mysql`
3. Проверьте конфигурацию: `sudo nginx -t`
4. Проверьте подключение к БД: `mysql -u utmn_admin -p utmn_security -e "SHOW TABLES;"`

---

**Примечание:** Все команды предполагают, что вы работаете от пользователя с sudo привилегиями на Debian/Ubuntu системе.
