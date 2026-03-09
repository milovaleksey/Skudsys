import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card } from './ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { analyticsApi } from '../lib/api';

const COLORS = ['#00aeef', '#0088cc', '#0066aa', '#004488', '#002266'];

export function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Состояния для данных
  const [statistics, setStatistics] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [topLocations, setTopLocations] = useState<any[]>([]);
  const [weekdayPattern, setWeekdayPattern] = useState<any[]>([]);
  const [locationsComparison, setLocationsComparison] = useState<any[]>([]);

  // Фильтры по датам (последние 30 дней по умолчанию)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  /**
   * Загрузка всех данных аналитики
   */
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      // Запрашиваем все данные параллельно
      const [statsRes, timeSeriesRes, topLocsRes, weekdayRes, comparisonRes] = await Promise.all([
        analyticsApi.getStatistics(dateFrom, dateTo),
        analyticsApi.getTimeSeries(dateFrom, dateTo),
        analyticsApi.getTopLocations(dateFrom, dateTo, 10),
        analyticsApi.getWeekdayPattern(dateFrom, dateTo),
        analyticsApi.getLocationsComparison(dateFrom, dateTo, 5),
      ]);

      if (statsRes.success && statsRes.data) {
        setStatistics(statsRes.data);
      }

      if (timeSeriesRes.success && timeSeriesRes.data) {
        setTimeSeries(timeSeriesRes.data);
      }

      if (topLocsRes.success && topLocsRes.data) {
        setTopLocations(topLocsRes.data);
      }

      if (weekdayRes.success && weekdayRes.data) {
        setWeekdayPattern(weekdayRes.data);
      }

      if (comparisonRes.success && comparisonRes.data) {
        setLocationsComparison(comparisonRes.data);
      }

    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Ошибка загрузки аналитики');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обновление данных
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
    toast.success('Данные обновлены');
  };

  /**
   * Применение фильтров
   */
  const handleApplyFilters = () => {
    if (!dateFrom || !dateTo) {
      toast.error('Укажите период');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Дата начала не может быть позже даты окончания');
      return;
    }

    loadAnalyticsData();
  };

  /**
   * Экспорт в Excel
   */
  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Лист 1: Статистика
      if (statistics) {
        const statsData = [
          ['Параметр', 'Значение'],
          ['Всего проходов', statistics.totalPasses],
          ['Уникальных людей', statistics.uniquePeople],
          ['Уникальных локаций', statistics.uniqueLocations],
          ['Средняя активность в день', statistics.avgDailyPasses],
          ['Период с', statistics.dateRange.from],
          ['Период по', statistics.dateRange.to],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Статистика');
      }

      // Лист 2: Временные ряды
      if (timeSeries.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(timeSeries);
        XLSX.utils.book_append_sheet(wb, ws2, 'Динамика по дням');
      }

      // Лист 3: Топ локаций
      if (topLocations.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(topLocations);
        XLSX.utils.book_append_sheet(wb, ws3, 'Топ локаций');
      }

      // Лист 4: По дням недели
      if (weekdayPattern.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(weekdayPattern);
        XLSX.utils.book_append_sheet(wb, ws4, 'По дням недели');
      }

      // Сохранение файла
      const fileName = `Аналитика_${dateFrom}_${dateTo}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Отчет экспортирован');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка экспорта');
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

  // Загрузка данных при монтировании
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00aeef' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} style={{ color: '#00aeef' }} />
          <h2 className="text-2xl font-bold text-gray-900">Аналитика СКУД</h2>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download size={20} style={{ color: '#00aeef' }} />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата с
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата по
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00aeef' }}
            >
              Применить фильтр
            </button>
          </div>
        </div>
      </Card>

      {/* Карточки статистики */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего проходов</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.totalPasses)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Уникальных людей</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.uniquePeople)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Users className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Локаций</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.uniqueLocations)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Building2 className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Среднее в день</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.avgDailyPasses)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Calendar className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Временные ряды - Area Chart */}
      {timeSeries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
            Динамика проходов по дням
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip 
                labelFormatter={formatDate}
                formatter={(value: number) => formatNumber(value)}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#00aeef" 
                fill="#00aeef" 
                fillOpacity={0.3}
                name="Проходов"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Топ локаций и Дни недели */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ локаций */}
        {topLocations.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
              Топ-10 зданий по активности
            </h3>
            <div className="space-y-3">
              {topLocations.map((loc, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 text-center font-semibold text-gray-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {loc.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatNumber(loc.count)} ({loc.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: '#00aeef',
                          width: `${loc.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Дни недели */}
        {weekdayPattern.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
              Активность по дням недели
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekdayPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Bar dataKey="count" fill="#00aeef" name="Проходов" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Сравнение локаций */}
      {locationsComparison.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
            Сравнение топ-5 локаций по дням
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={locationsComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip 
                labelFormatter={formatDate}
                formatter={(value: number) => formatNumber(value)}
              />
              <Legend />
              {Object.keys(locationsComparison[0] || {})
                .filter((key) => key !== 'date')
                .map((location, index) => (
                  <Line
                    key={location}
                    type="monotone"
                    dataKey={location}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Если нет данных */}
      {!statistics && !isLoading && (
        <Card className="p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет данных за выбранный период
          </h3>
          <p className="text-gray-600 mb-4">
            Попробуйте изменить диапазон дат
          </p>
          <button
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date();
              monthAgo.setDate(monthAgo.getDate() - 30);
              setDateFrom(monthAgo.toISOString().split('T')[0]);
              setDateTo(today.toISOString().split('T')[0]);
              loadAnalyticsData();
            }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#00aeef' }}
          >
            Показать последние 30 дней
          </button>
        </Card>
      )}
    </div>
  );
}
