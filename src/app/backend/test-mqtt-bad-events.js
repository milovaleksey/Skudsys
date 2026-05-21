#!/usr/bin/env node

/**
 * Тестовый скрипт для отправки аномальных событий в MQTT
 * Используется для тестирования страницы "Инженерный раздел"
 */

require('dotenv').config();
const mqtt = require('mqtt');

// Настройки подключения из .env
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

console.log('🚀 Тестовая отправка аномальных событий в MQTT');
console.log('📡 MQTT Broker:', MQTT_BROKER);

// Настройки подключения
const connectOptions = {
  clientId: `test_bad_events_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
};

if (MQTT_USERNAME && MQTT_PASSWORD) {
  connectOptions.username = MQTT_USERNAME;
  connectOptions.password = MQTT_PASSWORD;
}

// Подключение к брокеру
const client = mqtt.connect(MQTT_BROKER, connectOptions);

// Тестовые события
const testEvents = [
  {
    time_label: new Date().toISOString().replace('T', ' ').slice(0, 19),
    Тип_события: 'Отказ в доступе - неверный PIN',
    ФИО_пользователя: 'Иванов Иван Иванович',
    UPN: '12345678',
    Zone: 'Корпус 1',
    Child_Zone: 'Этаж 2',
    Device: 'Считыватель 10',
    identificator: 100001
  },
  {
    time_label: new Date(Date.now() - 60000).toISOString().replace('T', ' ').slice(0, 19),
    Тип_события: 'Отказ в доступе - истек срок карты',
    ФИО_пользователя: 'Петрова Мария Сергеевна',
    UPN: '87654321',
    Zone: 'Корпус 2',
    Child_Zone: 'Этаж 1',
    Device: 'Считыватель 5',
    identificator: 100002
  },
  {
    time_label: new Date(Date.now() - 120000).toISOString().replace('T', ' ').slice(0, 19),
    Тип_события: 'Отказ в доступе - нет прав доступа',
    ФИО_пользователя: 'Сидоров Петр Алексеевич',
    UPN: '11223344',
    Zone: 'Корпус 3',
    Child_Zone: 'Лаборатория',
    Device: 'Считыватель 15',
    identificator: 100003
  },
  {
    time_label: new Date(Date.now() - 180000).toISOString().replace('T', ' ').slice(0, 19),
    Тип_события: 'Отказ в доступе - заблокированная карта',
    ФИО_пользователя: null,
    UPN: null,
    Zone: 'Корпус 1',
    Child_Zone: 'Вход',
    Device: 'Считыватель 1',
    identificator: 100004
  },
  {
    time_label: new Date(Date.now() - 240000).toISOString().replace('T', ' ').slice(0, 19),
    Тип_события: 'Подозрительная активность',
    ФИО_пользователя: 'Кузнецова Анна Владимировна',
    UPN: '99887766',
    Zone: 'Корпус 4',
    Child_Zone: 'Серверная',
    Device: 'Считыватель 20',
    identificator: 100005
  }
];

client.on('connect', () => {
  console.log('✅ Подключено к MQTT брокеру');
  console.log('');
  console.log('📤 Отправка тестовых событий...');
  console.log('');

  // Отправляем все события одним массивом
  const topic = 'Skud/baddialsevent';
  const payload = JSON.stringify(testEvents);

  client.publish(topic, payload, { qos: 0 }, (err) => {
    if (err) {
      console.error('❌ Ошибка отправки:', err);
    } else {
      console.log(`✅ Отправлено ${testEvents.length} событий в топик: ${topic}`);
      console.log('');
      console.log('📊 События:');
      testEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.time_label} - ${event.Тип_события}`);
        console.log(`     ФИО: ${event.ФИО_пользователя || 'Нет данных'}`);
        console.log(`     Устройство: ${event.Device}, Зона: ${event.Zone}`);
        console.log('');
      });
    }

    // Отключаемся через 1 секунду
    setTimeout(() => {
      client.end();
      console.log('🔌 Отключено от MQTT брокера');
      console.log('');
      console.log('✅ Тест завершен! Проверьте страницу "Инженерный раздел"');
      process.exit(0);
    }, 1000);
  });
});

client.on('error', (error) => {
  console.error('❌ Ошибка подключения к MQTT:', error.message);
  process.exit(1);
});

client.on('close', () => {
  console.log('📡 Соединение закрыто');
});

// Таймаут на случай если не подключится
setTimeout(() => {
  console.error('❌ Timeout: Не удалось подключиться к MQTT брокеру');
  console.log('');
  console.log('💡 Проверьте:');
  console.log('  1. MQTT брокер запущен');
  console.log('  2. Настройки в .env корректны:');
  console.log(`     MQTT_BROKER=${MQTT_BROKER}`);
  if (MQTT_USERNAME) {
    console.log(`     MQTT_USERNAME=${MQTT_USERNAME}`);
    console.log(`     MQTT_PASSWORD=***`);
  }
  process.exit(1);
}, 10000);
