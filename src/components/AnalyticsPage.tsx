import { useState, useEffect } from 'react';
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

// Список корпусов для фильтра
const BUILDINGS = [
  'Все корпуса',
  'Корпус №1',
  'Корпус №2',
  'Корпус №3',
  'Корпус №4',
  'Корпус №5',
  'Корпус №6',
  'Корпус №7',
  'Корпус №8',
  'Корпус №9',
  'Общежитие №1',
  'Общежитие №2',
  'Общежитие №3',
  'Общежитие №4',
  'Общежитие №5',
  'Библиотека',
  'Спорткомплекс',
];

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
    yearFrom: new Date().getFullYear() - 1,
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

  // Применение фильтров
  const [filteredData, setFilteredData] = useState<any>({
    statistics: null,
    timeSeries: [],
    topLocations: [],
    weekdayPattern: [],
    locationsComparison: [],
  });

  useEffect(() => {
    applyFilters();
  }, [filters, allData]);

  const applyFilters = () => {
    if (!statistics) {
      setFilteredData({
        statistics: null,
        timeSeries: [],
        topLocations: [],
        weekdayPattern: [],
        locationsComparison: [],
      });
      return;
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

    setFilteredData({
      statistics: filteredStats,
      timeSeries: filteredTimeSeries,
      topLocations: filteredTopLocations.slice(0, 10),
      weekdayPattern: weekdayPattern || [],
      locationsComparison: locationsComparison || [],
    });
  };

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

      // Сохранение файла
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
              {BUILDINGS.map(building => (
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

      {/* Графики в две колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График: Топ-10 зон */}
        {filteredData.topLocations && filteredData.topLocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} style={{ color: '#00aeef' }} />
              <h3 className="text-lg font-semibold text-gray-900">Топ-10 зон по активности</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredData.topLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120}
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#00aeef" radius={[0, 4, 4, 0]} name="Проходов" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* График: По дням недели */}
        {filteredData.weekdayPattern && filteredData.weekdayPattern.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} style={{ color: '#00aeef' }} />
              <h3 className="text-lg font-semibold text-gray-900">Распределение по дням недели</h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredData.weekdayPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
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
                <Bar dataKey="count" fill="#00aeef" radius={[4, 4, 0, 0]} name="Проходов" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

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
