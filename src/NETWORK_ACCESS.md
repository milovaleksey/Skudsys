# 🌐 Доступ по сетевому IP адресу

## ✅ Теперь работает!

После исправления `vite.config.ts` приложение будет доступно:

- ✅ **Localhost:** http://localhost:5173
- ✅ **Локальная сеть:** http://192.168.x.x:5173
- ✅ **Внешний IP:** http://your-server-ip:5173

---

## 🚀 Для разработки (Dev сервер)

### 1. Запустить с доступом по сети:

```bash
npm run dev
```

Vite покажет:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### 2. Узнать IP адрес:

**Linux:**
```bash
hostname -I | awk '{print $1}'
# или
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig | findstr IPv4
```

### 3. Открыть с другого устройства:

Введите в браузере: `http://192.168.1.100:5173`

---

## 🔥 Для production (Nginx)

### Вариант 1: Vite dev сервер (НЕ рекомендуется)

```bash
# Запустить в фоне
nohup npm run dev > logs/vite.log 2>&1 &
```

⚠️ **Проблемы:**
- Нет автоматического перезапуска при сбое
- Медленнее чем production сборка
- Больше потребление памяти

### Вариант 2: Production сборка + Nginx (✅ Рекомендуется)

#### Шаг 1: Собрать проект

```bash
npm run build
```

Это создаст папку `dist/` с оптимизированными файлами.

#### Шаг 2: Установить Nginx (если еще нет)

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install nginx

# Запустить
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Шаг 3: Настроить Nginx

```bash
# Скопировать конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/utmn-security

# Отредактировать IP/домен
sudo nano /etc/nginx/sites-available/utmn-security
# Изменить: server_name 192.168.1.100 security.utmn.ru;

# Создать симлинк
sudo ln -s /etc/nginx/sites-available/utmn-security /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl reload nginx
```

#### Шаг 4: Скопировать файлы

```bash
# Создать директорию
sudo mkdir -p /var/www/utmn-security

# Скопировать сборку
sudo cp -r dist/* /var/www/utmn-security/

# Установить права
sudo chown -R www-data:www-data /var/www/utmn-security
```

#### Шаг 5: Открыть порт в firewall

```bash
# UFW (Debian/Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Или iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

#### Шаг 6: Проверить

Откройте в браузере: `http://192.168.1.100`

---

## 📦 Автоматическое развертывание (deploy.sh)

Используйте существующий скрипт `deploy.sh` для полного развертывания:

```bash
# На локальной машине - создать архив
npm run build
zip -r utmn-security.zip dist/ backend/ package*.json nginx.conf

# На сервере - развернуть
chmod +x deploy.sh
./deploy.sh utmn-security.zip
```

Скрипт автоматически:
1. Распакует архив
2. Установит зависимости
3. Настроит Nginx
4. Запустит backend
5. Скопирует frontend в `/var/www/`

---

## 🔒 Безопасность

### Для разработки:

**Внимание!** Dev сервер на `0.0.0.0:5173` доступен всем в сети.

**Рекомендации:**
- Используйте только в доверенной сети
- Не открывайте порт 5173 в интернет
- Для production используйте Nginx + HTTPS

### Для production:

1. **Используйте HTTPS** (после тестирования)
2. **Настройте firewall** (только 80, 443)
3. **Ограничьте доступ** (IP whitelist)
4. **Включите логирование** (Nginx)

---

## 🔧 Настройки firewall

### Вариант 1: UFW (проще)

```bash
# Сбросить правила
sudo ufw --force reset

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Для dev сервера (только для тестирования!)
sudo ufw allow 5173/tcp

# Включить
sudo ufw enable

# Проверить
sudo ufw status
```

### Вариант 2: iptables (гибче)

```bash
# Очистить правила
sudo iptables -F

# Разрешить localhost
sudo iptables -A INPUT -i lo -j ACCEPT

# Разрешить установленные соединения
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Dev сервер (опционально)
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT

# Запретить остальное
sudo iptables -P INPUT DROP

# Сохранить
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

### Вариант 3: Ограничить по IP (более безопасно)

```bash
# Разрешить доступ только с определенных IP
sudo ufw allow from 192.168.1.0/24 to any port 5173

# Или с конкретного IP
sudo ufw allow from 192.168.1.50 to any port 5173
```

---

## 📊 Мониторинг

### Проверить что сервер слушает:

```bash
# Проверить открытые порты
sudo netstat -tlnp | grep :5173
sudo netstat -tlnp | grep :80

# Или с ss
sudo ss -tlnp | grep :5173
```

### Проверить логи:

```bash
# Vite dev сервер
tail -f logs/vite.log

# Nginx
sudo tail -f /var/log/nginx/utmn-security-access.log
sudo tail -f /var/log/nginx/utmn-security-error.log
```

### Проверить доступность:

```bash
# С сервера
curl http://localhost:5173
curl http://192.168.1.100:5173

# С другой машины
curl http://192.168.1.100:5173
```

---

## ✅ Чеклист

### Dev сервер (5173):
- [ ] `vite.config.ts` содержит `host: '0.0.0.0'`
- [ ] `npm run dev` запущен
- [ ] Порт 5173 открыт в firewall
- [ ] Доступ по IP работает

### Production (80/443):
- [ ] `npm run build` выполнен
- [ ] Nginx установлен и настроен
- [ ] Конфиг скопирован в `/etc/nginx/sites-available/`
- [ ] Симлинк создан в `/etc/nginx/sites-enabled/`
- [ ] `nginx -t` прошел успешно
- [ ] Файлы скопированы в `/var/www/utmn-security/`
- [ ] Порты 80/443 открыты в firewall
- [ ] Backend запущен на порту 3001
- [ ] Доступ по IP работает

---

## 🎯 Итоговая конфигурация

### Для тестирования (HTTP):
```
Frontend: http://192.168.1.100:80 (Nginx)
Backend:  http://192.168.1.100:3001
Dev:      http://192.168.1.100:5173 (опционально)
```

### Для production (HTTPS):
```
Frontend: https://security.utmn.ru
Backend:  https://security.utmn.ru/v1/ (через Nginx proxy)
```

---

## 🚀 Быстрый старт

### Для разработки:
```bash
npm run dev
# Откройте: http://YOUR_IP:5173
```

### Для production:
```bash
npm run build
sudo cp -r dist/* /var/www/utmn-security/
sudo systemctl reload nginx
# Откройте: http://YOUR_IP
```

---

**Дата:** 20.01.2026  
**Статус:** ✅ Готово к работе по сети!
