#!/bin/bash

# Скрипт для проверки и запуска backend сервера

echo "🔍 Проверка backend сервера..."
echo ""

# Переход в директорию backend
cd "$(dirname "$0")/backend" || exit 1

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules не найдены. Установка зависимостей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей"
        exit 1
    fi
    echo "✅ Зависимости установлены"
    echo ""
fi

# Проверка .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден!"
    echo "Создайте файл .env на основе .env.example"
    echo ""
    if [ -f ".env.example" ]; then
        echo "Пример команды:"
        echo "  cp .env.example .env"
        echo "  nano .env  # отредактируйте настройки"
    fi
    exit 1
fi

# Проверка MQTT конфигурации
if [ ! -f ".env.mqtt" ]; then
    echo "ℹ️  Файл .env.mqtt не найден (опционально)"
    if [ -f ".env.mqtt.example" ]; then
        echo "Для использования MQTT создайте:"
        echo "  cp .env.mqtt.example .env.mqtt"
        echo "  nano .env.mqtt  # настройте MQTT брокер"
    fi
    echo ""
fi

# Проверка подключения к MySQL
echo "🔌 Проверка подключения к MySQL..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'utmn_security'
    });
    console.log('✅ MySQL подключение успешно');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    process.exit(1);
  }
}

checkDB();
"

if [ $? -ne 0 ]; then
    echo ""
    echo "Проверьте настройки в .env файле:"
    echo "  DB_HOST=localhost"
    echo "  DB_USER=root"
    echo "  DB_PASSWORD=your_password"
    echo "  DB_NAME=utmn_security"
    exit 1
fi

echo ""
echo "✅ Все проверки пройдены!"
echo ""

# Проверка, запущен ли уже сервер
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Порт 3000 уже занят!"
    echo ""
    echo "Возможно, сервер уже запущен."
    echo "Для остановки выполните:"
    echo "  lsof -ti:3000 | xargs kill -9"
    echo ""
    read -p "Остановить процесс и перезапустить? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Остановка процесса на порту 3000..."
        lsof -ti:3000 | xargs kill -9
        sleep 2
    else
        exit 0
    fi
fi

echo "🚀 Запуск backend сервера..."
echo ""
echo "Логи сервера:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Запуск сервера
npm run dev
