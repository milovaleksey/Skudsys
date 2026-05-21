# ⚡ Быстрый старт - Развертывание

Минимальная инструкция для развертывания системы UTMN Security.

---

## 🎯 За 3 шага

### 1️⃣ Скопируйте файлы в frontend

```bash
# Из корня проекта /opt/utmn-security
chmod +x copy-all-now.sh
./copy-all-now.sh
```

### 2️⃣ Разверните на сервер

```bash
# Дайте права на выполнение
sudo chmod +x deploy-from-sync.sh

# Запустите развертывание
sudo ./deploy-from-sync.sh
```

### 3️⃣ Проверьте статус

```bash
chmod +x status.sh
./status.sh
```

**Готово! 🎉**

---

## 🔧 Что было сделано

1. ✅ Скопированы frontend файлы в `/frontend`
2. ✅ Собран production frontend
3. ✅ Скопировано в `/var/www/utmn-security`
4. ✅ Перезапущены сервисы
5. ✅ Проверена работоспособность

---

## 📋 Полезные команды

```bash
# Развертывание
sudo ./deploy-from-sync.sh      # Полное развертывание
sudo ./quick-deploy.sh          # Быстрое без вопросов

# Проверка
./status.sh                     # Статус системы

# Откат
sudo ./rollback.sh              # Откат к предыдущей версии

# Логи
sudo journalctl -u utmn-security -f   # Backend логи
sudo tail -f /var/log/nginx/error.log # Nginx логи
```

---

## 🌐 Доступ к системе

После развертывания:

- **Frontend:** http://your-server/
- **API:** http://your-server/v1/
- **Health:** http://your-server/v1/health

**Тестовый пользователь:**
- Login: `admin`
- Password: `Admin2025`

---

## 🆘 Проблемы?

### Ошибка сборки frontend

```bash
cd /opt/utmn-security/frontend
npm install
npm run build
```

### Backend не запускается

```bash
sudo journalctl -u utmn-security -n 50
sudo systemctl status utmn-security
```

### Nginx показывает 502

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
curl http://localhost:3000/health
```

---

## 📚 Подробная документация

- [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) - Все скрипты развертывания
- [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md) - Исправление ошибок сборки
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - Миграция в /frontend

---

**Готово к использованию!** 🚀
