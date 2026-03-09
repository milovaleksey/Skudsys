/**
 * Скрипт для публикации тестовых данных аналитики из CSV в MQTT
 * Использование: node scripts/publish-analytics-data.js [путь_к_csv]
 */

require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// Конфигурация подключения к MQTT
const MQTT_BROKER = process.env.MQTT_BROKER || 'localhost';
const MQTT_PORT = parseInt(process.env.MQTT_PORT) || 1883;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Топик для данных
const DATA_TOPIC = 'Skud/analytics/events/aggregated';

// Путь к CSV файлу (можно передать аргументом)
const csvPath = process.argv[2] || path.join(__dirname, '../../imports/rez.csv');

console.log('📂 Чтение CSV файла:', csvPath);

// Проверяем существование файла
if (!fs.existsSync(csvPath)) {
  console.error(`❌ Файл не найден: ${csvPath}`);
  console.log('\n💡 Использование:');
  console.log('   node scripts/publish-analytics-data.js <путь_к_csv>');
  console.log('\n   Пример:');
  console.log('   node scripts/publish-analytics-data.js ../imports/rez.csv');
  process.exit(1);
}

// Читаем и парсим CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');

console.log(`📊 Найдено ${lines.length - 1} записей`);
console.log(`   Заголовки: ${headers.join(', ')}`);

// Парсим данные
const data = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  
  // Парсим CSV с учетом кавычек
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  // Создаем объект
  if (values.length === headers.length) {
    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      let value = values[index].replace(/^"|"$/g, ''); // Убираем кавычки
      
      // Преобразуем числа
      if (key === 'total_events') {
        value = parseInt(value) || 0;
      }
      
      obj[key] = value;
    });
    data.push(obj);
  }
}

console.log(`✅ Успешно распарсено ${data.length} записей`);
console.log('\n📈 Примеры записей:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

// Статистика
const uniqueZones = new Set(data.map(item => item.root_zone_name)).size;
const uniqueDates = new Set(data.map(item => item.event_date)).size;
const totalEvents = data.reduce((sum, item) => sum + item.total_events, 0);

console.log('\n📊 Статистика данных:');
console.log(`   Уникальных зон: ${uniqueZones}`);
console.log(`   Уникальных дат: ${uniqueDates}`);
console.log(`   Всего событий: ${totalEvents}`);

// Подключение к MQTT
console.log('\n🔌 Подключение к MQTT брокеру...');
console.log(`   Брокер: ${MQTT_BROKER}:${MQTT_PORT}`);

const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `analytics-data-publisher-${Date.now()}`,
  clean: true,
  reconnectPeriod: 0
});

client.on('connect', () => {
  console.log('✅ Подключено к MQTT брокеру');
  console.log(`📤 Публикация данных в топик: ${DATA_TOPIC}`);
  
  // Публикуем данные
  const payload = JSON.stringify(data);
  
  client.publish(DATA_TOPIC, payload, { 
    qos: 1, 
    retain: true // ✅ ВАЖНО: retain=true чтобы данные сохранялись
  }, (err) => {
    if (err) {
      console.error('❌ Ошибка публикации:', err);
      process.exit(1);
    } else {
      console.log('✅ Данные успешно опубликованы!');
      console.log(`   Размер payload: ${(payload.length / 1024).toFixed(2)} KB`);
      console.log('\n💡 Данные сохранены с флагом retain и будут доступны при подключении backend');
      
      // Закрываем соединение
      setTimeout(() => {
        client.end();
        console.log('\n🔌 Отключено от MQTT');
        console.log('\n✅ Готово! Теперь:');
        console.log('   1. Убедитесь что backend запущен');
        console.log('   2. Откройте страницу "Аналитика" в приложении');
        console.log('   3. Проверьте что отображаются все корпуса/зоны');
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
