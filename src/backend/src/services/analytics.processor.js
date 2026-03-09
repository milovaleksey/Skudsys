/**
 * Процессор аналитики СКУД
 * Обрабатывает сырые данные согласно конфигурации из MQTT
 */

class AnalyticsProcessor {
  constructor() {
    this.config = null;
    this.rawData = null;
  }

  /**
   * Установить конфигурацию аналитики
   */
  setConfig(config) {
    this.config = config;
    console.log('[Analytics Processor] Конфигурация обновлена');
  }

  /**
   * Установить сырые данные
   */
  setRawData(data) {
    this.rawData = Array.isArray(data) ? data : [];
    console.log(`[Analytics Processor] Получено ${this.rawData.length} записей`);
  }

  /**
   * Обработать все типы аналитики согласно конфигурации
   */
  processAll() {
    if (!this.config || !this.rawData) {
      console.warn('[Analytics Processor] Нет конфигурации или данных');
      return {};
    }

    const result = {};

    this.config.analytics.forEach(analyticsConfig => {
      if (!analyticsConfig.enabled) return;

      try {
        const processed = this.processAnalytics(analyticsConfig);
        result[analyticsConfig.id] = processed;
      } catch (error) {
        console.error(`[Analytics Processor] Ошибка обработки ${analyticsConfig.id}:`, error.message);
      }
    });

    return result;
  }

  /**
   * Обработать один тип аналитики
   */
  processAnalytics(analyticsConfig) {
    const { type, config } = analyticsConfig;

    switch (type) {
      case 'statistics':
        return this.processStatistics(analyticsConfig);
      
      case 'timeSeries':
        return this.processTimeSeries(config);
      
      case 'ranking':
        return this.processRanking(config);
      
      case 'weekdayPattern':
        return this.processWeekdayPattern(config);
      
      case 'multiSeries':
        return this.processMultiSeries(config);
      
      case 'categorization':
        return this.processCategorization(config);
      
      case 'filtered':
        return this.processFiltered(config);
      
      case 'comparison':
        return this.processComparison(config);
      
      default:
        console.warn(`[Analytics Processor] Неизвестный тип: ${type}`);
        return null;
    }
  }

  /**
   * Обработка статистики
   */
  processStatistics(analyticsConfig) {
    const calculations = analyticsConfig.calculations || [];
    const result = {};

    calculations.forEach(calc => {
      const { metric, operation, field } = calc;

      switch (operation) {
        case 'sum':
          result[metric] = this.rawData.reduce((sum, item) => sum + (item[field] || 0), 0);
          break;

        case 'count_distinct':
          const uniqueValues = new Set(this.rawData.map(item => item[field]));
          result[metric] = uniqueValues.size;
          break;

        case 'avg_daily':
          const totalSum = this.rawData.reduce((sum, item) => sum + (item[field] || 0), 0);
          const uniqueDates = new Set(this.rawData.map(item => item.event_date));
          result[metric] = uniqueDates.size > 0 ? Math.round(totalSum / uniqueDates.size) : 0;
          break;

        case 'max_day':
          // Группировка по дням
          const byDay = {};
          this.rawData.forEach(item => {
            const date = item.event_date;
            byDay[date] = (byDay[date] || 0) + (item[field] || 0);
          });
          const maxDate = Object.keys(byDay).reduce((max, date) => 
            byDay[date] > byDay[max] ? date : max, Object.keys(byDay)[0]
          );
          result[metric] = {
            date: maxDate,
            value: byDay[maxDate]
          };
          break;
      }
    });

    return result;
  }

  /**
   * Обработка временных рядов
   */
  processTimeSeries(config) {
    const { groupBy, aggregation, field } = config;
    const grouped = {};

    this.rawData.forEach(item => {
      const key = item[groupBy];
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item[field] || 0);
    });

