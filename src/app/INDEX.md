# 📚 Индекс документации

Полный путеводитель по всей документации проекта UTMN Security.

**Дата:** 25.01.2026 | **Версия:** 1.0.0

---

## 🚀 Быстрый старт

### Новичкам
1. [START_HERE.md](./START_HERE.md) - **НАЧНИТЕ ЗДЕСЬ**
2. [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - Визуальное руководство
3. [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md) - Быстрая инструкция

### Опытным пользователям
- [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) - Все скрипты развертывания

---

## 📖 Основная документация

### Развертывание и миграция

| Документ | Описание | Аудитория |
|----------|----------|-----------|
| [START_HERE.md](./START_HERE.md) | Главная инструкция, начните отсюда | Все |
| [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md) | Быстрый старт за 3 шага | Новички |
| [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) | Пошаговое руководство с примерами | Новички |
| [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) | Подробно о каждом скрипте | DevOps |
| [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) | Миграция в /frontend | Разработчики |
| [RESTRUCTURE.md](./RESTRUCTURE.md) | Детали реструктуризации | Архитекторы |
| [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md) | Исправление ошибок сборки | При проблемах |

### Техническая документация

| Документ | Описание | Аудитория |
|----------|----------|-----------|
| [README.md](./README.md) | Главный README проекта | Все |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Настройка backend и БД | DevOps, Разработчики |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Документация REST API | Разработчики |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Руководство разработчика | Разработчики |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Структура проекта | Разработчики |

### Frontend документация

| Документ | Описание | Аудитория |
|----------|----------|-----------|
| [frontend/README.md](./frontend/README.md) | Frontend документация | Frontend разработчики |

### Исправления и обновления

| Документ | Описание | Аудитория |
|----------|----------|-----------|
| [BUGFIX_AUTH_TOKEN.md](./BUGFIX_AUTH_TOKEN.md) | Исправление авторизации | DevOps |
| [FILES_CREATED.md](./FILES_CREATED.md) | Список созданных файлов | Все |
| [INDEX.md](./INDEX.md) | **Этот файл** - навигация | Все |

---

## 🛠️ Скрипты

### Основные скрипты развертывания

| Скрипт | Что делает | Sudo | Время |
|--------|------------|------|-------|
| `deploy-from-sync.sh` | Полное развертывание с бэкапом | ✅ | 3-5 мин |
| `quick-deploy.sh` | Быстрое развертывание | ✅ | 1-2 мин |
| `rollback.sh` | Откат к предыдущей версии | ✅ | 1 мин |
| `status.sh` | Проверка статуса системы | ❌ | 5 сек |

### Вспомогательные скрипты

| Скрипт | Что делает | Sudo | Время |
|--------|------------|------|-------|
| `copy-all-now.sh` | Копирование в /frontend | ❌ | 5 сек |
| `migrate-to-frontend.sh` | Интерактивная миграция | ❌ | 2-3 мин |
| `QUICK_MIGRATE.sh` | Быстрая миграция | ❌ | 1 мин |
| `BUILD_AND_DEPLOY_NEW.sh` | Сборка и деплой | ✅ | 3-4 мин |
| `make-scripts-executable.sh` | Права на выполнение | ❌ | 1 сек |

**Подробнее:** [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md)

---

## 🎯 Сценарии использования

### Первое развертывание

**Путь:**
1. [START_HERE.md](./START_HERE.md) - общее понимание
2. [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - пошаговые команды
3. Выполнить команды
4. [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) - для деталей

**Время:** 15-20 минут

### Обновление системы

**Путь:**
1. [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md)
2. Запустить `sudo ./quick-deploy.sh`
3. Проверить `./status.sh`

**Время:** 3-5 минут

### Миграция в /frontend

**Путь:**
1. [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)
2. [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md) (при ошибках)
3. [frontend/README.md](./frontend/README.md) - работа с frontend

**Время:** 10-15 минут

### Откат при проблемах

**Путь:**
1. [DEPLOYMENT_SCRIPTS.md#rollback.sh](./DEPLOYMENT_SCRIPTS.md#rollbacksh)
2. Запустить `sudo ./rollback.sh`
3. Проверить логи

**Время:** 2-3 минуты

### Разработка frontend

**Путь:**
1. [frontend/README.md](./frontend/README.md)
2. [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📊 Уровни документации

### 🟢 Начальный уровень

Для тех кто впервые работает с проектом:

1. ✅ [START_HERE.md](./START_HERE.md)
2. ✅ [VISUAL_GUIDE.md](./VISUAL_GUIDE.md)
3. ✅ [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md)
4. ✅ [README.md](./README.md)

### 🟡 Средний уровень

Для администраторов и DevOps:

1. ✅ [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md)
2. ✅ [BUGFIX_AUTH_TOKEN.md](./BUGFIX_AUTH_TOKEN.md)
3. ✅ [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

### 🔴 Продвинутый уровень

Для разработчиков и архитекторов:

1. ✅ [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. ✅ [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. ✅ [RESTRUCTURE.md](./RESTRUCTURE.md)
4. ✅ [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)
5. ✅ [frontend/README.md](./frontend/README.md)

---

## 🔍 Поиск по темам

### Развертывание
- [START_HERE.md](./START_HERE.md) - главная инструкция
- [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md) - быстрый старт
- [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) - детали скриптов
- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - с примерами

### Миграция в /frontend
- [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) - полная инструкция
- [RESTRUCTURE.md](./RESTRUCTURE.md) - детали
- [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md) - решение проблем

### Frontend разработка
- [frontend/README.md](./frontend/README.md) - Frontend документация
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - руководство
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API

### Решение проблем
- [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md) - ошибки сборки
- [BUGFIX_AUTH_TOKEN.md](./BUGFIX_AUTH_TOKEN.md) - проблемы авторизации
- [DEPLOYMENT_SCRIPTS.md#решение-проблем](./DEPLOYMENT_SCRIPTS.md) - общие проблемы
- [README.md#решение-проблем](./README.md) - FAQ

### API и Backend
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - REST API
- [ROLES_AND_USERS_API.md](./ROLES_AND_USERS_API.md) - API ролей
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - разработка

### Структура проекта
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - полная структура
- [RESTRUCTURE.md](./RESTRUCTURE.md) - новая структура
- [FILES_CREATED.md](./FILES_CREATED.md) - созданные файлы

### Скрипты
- [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) - все скрипты
- [FILES_CREATED.md#скрипты](./FILES_CREATED.md) - список скриптов

---

## 🎓 Обучающие материалы

### Новичок → Эксперт

**Неделя 1: Основы**
- День 1-2: [README.md](./README.md) + [START_HERE.md](./START_HERE.md)
- День 3-4: [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) + практика
- День 5-7: [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md)

**Неделя 2: Углубление**
- День 1-3: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- День 4-5: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- День 6-7: [frontend/README.md](./frontend/README.md)

**Неделя 3: Мастерство**
- День 1-2: [RESTRUCTURE.md](./RESTRUCTURE.md)
- День 3-4: [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)
- День 5-7: Практика + кастомизация

---

## 📝 Чеклисты

### Чеклист первого развертывания

- [ ] Прочитал [START_HERE.md](./START_HERE.md)
- [ ] Установил права: `./make-scripts-executable.sh`
- [ ] Скопировал файлы: `./copy-all-now.sh`
- [ ] Собрал frontend: `cd frontend && npm run build`
- [ ] Развернул: `sudo ./deploy-from-sync.sh`
- [ ] Проверил статус: `./status.sh`
- [ ] Протестировал в браузере
- [ ] Изменил пароль admin

### Чеклист обновления

- [ ] Сделал изменения в коде
- [ ] Протестировал локально
- [ ] Запустил `sudo ./deploy-from-sync.sh`
- [ ] Проверил `./status.sh`
- [ ] Протестировал в браузере
- [ ] Проверил логи

### Чеклист отката

- [ ] Заметил проблему
- [ ] Проверил логи: `sudo journalctl -u utmn-security`
- [ ] Запустил откат: `sudo ./rollback.sh`
- [ ] Выбрал версию для восстановления
- [ ] Проверил статус: `./status.sh`
- [ ] Протестировал работу

---

## 🔗 Быстрые ссылки

### Самые важные документы
1. [START_HERE.md](./START_HERE.md) ⭐⭐⭐⭐⭐
2. [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) ⭐⭐⭐⭐⭐
3. [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md) ⭐⭐⭐⭐
4. [README.md](./README.md) ⭐⭐⭐⭐

### Для решения проблем
- [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md)
- [BUGFIX_AUTH_TOKEN.md](./BUGFIX_AUTH_TOKEN.md)
- [DEPLOYMENT_SCRIPTS.md#решение-проблем](./DEPLOYMENT_SCRIPTS.md)

### Для разработчиков
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- [frontend/README.md](./frontend/README.md)

---

## 📞 Куда обращаться

### По развертыванию
→ [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md)

### По миграции в /frontend
→ [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)

### По ошибкам сборки
→ [FIX_BUILD_ERROR.md](./FIX_BUILD_ERROR.md)

### По API
→ [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### По frontend разработке
→ [frontend/README.md](./frontend/README.md)

### Общие вопросы
→ [README.md](./README.md)

---

## 🗺️ Карта документации

```
📚 Документация UTMN Security
│
├── 🚀 Быстрый старт
│   ├── START_HERE.md ⭐⭐⭐⭐⭐
│   ├── VISUAL_GUIDE.md ⭐⭐⭐⭐⭐
│   └── QUICK_START_DEPLOYMENT.md ⭐⭐⭐⭐
│
├── 🔧 Развертывание
│   ├── DEPLOYMENT_SCRIPTS.md ⭐⭐⭐⭐
│   ├── MIGRATION_COMPLETE.md
│   ├── RESTRUCTURE.md
│   └── BUILD_AND_DEPLOY.sh
│
├── 🐛 Решение проблем
│   ├── FIX_BUILD_ERROR.md
│   ├── BUGFIX_AUTH_TOKEN.md
│   └── DEPLOYMENT.md
│
├── 💻 Разработка
│   ├── DEVELOPER_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   ├── frontend/README.md
│   └── PROJECT_STRUCTURE.md
│
├── 📋 Справка
│   ├── FILES_CREATED.md
│   ├── INDEX.md (этот файл)
│   └── README.md
│
└── 🗄️ Архивная
    ├── SESSION_SUMMARY.md
    ├── CHANGELOG.md
    └── ...
```

---

## ✅ Статус документации

| Раздел | Статус | Полнота |
|--------|--------|---------|
| Быстрый старт | ✅ Готово | 100% |
| Развертывание | ✅ Готово | 100% |
| Решение проблем | ✅ Готово | 100% |
| Разработка | ✅ Готово | 90% |
| API | ✅ Готово | 95% |
| Frontend | ✅ Готово | 100% |

---

**Общая готовность документации:** 97%

**Дата последнего обновления:** 25.01.2026

**Версия:** 1.0.0

---

🎉 **Документация полная и готова к использованию!**