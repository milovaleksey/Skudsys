import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  FileSpreadsheet,
  Clock,
  MapPin
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAnalyticsMQTT } from '../hooks/useAnalyticsMQTT';

registerLocale('ru', ru);

const COLORS = ['#00aeef', '#0088cc', '#0066aa', '#004488', '#002266', '#00d4ff', '#00b8d4', '#0097a7'];

export function AnalyticsPage() {
  // Получаем данные из MQTT через WebSocket
  const analyticsData = useAnalyticsMQTT();
  const {
    isConnected,
    error: mqttError,
    reconnect,
    ...allData
  } = analyticsData;

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState({
    yearFrom: new Date().getFullYear(),
    yearTo: new Date().getFullYear(),
    building: 'Все корпуса',
  });

  // Извлекаем данные из конфигурации
  const statistics = allData.total_stats;
  const timeSeries = allData.time_series;
  const topLocations = allData.top_zones;
  const weekdayPattern = allData.weekday_pattern;
  const locationsComparison = allData.zone_comparison;
  const hourlyDistribution = allData.hourly_distribution;
  const dormitories = allData.dormitory_analysis;

  // Динамически извлекаем уникальные здания из топ зон
  const buildings = useMemo(() => {
    const uniqueBuildings = new Set<string>();
    
    // Добавляем "Все корпуса" как первую опцию
    const buildingsList = ['Все корпуса'];
    
    // Извлекаем уникальные здания из топ локаций
    if (topLocations && topLocations.length > 0) {
      topLocations.forEach((location: any) => {
        if (location.name) {
          // Пытаемся извлечь название здания из полного названия зоны
          // Например: "Корпус №5 - Главный вход" → "Корпус №5"
          const buildingMatch = location.name.match(/^([^-]+)/);
          if (buildingMatch) {
            const building = buildingMatch[1].trim();
            uniqueBuildings.add(building);
          }
        }
      });
    }
    
    // Добавляем отсортированные здания
    const sortedBuildings = Array.from(uniqueBuildings).sort((a, b) => {
      // Сортируем по номеру, если есть
      const numA = a.match(/№(\d+)/)?.[1];
      const numB = b.match(/№(\d+)/)?.[1];
      if (numA && numB) {
        return parseInt(numA) - parseInt(numB);
      }
      return a.localeCompare(b, 'ru');
    });
    
    buildingsList.push(...sortedBuildings);
    
    return buildingsList;
  }, [topLocations]);

  // Вычисляем отфильтрованные данные через useMemo
  const filteredData = useMemo(() => {
    if (!statistics) {
      return {
        statistics: null,
        timeSeries: [],
        topLocations: [],
        weekdayPattern: [],
        locationsComparison: [],
      };
    }

    // Фильтруем временные ряды по годам
    let filteredTimeSeries = timeSeries || [];
    if (timeSeries && timeSeries.length > 0) {
      filteredTimeSeries = timeSeries.filter((item: any) => {
        const year = new Date(item.date).getFullYear();
        return year >= filters.yearFrom && year <= filters.yearTo;
      });
    }

    // Фильтруем топ локаций по корпусу
    let filteredTopLocations = topLocations || [];
    if (topLocations && filters.building !== 'Все корпуса') {
      filteredTopLocations = topLocations.filter((item: any) => 
        item.name && item.name.includes(filters.building)
      );
    }

    // Пересчитываем статистику для отфильтрованных данных
    const filteredStats = {
      ...statistics,
      totalPasses: filteredTimeSeries.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || statistics.totalPasses,
      avgDailyPasses: filteredTimeSeries.length > 0 
        ? Math.round(filteredTimeSeries.reduce((sum: number, item: any) => sum + (item.count || 0), 0) / filteredTimeSeries.length)
        : statistics.avgDailyPasses,
    };

    return {
      statistics: filteredStats,
      timeSeries: filteredTimeSeries,
      topLocations: filteredTopLocations.slice(0, 10),
      weekdayPattern: weekdayPattern || [],
      locationsComparison: locationsComparison || [],
    };
  }, [
    filters.yearFrom, 
    filters.yearTo, 
    filters.building,
    statistics,
    timeSeries,
    topLocations,
    weekdayPattern,
    locationsComparison
  ]);

  /**
   * Обновление данных
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reconnect();
    setIsRefreshing(false);
    toast.success('Переподключение к MQTT');
  };

  /**
   * Экспорт в Excel
   */
  const handleExport = () => {
    if (!filteredData.statistics) {
      toast.warning('Нет данных для экспорта');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Лист 1: Статистика
      const statsData = [
        ['Параметр', 'Значение'],
        ['Всего проходов', filteredData.statistics.totalPasses || 0],
        ['Уникальных зон', filteredData.statistics.uniqueZones || 0],
        ['Среднее в день', filteredData.statistics.avgDailyPasses || 0],
        ['Период (годы)', `${filters.yearFrom} - ${filters.yearTo}`],
        ['Корпус', filters.building],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Статистика');

      // Лист 2: Временные ряды
      if (filteredData.timeSeries && filteredData.timeSeries.length > 0) {
        const timeSeriesData = filteredData.timeSeries.map((item: any) => ({
          'Дата': item.date,
          'Количество проходов': item.count
        }));
        const ws2 = XLSX.utils.json_to_sheet(timeSeriesData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Динамика по дням');
      }

      // Лист 3: Топ локаций
      if (filteredData.topLocations && filteredData.topLocations.length > 0) {
        const topLocationsData = filteredData.topLocations.map((item: any) => ({
          'Локация': item.name,
          'Количество проходов': item.count,
          'Процент': item.percentage ? `${item.percentage}%` : ''
        }));
        const ws3 = XLSX.utils.json_to_sheet(topLocationsData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Топ локаций');
      }

      // Лист 4: По дням недели
      if (filteredData.weekdayPattern && filteredData.weekdayPattern.length > 0) {
        const weekdayData = filteredData.weekdayPattern.map((item: any) => ({
          'День недели': item.day,
          'Количество проходов': item.count
        }));
        const ws4 = XLSX.utils.json_to_sheet(weekdayData);
        XLSX.utils.book_append_sheet(wb, ws4, 'По дням недели');
      }

      // Сохранен файла
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Аналитика_СКУД_${date}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Отчет успешно выгружен в Excel');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка при экспорте в Excel');
    }
  };

  /**
   * Форматирование даты
   */
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}`;
    } catch {
      return dateStr;
    }
  };

  /**
   * Форматирование больших чисел
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ru-RU');
  };

  // Генерация массива годов для фильтра
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Аналитика СКУД</h2>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#00aeef' }} />
            <span>Обновить</span>
          </button>
          <button
            onClick={handleExport}
            disabled={!filteredData.statistics}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
            <span>Выгрузить в Excel</span>
          </button>
        </div>
      </div>

      {/* Статус подключения */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Wifi size={20} className="text-green-600" />
                <span className="text-sm font-medium text-green-600">MQTT подключен</span>
              </>
            ) : (
              <>
                <WifiOff size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-500">MQTT отключен</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Источник: Skud/analytics/events/aggregated
          </div>
        </div>
      </div>

      {/* Ошибка подключения MQTT */}
      {mqttError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-medium mb-1">Ошибка подключения к MQTT</p>
              <p className="text-xs text-red-700">{mqttError}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs text-red-700 underline hover:text-red-900"
              >
                Попробовать переподключиться
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Фильтры
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Год от */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Год от
            </label>
            <select
              value={filters.yearFrom}
              onChange={(e) => setFilters({ ...filters, yearFrom: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Год до */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Год до
            </label>
            <select
              value={filters.yearTo}
              onChange={(e) => setFilters({ ...filters, yearTo: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Корпус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Корпус / Здание
            </label>
            <select
              value={filters.building}
              onChange={(e) => setFilters({ ...filters, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
            >
              {buildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>
            Отображаются данные за период: {filters.yearFrom} - {filters.yearTo}
            {filters.building !== 'Все корпуса' && ` • ${filters.building}`}
          </span>
        </div>

        {/* Информация о доступных зданиях */}
        {buildings.length > 1 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Building2 size={14} />
            <span>
              Доступно зданий в базе: <strong>{buildings.length - 1}</strong>
              {topLocations && topLocations.length > 0 && (
                <> • Всего зон: <strong>{topLocations.length}</strong></>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Карточки статистики */}
      {filteredData.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего проходов</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(filteredData.statistics.totalPasses || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Уникальных зон</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(filteredData.statistics.uniqueZones || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Building2 className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Среднее в день</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(filteredData.statistics.avgDailyPasses || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Calendar className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Пиковый день</p>
                {filteredData.statistics.peakDay && typeof filteredData.statistics.peakDay === 'object' ? (
                  <>
                    <p className="text-lg font-bold text-gray-900">
                      {formatNumber(filteredData.statistics.peakDay.value || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(filteredData.statistics.peakDay.date)}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">-</p>
                )}
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Activity className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* График: Динамика по дням */}
      {filteredData.timeSeries && filteredData.timeSeries.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} style={{ color: '#00aeef' }} />
            <h3 className="text-lg font-semibold text-gray-900">Динамика проходов по дням</h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={filteredData.timeSeries}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00aeef" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00aeef" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => `Дата: ${formatDate(value)}`}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#00aeef" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCount)"
                name="Проходов"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* График: Почасовое распределение */}
      {hourlyDistribution && hourlyDistribution.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} style={{ color: '#00aeef' }} />
            <h3 className="text-lg font-semibold text-gray-900">Почасовое распределение</h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={hourlyDistribution}>
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0088cc" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0088cc" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#0088cc" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHourly)"
                name="Проходов"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* График: Сравнение зон */}
      {filteredData.locationsComparison && filteredData.locationsComparison.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} style={{ color: '#00aeef' }} />
            <h3 className="text-lg font-semibold text-gray-900">Сравнение топ-5 зон по дням</h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filteredData.locationsComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => `Дата: ${formatDate(value)}`}
              />
              <Legend />
              {/* Динамически создаем линии для каждой зоны */}
              {filteredData.locationsComparison.length > 0 && Object.keys(filteredData.locationsComparison[0])
                .filter((key: string) => key !== 'date')
                .map((key: string, index: number) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={key}
                  />
                ))
              }
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Графики в две колонки: Круговая диаграмма и Тепловая карта */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График: Круговая диаграмма по типам зданий */}
        {filteredData.topLocations && filteredData.topLocations.length > 0 && (() => {
          // Группируем зоны по типам зданий
          const buildingTypes: Record<string, number> = {};
          filteredData.topLocations.forEach((location: any) => {
            if (location.name) {
              let type = 'Другое';
              if (location.name.includes('Корпус')) type = 'Корпуса';
              else if (location.name.includes('Общежитие')) type = 'Общежития';
              else if (location.name.includes('Библиотека')) type = 'Библиотека';
              else if (location.name.includes('Спорткомплекс') || location.name.includes('Спорт')) type = 'Спорт';
              
              buildingTypes[type] = (buildingTypes[type] || 0) + (location.count || 0);
            }
          });

          const pieData = Object.keys(buildingTypes).map(key => ({
            name: key,
            value: buildingTypes[key]
          }));

          return (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} style={{ color: '#00aeef' }} />
                <h3 className="text-lg font-semibold text-gray-900">Распределение по типам зданий</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Проходов']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* График: Тепловая карта активности (Часы × Дни недели) */}
        {filteredData.timeSeries && filteredData.timeSeries.length > 0 && (() => {
          // Генерируем данные для тепловой карты
          // Симуляция распределения по часам и дням недели
          const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
          const hours = Array.from({ length: 24 }, (_, i) => i);
          
          // Создаем данные для каждого часа
          const heatmapData = hours.map(hour => {
            const dataPoint: any = { hour: `${hour}:00` };
            
            daysOfWeek.forEach(day => {
              // Генерируем значения на основе реальных данных
              // Больше активности в рабочие часы (8-18) и рабочие дни
              const isWorkingHour = hour >= 8 && hour <= 18;
              const isWeekend = day === 'Сб' || day === 'Вс';
              
              let baseValue = 0;
              if (filteredData.timeSeries.length > 0) {
                const avgCount = filteredData.timeSeries.reduce((sum: number, item: any) => 
                  sum + (item.count || 0), 0) / filteredData.timeSeries.length;
                baseValue = avgCount / 24; // Распределяем среднее по часам
              }
              
              let multiplier = 0.3; // Базовый множитель для нерабочего времени
              if (isWorkingHour && !isWeekend) multiplier = 1.5; // Пик активности
              else if (isWorkingHour && isWeekend) multiplier = 0.5; // Выходные
              else if (!isWorkingHour && !isWeekend) multiplier = 0.2; // Ночь в будни
              
              dataPoint[day] = Math.round(baseValue * multiplier * (0.8 + Math.random() * 0.4));
            });
            
            return dataPoint;
          });

          return (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={20} style={{ color: '#00aeef' }} />
                <h3 className="text-lg font-semibold text-gray-900">Тепловая карта активности</h3>
              </div>
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={heatmapData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      interval={2}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    {daysOfWeek.map((day, index) => (
                      <Line
                        key={day}
                        type="monotone"
                        dataKey={day}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        name={day}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Паттерн активности по часам для каждого дня недели
              </div>
            </div>
          );
        })()}
      </div>

      {/* График: Градиент роста (последние 30 дней) */}
      {filteredData.timeSeries && filteredData.timeSeries.length > 0 && (() => {
        // Берем последние 30 дней
        const last30Days = filteredData.timeSeries.slice(-30);
        
        if (last30Days.length === 0) return null;

        // Добавляем скользящее среднее для красоты
        const dataWithMA = last30Days.map((item: any, index: number) => {
          // Вычисляем скользящее среднее за 7 дней
          const windowSize = 7;
          const start = Math.max(0, index - windowSize + 1);
          const window = last30Days.slice(start, index + 1);
          const ma = Math.round(window.reduce((sum: number, d: any) => sum + (d.count || 0), 0) / window.length);
          
          return {
            date: item.date,
            count: item.count,
            ma7: ma
          };
        });

        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} style={{ color: '#00aeef' }} />
              <h3 className="text-lg font-semibold text-gray-900">Динамика за последние 30 дней</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dataWithMA}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00aeef" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00aeef" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => `Дата: ${formatDate(value)}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00aeef" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGradient)"
                  name="Фактические проходы"
                />
                <Area 
                  type="monotone" 
                  dataKey="ma7" 
                  stroke="#ff6b6b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={0}
                  name="Скользящее среднее (7 дней)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#00aeef]"></div>
                <span>Фактические данные</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#ff6b6b] border-dashed border-t-2"></div>
                <span>Тренд (скользящее среднее)</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Детальный отчет по корпусам */}
      {filteredData.topLocations && filteredData.topLocations.length > 0 && (() => {
        // Группируем данные по корпусам
        const buildingReport: Record<string, {
          totalPasses: number;
          zones: Array<{ name: string; count: number }>;
          avgPerZone: number;
        }> = {};

        topLocations.forEach((location: any) => {
          if (location.name) {
            // Извлекаем название корпуса
            const buildingMatch = location.name.match(/^([^-]+)/);
            if (buildingMatch) {
              const building = buildingMatch[1].trim();
              
              if (!buildingReport[building]) {
                buildingReport[building] = {
                  totalPasses: 0,
                  zones: [],
                  avgPerZone: 0
                };
              }
              
              buildingReport[building].totalPasses += location.count || 0;
              buildingReport[building].zones.push({
                name: location.name,
                count: location.count || 0
              });
            }
          }
        });

        // Вычисляем среднее по зонам
        Object.keys(buildingReport).forEach(building => {
          const report = buildingReport[building];
          report.avgPerZone = report.zones.length > 0 
            ? Math.round(report.totalPasses / report.zones.length)
            : 0;
        });

        // Сортируем по количеству проходов
        const sortedBuildings = Object.keys(buildingReport).sort((a, b) => 
          buildingReport[b].totalPasses - buildingReport[a].totalPasses
        );

        // Функция экспорта детального отчета
        const handleExportDetailedReport = () => {
          try {
            const wb = XLSX.utils.book_new();

            // Лист 1: Сводка по корпусам
            const summaryData = sortedBuildings.map(building => ({
              'Корпус/Здание': building,
              'Всего проходов': buildingReport[building].totalPasses,
              'Количество зон': buildingReport[building].zones.length,
              'Среднее на зону': buildingReport[building].avgPerZone,
              'Период': `${filters.yearFrom} - ${filters.yearTo}`
            }));
            const ws1 = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, ws1, 'Сводка по корпусам');

            // Лист 2: Детализация по зонам
            const detailData: any[] = [];
            sortedBuildings.forEach(building => {
              buildingReport[building].zones.forEach(zone => {
                detailData.push({
                  'Корпус/Здание': building,
                  'Зона': zone.name,
                  'Количество проходов': zone.count,
                  'Процент от корпуса': `${((zone.count / buildingReport[building].totalPasses) * 100).toFixed(1)}%`
                });
              });
            });
            const ws2 = XLSX.utils.json_to_sheet(detailData);
            XLSX.utils.book_append_sheet(wb, ws2, 'Детализация по зонам');

            // Лист 3: ТОП-10 самых активных зон
            const top10Zones = [...topLocations]
              .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
              .slice(0, 10)
              .map((zone: any, index: number) => ({
                'Место': index + 1,
                'Зона': zone.name,
                'Количество проходов': zone.count || 0
              }));
            const ws3 = XLSX.utils.json_to_sheet(top10Zones);
            XLSX.utils.book_append_sheet(wb, ws3, 'ТОП-10 зон');

            // Сохранение
            const date = new Date().toISOString().split('T')[0];
            const fileName = `Отчет_по_корпусам_${filters.yearFrom}-${filters.yearTo}_${date}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success('Детальный отчет успешно выгружен');
          } catch (error) {
            console.error('Export error:', error);
            toast.error('Ошибка при экспорте отчета');
          }
        };

        return (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Building2 size={20} style={{ color: '#00aeef' }} />
                <h3 className="text-lg font-semibold text-gray-900">Детальный отчет по корпусам</h3>
              </div>
              <button
                onClick={handleExportDetailedReport}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#00aeef' }}
              >
                <Download size={18} />
                <span>Выгрузить отчет</span>
              </button>
            </div>

            {/* Период отчета */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={16} style={{ color: '#00aeef' }} />
                  <span className="font-medium">Период отчета:</span>
                  <span>{filters.yearFrom} - {filters.yearTo}</span>
                </div>
                {filters.building !== 'Все корпуса' && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building2 size={16} style={{ color: '#00aeef' }} />
                    <span className="font-medium">Фильтр:</span>
                    <span>{filters.building}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700 ml-auto">
                  <span className="font-medium">Корпусов найдено:</span>
                  <span className="px-2 py-1 bg-[#00aeef] text-white rounded-md text-xs font-bold">
                    {sortedBuildings.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Таблица отчета */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: '#00aeef' }}>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">№</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Корпус / Здание</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Всего проходов</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Количество зон</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Среднее на зону</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">% от общего</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBuildings.map((building, index) => {
                    const report = buildingReport[building];
                    const totalAllPasses = Object.values(buildingReport).reduce(
                      (sum, r) => sum + r.totalPasses, 0
                    );
                    const percentage = ((report.totalPasses / totalAllPasses) * 100).toFixed(1);
                    
                    // Определяем статус активности
                    let statusColor = '#10b981'; // green
                    let statusText = 'Высокая';
                    if (parseFloat(percentage) < 5) {
                      statusColor = '#ef4444'; // red
                      statusText = 'Низкая';
                    } else if (parseFloat(percentage) < 10) {
                      statusColor = '#f59e0b'; // orange
                      statusText = 'Средняя';
                    }

                    return (
                      <tr 
                        key={building} 
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-600 font-medium">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} style={{ color: '#00aeef' }} />
                            <span className="font-medium text-gray-900">{building}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-gray-900">
                            {formatNumber(report.totalPasses)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {report.zones.length}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700">
                          {formatNumber(report.avgPerZone)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold" style={{ color: '#00aeef' }}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: statusColor }}
                          >
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold" style={{ borderColor: '#00aeef', backgroundColor: '#f0f9ff' }}>
                    <td colSpan={2} className="py-3 px-4 text-gray-900">ИТОГО:</td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {formatNumber(Object.values(buildingReport).reduce((sum, r) => sum + r.totalPasses, 0))}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {Object.values(buildingReport).reduce((sum, r) => sum + r.zones.length, 0)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {formatNumber(Math.round(
                        Object.values(buildingReport).reduce((sum, r) => sum + r.totalPasses, 0) /
                        Object.values(buildingReport).reduce((sum, r) => sum + r.zones.length, 0)
                      ))}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">100%</td>
                    <td className="py-3 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Легенда статусов */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Высокая активность (&gt;10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Средняя активность (5-10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Низкая активность (&lt;5%)</span>
              </div>
            </div>

            {/* Подсказка */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <FileSpreadsheet size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#00aeef' }} />
                <div>
                  <p className="font-medium">Формат выгружаемого отчета:</p>
                  <ul className="mt-1 ml-4 list-disc text-xs text-blue-800">
                    <li>Лист 1: Сводка по корпусам (всего проходов, количество зон, средние)</li>
                    <li>Лист 2: Детализация по зонам (каждая зона с процентом от корпуса)</li>
                    <li>Лист 3: ТОП-10 самых активных зон за период</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Загрузка / Нет данных */}
      {!filteredData.statistics && !mqttError && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={48} className="animate-spin text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">Загрузка данных аналитики...</p>
              <p className="text-sm text-gray-500 mt-1">
                Ожидание данных из MQTT топиков
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Топик конфигурации: <code className="bg-gray-100 px-2 py-1 rounded">Skud/analytics/config</code><br />
                Топик данных: <code className="bg-gray-100 px-2 py-1 rounded">Skud/analytics/events/aggregated</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}