    return Object.keys(grouped).sort().map(key => ({
      date: key,
      count: aggregation === 'sum' 
        ? grouped[key].reduce((a, b) => a + b, 0)
        : Math.round(grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length)
    }));
  }

  /**
   * Обработка рейтинга (топ N)
   */
  processRanking(config) {
    const { groupBy, aggregation, field, limit, orderBy, showPercentage } = config;
    const grouped = {};

    this.rawData.forEach(item => {
      const key = item[groupBy];
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item[field] || 0);
    });

    const aggregated = Object.keys(grouped).map(key => ({
      name: key,
      count: aggregation === 'sum'
        ? grouped[key].reduce((a, b) => a + b, 0)
        : Math.round(grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length)
    }));

    // Сортировка
    aggregated.sort((a, b) => orderBy === 'desc' ? b.count - a.count : a.count - b.count);

    // Топ N
    const topN = aggregated.slice(0, limit);

    // Процент
    if (showPercentage) {
      const total = topN.reduce((sum, item) => sum + item.count, 0);
      topN.forEach(item => {
        item.percentage = total > 0 ? ((item.count / total) * 100).toFixed(2) : 0;
      });
    }

    return topN;
  }

  /**
   * Обработка паттерна по дням недели
   */
  processWeekdayPattern(config) {
    const { aggregation, field, weekdayLabels } = config;
    const grouped = {};

    this.rawData.forEach(item => {
      const date = new Date(item.event_date);
      const weekday = date.getDay() + 1; // 1 = Sunday, 2 = Monday, ...
      
      if (!grouped[weekday]) {
        grouped[weekday] = [];
      }
      grouped[weekday].push(item[field] || 0);
    });

    return Object.keys(grouped).sort((a, b) => a - b).map(weekday => ({
      day: weekdayLabels[weekday] || `День ${weekday}`,
      dayIndex: parseInt(weekday),
      count: aggregation === 'sum'
        ? grouped[weekday].reduce((a, b) => a + b, 0)
        : Math.round(grouped[weekday].reduce((a, b) => a + b, 0) / grouped[weekday].length)
    }));
  }

  /**
   * Обработка мультисерий (сравнение нескольких зон по времени)
   */
  processMultiSeries(config) {
    const { groupBy, aggregation, field, topN } = config;
    
    // Сначала находим топ N зон
    const zoneCounts = {};
    this.rawData.forEach(item => {
      const zone = item[groupBy[1]];
      zoneCounts[zone] = (zoneCounts[zone] || 0) + (item[field] || 0);
    });

    const topZones = Object.keys(zoneCounts)
      .sort((a, b) => zoneCounts[b] - zoneCounts[a])
      .slice(0, topN);

    // Группируем по дате и зоне
    const grouped = {};

    this.rawData.forEach(item => {
      const date = item[groupBy[0]];
      const zone = item[groupBy[1]];
      
      if (!topZones.includes(zone)) return;

      if (!grouped[date]) {
        grouped[date] = {};
      }
      if (!grouped[date][zone]) {
        grouped[date][zone] = [];
      }
      grouped[date][zone].push(item[field] || 0);
    });

    // Формируем результат
    return Object.keys(grouped).sort().map(date => {
      const row = { date };
      topZones.forEach(zone => {
        const values = grouped[date][zone] || [];
        row[zone] = values.length > 0
          ? (aggregation === 'sum' 
              ? values.reduce((a, b) => a + b, 0)
              : Math.round(values.reduce((a, b) => a + b, 0) / values.length))
          : 0;
      });
      return row;
    });
  }

  /**
   * Обработка категоризации
   */
  processCategorization(config) {
    const { categories, aggregation, field } = config;
    
    return categories.map(category => {
      // Фильтруем данные по категории (упрощенная фильтрация)
      const filtered = this.rawData.filter(item => {
        if (category.filter.includes('LIKE')) {
          const pattern = category.filter.split("'")[1].replace(/%/g, '');
          return item.root_zone_name.includes(pattern);
        }
        return false;
      });

      const total = filtered.reduce((sum, item) => sum + (item[field] || 0), 0);

      return {
        name: category.name,
        count: total,
        color: category.color
      };
    });
  }

  /**
   * Обработка фильтрованных данных
   */
  processFiltered(config) {
    const { filter, groupBy, aggregation, field, orderBy } = config;
    
    // Фильтрация (упрощенная)
    const filtered = this.rawData.filter(item => {
      if (filter.includes('LIKE')) {
        const pattern = filter.split("'")[1].replace(/%/g, '');
        return item.root_zone_name.includes(pattern);
      }
      return true;
    });

    // Группировка
    const grouped = {};
    filtered.forEach(item => {
      const key = item[groupBy];
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item[field] || 0);
    });

    const result = Object.keys(grouped).map(key => ({
      name: key,
      count: aggregation === 'sum'
        ? grouped[key].reduce((a, b) => a + b, 0)
        : Math.round(grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length)
    }));

    // Сортировка
    result.sort((a, b) => orderBy === 'desc' ? b.count - a.count : a.count - b.count);

    return result;
  }

  /**
   * Обработка сравнения групп
   */
  processComparison(config) {
    const { groups, aggregation, field } = config;
    
    return groups.map(group => {
      // Фильтрация по группе (упрощенная)
      const filtered = this.rawData.filter(item => {
        const date = new Date(item.event_date);
        const weekday = date.getDay() + 1;

        if (group.filter.includes('IN')) {
          const days = group.filter.match(/\d+/g).map(Number);
          return days.includes(weekday);
        }
        return false;
      });

      const values = filtered.map(item => item[field] || 0);
      const total = aggregation === 'avg'
        ? (values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0)
        : values.reduce((a, b) => a + b, 0);

      return {
        name: group.name,
        count: total,
        color: group.color
      };
    });
  }
}

module.exports = new AnalyticsProcessor();
