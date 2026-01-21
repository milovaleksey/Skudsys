# 🚀 Production Deployment Checklist - v1.0

## Переход от тестовых данных к реальным данным

---

## 📋 Перед развертыванием

### 1. Подготовка сервера
- [ ] Debian сервер настроен
- [ ] Nginx установлен и настроен
- [ ] MySQL 8.0+ установлен
- [ ] Node.js 18+ установлен
- [ ] Порты открыты (80, 443, 3000, 3306)
- [ ] Firewall настроен

### 2. База данных
- [ ] MySQL сервер запущен
- [ ] Создана база данных `utmn_security`
- [ ] Создан пользователь БД с правами
- [ ] Выполнены миграции (11 таблиц)
- [ ] Проверены индексы
- [ ] Настроен backup (автоматический)

### 3. Backend API
- [ ] Скрипт `deploy.sh` протестирован
- [ ] `.env` файл настроен с production параметрами
- [ ] JWT секретный ключ сгенерирован
- [ ] API endpoints протестированы
- [ ] CORS настроен правильно
- [ ] Rate limiting включен

### 4. Frontend
- [ ] Логотип ТюмГУ загружен (`/public/logo.png`)
- [ ] API URL обновлен на production
- [ ] Build выполнен успешно (`npm run build`)
- [ ] Static файлы оптимизированы

---

## 🔄 Миграция с тестовых на реальные данные

### Шаг 1: Подключение к реальному API

**Файлы для обновления:**

#### `/components/Login.tsx`
```typescript
// ЗАМЕНИТЬ:
const mockUser = { ... }; // УДАЛИТЬ

// НА:
const response = await axios.post('http://your-server.ru/api/auth/login', {
  username,
  password
});
const token = response.data.token;
localStorage.setItem('authToken', token);
```

#### `/components/UsersPage.tsx`
```typescript
// ЗАМЕНИТЬ:
const mockUsers = [...]; // УДАЛИТЬ

// НА:
useEffect(() => {
  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://your-server.ru/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(response.data);
  };
  fetchUsers();
}, []);
```

#### `/components/UserLogsPage.tsx`
```typescript
// ЗАМЕНИТЬ:
const mockLogs = [...]; // УДАЛИТЬ

// НА:
useEffect(() => {
  const fetchLogs = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://your-server.ru/api/logs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setLogs(response.data);
  };
  fetchLogs();
}, []);
```

#### `/components/ParkingPage.tsx`
```typescript
// ЗАМЕНИТЬ:
const parkingK1: ParkingLot = { ... }; // УДАЛИТЬ
const parkingK5: ParkingLot = { ... }; // УДАЛИТЬ

// НА:
const [parkingK1, setParkingK1] = useState<ParkingLot | null>(null);
const [parkingK5, setParkingK5] = useState<ParkingLot | null>(null);

useEffect(() => {
  const fetchParkingData = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://your-server.ru/api/parking', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setParkingK1(response.data.k1);
    setParkingK5(response.data.k5);
  };
  fetchParkingData();
  
  // Обновление каждые 30 секунд
  const interval = setInterval(fetchParkingData, 30000);
  return () => clearInterval(interval);
}, []);
```

#### `/components/StudentsPage.tsx`
```typescript
// ЗАМЕНИТЬ:
const mockStudents = [...]; // УДАЛИТЬ

// НА:
const [students, setStudents] = useState([]);

useEffect(() => {
  const fetchStudents = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://your-server.ru/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStudents(response.data);
  };
  fetchStudents();
}, []);
```

#### `/components/StaffPage.tsx`
```typescript
// ЗАМЕНИТЬ:
const mockStaff = [...]; // УДАЛИТЬ

// НА:
const [staff, setStaff] = useState([]);

useEffect(() => {
  const fetchStaff = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get('http://your-server.ru/api/staff', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStaff(response.data);
  };
  fetchStaff();
}, []);
```

---

## 🔐 Безопасность

