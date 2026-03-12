/**
 * Тестовый скрипт для публикации аномальных событий в MQTT топик Skud/baddialsevent
 * 
 * Использование:
 * node test-mqtt-bad-events.js
 */

const mqtt = require('mqtt');

// Конфигурация MQTT (берем из .env или используем значения по умолчанию)
const MQTT_BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 1883;
const MQTT_USERNAME = process.env.MQTT_USERNAME || undefined;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || undefined;

const TOPIC = 'Skud/baddialsevent';

// Подключение к MQTT брокеру
const url = `mqtt://${MQTT_BROKER}:${MQTT_PORT}`;
console.log(`🔌 Подключение к MQTT брокеру: ${url}`);

const client = mqtt.connect(url, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `test_publisher_${Date.now()}`,
});

client.on('connect', () => {
  console.log('✅ Подключено к MQTT брокеру');
  
  // Генерируем тестовое аномальное событие
  const badEvent = {
    time_label: new Date().toISOString(),
    Тип_события: 'Проход запрещен',
    ФИО_пользователя: 'Тестовый Пользователь',
    UPN: 'test.user@utmn.ru',
    Zone: 'Главное здание',
    Child_Zone: 'Вход А',
    Device: 'Турникет №1',
    identificator: Math.floor(Math.random() * 1000000)
  };

  console.log('📤 Публикация тестового события в топик:', TOPIC);
  console.log('📋 Данные события:', JSON.stringify(badEvent, null, 2));

  client.publish(TOPIC, JSON.stringify(badEvent), (err) => {
    if (err) {
      console.error('❌ Ошибка публикации:', err.message);
    } else {
      console.log('✅ Событие успешно опубликовано!');
    }
    
    // Закрываем соединение через 1 секунду
    setTimeout(() => {
      console.log('🔌 Отключение от брокера...');
      client.end();
      process.exit(0);
    }, 1000);
  });
});

client.on('error', (error) => {
  console.error('❌ Ошибка подключения к MQTT:', error.message);
  process.exit(1);
});

// Публикация нескольких событий с интервалом (если передан параметр --multiple)
if (process.argv.includes('--multiple')) {
  let counter = 0;
  const maxEvents = 5;
  
  client.on('connect', () => {
    console.log(`📤 Режим множественной публикации: ${maxEvents} событий`);
    
    const interval = setInterval(() => {
      if (counter >= maxEvents) {
        clearInterval(interval);
        setTimeout(() => {
          console.log('🔌 Отключение от брокера...');
          client.end();
          process.exit(0);
        }, 1000);
        return;
      }
      
      const badEvent = {
        time_label: new Date().toISOString(),
        Тип_события: ['Проход запрещен', 'Карта не найдена', 'Истекший срок доступа'][counter % 3],
        ФИО_пользователя: `Тестовый Пользователь ${counter + 1}`,
        UPN: `test.user${counter + 1}@utmn.ru`,
        Zone: 'Главное здание',
        Child_Zone: ['Вход А', 'Вход Б', 'Вход В'][counter % 3],
        Device: `Турникет №${counter + 1}`,
        identificator: Math.floor(Math.random() * 1000000)
      };
      
      console.log(`📤 [${counter + 1}/${maxEvents}] Публикация события...`);
      
      client.publish(TOPIC, JSON.stringify(badEvent), (err) => {
        if (err) {
          console.error('❌ Ошибка публикации:', err.message);
        } else {
          console.log(`✅ [${counter + 1}/${maxEvents}] Событие опубликовано`);
        }
      });
      
      counter++;
    }, 2000); // Каждые 2 секунды
  });
}
