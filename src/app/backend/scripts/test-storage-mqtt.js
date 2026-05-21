/**
 * Test script for Storage MQTT system
 * Publishes test configuration and data to MQTT broker
 */

const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl, {
  clientId: `test_storage_${Math.random().toString(16).substr(2, 8)}`,
  clean: true,
  username: process.env.MQTT_USERNAME || '',
  password: process.env.MQTT_PASSWORD || '',
});

// Test storage configuration
const testConfig = [
  {
    id: 'storage1',
    name: 'Гардероб 1',
    type: 'clothes',
    building: 'Корпус А',
    address: 'Этаж 1, Холл',
    total_capacity: 50,
    occupied_count: 12,
    status: 'active',
    mqtt_topic_status: 'storage/korpusA/wardrobe1/status',
    mqtt_topic_occupancy: 'storage/korpusA/wardrobe1/occupancy'
  },
  {
    id: 'storage2',
    name: 'Шкафчики 1',
    type: 'items',
    building: 'Корпус Б',
    address: 'Этаж 2, Коридор 3',
    total_capacity: 100,
    occupied_count: 45,
    status: 'active',
    mqtt_topic_status: 'storage/korpusB/locker1/status',
    mqtt_topic_occupancy: 'storage/korpusB/locker1/occupancy'
  },
  {
    id: 'storage3',
    name: 'Гардероб 2',
    type: 'clothes',
    building: 'Корпус А',
    address: 'Этаж 3, Холл',
    total_capacity: 30,
    occupied_count: 28,
    status: 'maintenance',
    mqtt_topic_status: 'storage/korpusA/wardrobe2/status',
    mqtt_topic_occupancy: 'storage/korpusA/wardrobe2/occupancy'
  }
];

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  console.log('📤 Publishing test storage configuration...\n');

  // Publish configuration
  client.publish('storage/config', JSON.stringify(testConfig), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish config:', err);
    } else {
      console.log('✅ Published storage configuration with 3 systems\n');
      
      // Publish test occupancy updates every 5 seconds
      let counter = 0;
      const interval = setInterval(() => {
        counter++;
        
        // Update occupancy for each system
        testConfig.forEach((system, index) => {
          const newOccupancy = Math.min(system.total_capacity, system.occupied_count + counter % 10);
          
          client.publish(system.mqtt_topic_occupancy, String(newOccupancy), { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Failed to publish occupancy for ${system.name}:`, err);
            } else {
              console.log(`📊 ${system.name}: ${newOccupancy}/${system.total_capacity}`);
            }
          });
          
          // Occasionally update status
          if (counter % 20 === 0) {
            const statuses = ['active', 'inactive', 'maintenance'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            client.publish(system.mqtt_topic_status, randomStatus, { qos: 1 }, (err) => {
              if (err) {
                console.error(`❌ Failed to publish status for ${system.name}:`, err);
              } else {
                console.log(`🔄 ${system.name} status: ${randomStatus}`);
              }
            });
          }
        });
        
        console.log('---');
        
        // Stop after 2 minutes
        if (counter >= 24) {
          clearInterval(interval);
          console.log('\n✅ Test completed. Disconnecting...');
          client.end();
          process.exit(0);
        }
      }, 5000);
    }
  });
});

client.on('error', (error) => {
  console.error('❌ MQTT connection error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Shutting down...');
  client.end();
  process.exit(0);
});

console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
console.log('Press Ctrl+C to stop\n');