### Обязательно перед продакшеном:
- [ ] Изменить JWT SECRET в `.env`
- [ ] Изменить пароль БД
- [ ] Включить HTTPS (Let's Encrypt)
- [ ] Настроить CORS только на ваш домен
- [ ] Включить rate limiting
- [ ] Настроить логирование ошибок
- [ ] Скрыть stack traces в production
- [ ] Включить helmet.js для security headers

### `.env` файл (пример):
```bash
# Production Environment
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=STRONG_PASSWORD_HERE  # ЗАМЕНИТЬ!

# JWT
JWT_SECRET=VERY_STRONG_SECRET_KEY_HERE  # ЗАМЕНИТЬ!
JWT_EXPIRES_IN=24h

# Server
PORT=3000
API_URL=https://your-domain.ru/api  # ЗАМЕНИТЬ!

# MQTT (если используется)
MQTT_BROKER=mqtt://localhost:1883
MQTT_USER=utmn_mqtt
MQTT_PASSWORD=MQTT_PASSWORD_HERE  # ЗАМЕНИТЬ!
```

---

## 🌐 Nginx конфигурация

### `/etc/nginx/sites-available/utmn-security`
```nginx
server {
    listen 80;
    server_name your-domain.ru;  # ЗАМЕНИТЬ!

    # Frontend
    location / {
        root /var/www/utmn-security/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Логи
    access_log /var/log/nginx/utmn-security-access.log;
    error_log /var/log/nginx/utmn-security-error.log;
}
```

---

## 🔄 Процесс развертывания

### 1. Backup текущей версии (если есть)
```bash
cd /root
mkdir -p backups
cp -r utmn-security backups/utmn-security-$(date +%Y%m%d-%H%M%S)
mysqldump -u root -p utmn_security > backups/db-$(date +%Y%m%d-%H%M%S).sql
```

### 2. Развертывание новой версии
```bash
# Загрузить ZIP архив
cd /root
unzip utmn-security-v1.0.zip -d utmn-security

# Запустить скрипт развертывания
cd utmn-security
chmod +x deploy.sh
./deploy.sh
```

### 3. Проверка
```bash
# Проверить backend
curl http://localhost:3000/api/health

# Проверить MySQL
mysql -u root -p -e "USE utmn_security; SHOW TABLES;"

# Проверить Nginx
nginx -t
systemctl reload nginx

# Проверить сервис
systemctl status utmn-security
journalctl -u utmn-security -f
```

---

## 📊 Мониторинг

### Что отслеживать:
- [ ] CPU и RAM сервера
- [ ] Место на диске
- [ ] Количество подключений к MySQL
- [ ] Response time API
- [ ] Ошибки в логах
- [ ] Количество активных пользователей

### Инструменты:
```bash
# Логи backend
journalctl -u utmn-security -f

# Логи Nginx
tail -f /var/log/nginx/utmn-security-access.log
tail -f /var/log/nginx/utmn-security-error.log

# MySQL процессы
mysql -u root -p -e "SHOW PROCESSLIST;"

# Системные ресурсы
htop
df -h
free -m
```

---

## 🧪 Тестирование

### После развертывания протестировать:
- [ ] Авторизация (login/logout)
- [ ] Создание пользователя
- [ ] Редактирование пользователя
- [ ] Удаление пользователя
- [ ] Просмотр логов
- [ ] Фильтры на странице логов
- [ ] Парковочная система (обновление данных)
- [ ] Поиск по парковкам
- [ ] Конструктор дашборда
- [ ] Drag-and-drop виджетов
- [ ] Все пункты меню открываются
- [ ] Логотип отображается корректно

---

## 📱 Контакты для поддержки

**В случае проблем:**
1. Проверить логи (см. раздел Мониторинг)
2. Перезапустить сервисы:
   ```bash
   systemctl restart utmn-security
   systemctl restart nginx
   systemctl restart mysql
   ```
3. Откатиться на backup:
   ```bash
   systemctl stop utmn-security
   rm -rf /root/utmn-security
   cp -r /root/backups/utmn-security-XXXXXXXX /root/utmn-security
   systemctl start utmn-security
   ```

---

## ✅ Финальная проверка

### Перед запуском в продакшн:
- [ ] ✅ Все mock данные заменены на реальные API вызовы
- [ ] ✅ Логотип ТюмГУ загружен
- [ ] ✅ .env файл настроен
- [ ] ✅ JWT секрет изменен
- [ ] ✅ Пароли БД изменены
- [ ] ✅ Nginx настроен
- [ ] ✅ HTTPS включен (для продакшена)
- [ ] ✅ Backup настроен
- [ ] ✅ Мониторинг работает
- [ ] ✅ Тестирование пройдено
- [ ] ✅ Документация обновлена

---

**🎉 Готово к запуску в продакшн!**

**Дата готовности:** 21 января 2026  
**Версия:** 1.0  
**Статус:** Production Ready ✅
