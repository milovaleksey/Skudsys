# ⚡ Быстрый старт - Система безопасности ТюмГУ

## 🎯 Цель

Развернуть рабочую версию системы с базой данных, доступную через HTTP из локальной сети.

---

## 🚀 Автоматическое развертывание (5 минут)

### Шаг 1: Подготовка сервера

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите базовые зависимости
sudo apt install -y curl wget git unzip
```

### Шаг 2: Установка Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
```

### Шаг 3: Установка MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Шаг 4: Установка Nginx

```bash
sudo apt install -y nginx
```

### Шаг 5: Развертывание приложения

```bash
# Клонируйте репозиторий или распакуйте архив
cd /path/to/utmn-security

# Сделайте скрипт исполняемым
chmod +x deploy-quick.sh

# Запустите автоматическую установку
sudo ./deploy-quick.sh
```

Скрипт спросит:
1. **Пароль root для MySQL** - введите пароль
2. **Создать нового пользователя БД?** - нажмите `y`
3. **Имя пользователя БД** - нажмите Enter (будет `utmn_user`)
4. Скрипт сгенерирует пароль автоматически

### Шаг 6: Готово! 🎉

```
🌐 Откройте в браузере: http://<IP-адрес-сервера>

👤 Войдите как администратор:
   Логин:  admin_security
   Пароль: test123
```

---

## 💻 Локальная разработка (без Nginx)

### Быстрый запуск

```bash
# 1. Клонируйте проект
git clone <repository-url>
cd utmn-security

# 2. Сделайте скрипт исполняемым
chmod +x start-dev.sh

# 3. Запустите в режиме разработки
./start-dev.sh
```

Скрипт автоматически:
- ✅ Установит зависимости
- ✅ Создаст .env файлы (если нужно)
- ✅ Проверит подключение к MySQL
- ✅ Запустит backend и frontend

### Доступ

```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
API:      http://localhost:3000/v1
Health:   http://localhost:3000/health
```

---

## 🌐 Доступ из сети

### Узнать IP-адрес сервера

```bash
hostname -I | awk '{print $1}'
```

### Настроить файрвол

```bash
# Разрешите HTTP и SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp

# Включите файрвол
sudo ufw enable
```

### Проверка доступности

```bash
# С самого сервера
curl http://localhost/health

# С другого компьютера в сети
curl http://<IP-адрес-сервера>/health
```

---

## 🔧 Управление системой

### Сервис backend

```bash
# Статус
sudo systemctl status utmn-security

# Перезапуск
sudo systemctl restart utmn-security

# Логи (последние 50 строк)
sudo journalctl -u utmn-security -n 50

# Логи в реальном времени
sudo journalctl -u utmn-security -f
```

### Nginx

```bash
# Статус
sudo systemctl status nginx

# Перезапуск
sudo systemctl restart nginx

# Проверка конфигурации
sudo nginx -t
```

### База данных

```bash
# Вход в MySQL
mysql -u utmn_user -p utmn_security

# Проверка статуса
sudo systemctl status mysql
```

---

## 🎭 Тестовые пользователи

| Роль | Логин | Пароль | Доступ |
|------|-------|--------|--------|
| **Администратор** | admin_security | test123 | Полный доступ |
| **Безопасность** | petrova@utmn.ru | SSO | Проходы, парковка |
| **Менеджер** | sidorov | test123 | Аналитика, отчеты |
| **Оператор** | kuznetsova@utmn.ru | SSO | Просмотр данных |

Подробнее: [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md)

⚠️ **ВАЖНО:** Смените пароли после первого входа!

---

## 🐛 Частые проблемы

### 1. Backend не запускается

```bash
# Проверьте логи
sudo journalctl -u utmn-security -n 50

# Проверьте порт 3000
sudo netstat -tulpn | grep 3000

# Проверьте MySQL
sudo systemctl status mysql
mysql -u utmn_user -p utmn_security -e "SELECT 1;"
```

### 2. Не могу подключиться из сети

```bash
# Проверьте файрвол
sudo ufw status

# Проверьте, что Nginx слушает
sudo netstat -tulpn | grep :80

# Проверьте IP
hostname -I
```

### 3. Ошибка "Cannot connect to database"

```bash
# Проверьте параметры в .env
cat /var/www/utmn-security/backend/.env | grep DB_

# Проверьте подключение
mysql -u utmn_user -p utmn_security -e "SELECT 1;"
```

### 4. Frontend показывает ошибку 404

```bash
# Проверьте файлы
ls -la /var/www/utmn-security/dist/

# Проверьте права
sudo chown -R www-data:www-data /var/www/utmn-security/

# Перезапустите Nginx
sudo systemctl restart nginx
```

---

## 📱 Проверка работы

### Health Check

```bash
# Backend
curl http://localhost:3000/health

# Через Nginx
curl http://localhost/health
```

Ожидаемый ответ:
```json
{
  "success": true,
  "message": "API работает",
  "timestamp": "2026-01-25T...",
  "version": "v1"
}
```

### API Login

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_security",
    "password": "test123",
    "authType": "local"
  }'
```

---

## 📚 Дополнительная документация

- [README.md](./README.md) - Общая информация о проекте
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полное руководство по развертыванию
- [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) - Тестовые учетные записи
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API документация

---

## 🔗 Полезные команды

### Остановить все сервисы

```bash
sudo systemctl stop utmn-security
sudo systemctl stop nginx
sudo systemctl stop mysql
```

### Запустить все сервисы

```bash
sudo systemctl start mysql
sudo systemctl start utmn-security
sudo systemctl start nginx
```

### Полная переустановка

```bash
# Остановите сервисы
sudo systemctl stop utmn-security
sudo systemctl disable utmn-security

# Удалите файлы
sudo rm -rf /var/www/utmn-security
sudo rm /etc/systemd/system/utmn-security.service
sudo rm /etc/nginx/sites-enabled/utmn-security
sudo rm /etc/nginx/sites-available/utmn-security

# Удалите базу данных (ОСТОРОЖНО!)
mysql -u root -p -e "DROP DATABASE utmn_security;"

# Запустите установку заново
sudo ./deploy-quick.sh
```

---

## 🎓 Следующие шаги

После успешного развертывания:

1. ✅ Смените пароль администратора
2. ✅ Создайте реальных пользователей
3. ✅ Настройте HTTPS (для production)
4. ✅ Настройте резервное копирование БД
5. ✅ Изучите возможности системы

---

**Система безопасности ТюмГУ - v2.0**  
**Фирменный цвет:** #00aeef 🎨
