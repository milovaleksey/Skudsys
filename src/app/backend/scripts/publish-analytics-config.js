/**
 * Скрипт для публикации конфигурации аналитики в MQTT
 * Использование: node scripts/publish-analytics-config.js
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

// Топики
const CONFIG_TOPIC = 'Skud/analytics/config';

// Конфигурация аналитики
const analyticsConfig = {
  version: "1.0",
  last_updated: new Date().toISOString(),
  analytics: [
    {
      id: "total_stats",
      name: "Общая статистика",
      type: "statistics",
      enabled: true,
      calculations: [
        {
          metric: "total_passes",
          operation: "sum",
          field: "total_events"
        },
        {
          metric: "unique_zones",
          operation: "count_distinct",
          field: "root_zone_name"
        },
        {
          metric: "avg_daily_passes",
          operation: "avg_daily",
          field: "total_events"
        },
        {
          metric: "peak_day",
          operation: "max_day",
          field: "total_events"
        }
      ]
    },
    {
      id: "time_series",
      name: "Временной ряд проходов",
      type: "timeSeries",
      enabled: true,
      config: {
        groupBy: "event_date",
        aggregation: "sum",
        field: "total_events"
      }
    },
    {
      id: "top_zones",
      name: "Топ активных зон",
      type: "ranking",
      enabled: true,
      config: {
        groupBy: "root_zone_name",
        aggregation: "sum",
        field: "total_events",
        limit: 100, // ✅ УВЕЛИЧЕН ЛИМИТ ДО 100!
        orderBy: "desc",
        showPercentage: true
      }
    },
    {
      id: "weekday_pattern",
      name: "Распределение по дням недели",
      type: "weekdayPattern",
      enabled: true,
      config: {
        aggregation: "sum",
        field: "total_events",
        weekdayLabels: {
          "1": "Вс",
          "2": "Пн",
          "3": "Вт",
          "4": "Ср",
          "5": "Чт",
          "6": "Пт",
          "7": "Сб"
        }
      }
    },
    {
      id: "top_zones_multi",
      name: "Топ зон по времени",
      type: "multiSeries",
      enabled: true,
      config: {
        groupBy: ["event_date", "root_zone_name"],
        aggregation: "sum",
        field: "total_events",
        topN: 5
      }
    },
    {
      id: "building_types",
      name: "Типы зданий",
      type: "categorization",
      enabled: true,
      config: {
        categories: [
          {
            name: "Учебные корпуса",
            filter: "root_zone_name LIKE '%Корпус%'",
            color: "#00aeef"
          },
          {
            name: "Общежития",
            filter: "root_zone_name LIKE '%Общежитие%'",
            color: "#0088cc"
          },
          {
            name: "Другие",
            filter: "root_zone_name NOT LIKE '%Корпус%' AND root_zone_name NOT LIKE '%Общежитие%'",
            color: "#666666"
          }
        ],
        aggregation: "sum",
        field: "total_events"
      }
    },
    {
      id: "dormitory_analysis",
      name: "Анализ общежитий",
      type: "filtered",
      enabled: true,
      config: {
        filter: "root_zone_name LIKE '%Общежитие%'",
        groupBy: "root_zone_name",
        aggregation: "sum",
        field: "total_events",
        orderBy: "desc"
      }
    },
    {
      id: "zone_comparison",
      name: "Сравнение зон по типам дней",
      type: "comparison",
      enabled: true,
      config: {
        groups: [
          {
            name: "Будние дни",
            filter: "DAYOFWEEK(event_date) IN (2,3,4,5,6)",
            color: "#00aeef"
          },
          {
            name: "Выходные",
            filter: "DAYOFWEEK(event_date) IN (1,7)",
            color: "#0088cc"
          }
        ],
        aggregation: "avg",
        field: "total_events"
      }
    },
    {
      id: "monthly_trend",
      name: "Месячный тренд",
      type: "trend",
      enabled: true,
      config: {
        groupBy: "event_date",
        aggregation: "sum",
        field: "total_events",
        period: "month"
      }
    },
    {
      id: "hourly_distribution",
      name: "Распределение по часам",
      type: "heatmap",
      enabled: true,
      config: {
        xAxis: "event_date",
        yAxis: "root_zone_name",
        aggregation: "sum",
        field: "total_events"
      }
    }
  ]
};

// Подключение к MQTT
console.log('🔌 Подключение к MQTT брокеру...');
console.log(`   Брокер: ${MQTT_BROKER}:${MQTT_PORT}`);

const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `analytics-config-publisher-${Date.now()}`,
  clean: true,
  reconnectPeriod: 0 // Не переподключаться
});

client.on('connect', () => {
  console.log('✅ Подключено к MQTT брокеру');
  console.log(`📤 Публикация конфигурации аналитики в топик: ${CONFIG_TOPIC}`);
  
  // Публикуем конфигурацию
  const payload = JSON.stringify(analyticsConfig, null, 2);
  
  client.publish(CONFIG_TOPIC, payload, { 
    qos: 1, 
    retain: true // ✅ ВАЖНО: retain=true чтобы конфигурация сохранялась
  }, (err) => {
    if (err) {
      console.error('❌ Ошибка публикации:', err);
      process.exit(1);
    } else {
      console.log('✅ Конфигурация успешно опубликована!');
      console.log('\n📊 Основные параметры:');
      console.log(`   - Топ зон: limit = ${analyticsConfig.analytics[2].config.limit}`);
      console.log(`   - Типов аналитики: ${analyticsConfig.analytics.length}`);
      console.log(`   - Версия: ${analyticsConfig.version}`);
      console.log('\n💡 Конфигурация сохранена с флагом retain, она будет доступна при перезапуске backend');
      
      // Сохраняем конфигурацию в файл для справки
      const configPath = path.join(__dirname, 'analytics-config.json');
      fs.writeFileSync(configPath, payload);
      console.log(`\n📁 Конфигурация также сохранена в файл: ${configPath}`);
      
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
