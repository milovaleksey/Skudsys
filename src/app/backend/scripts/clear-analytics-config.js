/**
 * Скрипт для очистки конфигурации аналитики в MQTT
 * Использование: node scripts/clear-analytics-config.js
 */

require('dotenv').config();
const mqtt = require('mqtt');

// Конфигурация подключения к MQTT
const MQTT_BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 1883;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Топики
const CONFIG_TOPIC = 'Skud/analytics/config';

// Подключение к MQTT
console.log('🔌 Подключение к MQTT брокеру...');
console.log(`   Брокер: ${MQTT_BROKER}:${MQTT_PORT}`);

const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `analytics-config-cleaner-${Date.now()}`,
  clean: true,
  reconnectPeriod: 0
});

client.on('connect', () => {
  console.log('✅ Подключено к MQTT брокеру');
  console.log(`🧹 Очистка конфигурации аналитики в топике: ${CONFIG_TOPIC}`);
  
  // Публикуем пустое сообщение с retain для удаления
  client.publish(CONFIG_TOPIC, '', { 
    qos: 1, 
    retain: true 
  }, (err) => {
    if (err) {
      console.error('❌ Ошибка очистки:', err);
      process.exit(1);
    } else {
      console.log('✅ Старая конфигурация успешно удалена!');
      console.log('\n💡 Теперь запустите: npm run analytics:config');
      
      // Закрываем соединение
      setTimeout(() => {
        client.end();
        console.log('\n🔌 Отключено от MQTT');
        process.exit(0);
      }, 1000);
    }
  });
});

client.on('error', (err) => {
  console.error('❌ Ошибка подключения к MQTT:', err);
  process.exit(1);
});

client.on('offline', () => {
  console.error('❌ MQTT брокер недоступен');
  process.exit(1);
});
