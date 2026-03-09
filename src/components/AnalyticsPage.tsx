import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff
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
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAnalyticsMQTT } from '../hooks/useAnalyticsMQTT';

const COLORS = ['#00aeef', '#0088cc', '#0066aa', '#004488', '#002266'];

export function AnalyticsPage() {
  // Получаем данные из MQTT через WebSocket
  const {
    statistics,
    timeSeries,
    topLocations,
    weekdayPattern,
    locationsComparison,
    isConnected,
    error: mqttError,
    reconnect,
  } = useAnalyticsMQTT();

  const [isRefreshing, setIsRefreshing] = useState(false);

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
          ['Период с', statistics.dateRange?.from || ''],
          ['Период по', statistics.dateRange?.to || ''],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Статистика');
      }

      // Лист 2: Временные ряды
      if (timeSeries && timeSeries.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(timeSeries);
        XLSX.utils.book_append_sheet(wb, ws2, 'Динамика по дням');
      }

      // Лист 3: Топ локаций
      if (topLocations && topLocations.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(topLocations);
        XLSX.utils.book_append_sheet(wb, ws3, 'Топ локаций');
      }

      // Лист 4: По дням недели
      if (weekdayPattern && weekdayPattern.length > 0) {
        const ws4 = XLSX.utils.json_to_sheet(weekdayPattern);
        XLSX.utils.book_append_sheet(wb, ws4, 'По дням недели');
      }

      // Сохранение файла
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Аналитика_${date}.xlsx`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} style={{ color: '#00aeef' }} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Аналитика СКУД</h2>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <>
                  <Wifi size={16} className="text-green-600" />
                  <span className="text-sm text-green-600">MQTT подключен</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">MQTT отключен</span>
                </>
              )}
            </div>
          </div>
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
            disabled={!statistics}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} style={{ color: '#00aeef' }} />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      {/* Ошибка подключения MQTT */}
      {mqttError && (
        <Card className="p-4 bg-red-50 border-red-200">
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
        </Card>
      )}

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
      {timeSeries && timeSeries.length > 0 && (
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
        {topLocations && topLocations.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
              Топ-10 зданий по активности
            </h3>
            <div className="space-y-3">
              {topLocations.map((loc: any, index: number) => (
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
        {weekdayPattern && weekdayPattern.length > 0 && (
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
      {locationsComparison && locationsComparison.length > 0 && (
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
      {!statistics && isConnected && (
        <Card className="p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Нет данных
          </h3>
          <p className="text-gray-600 mb-4">
            Данные аналитики еще не опубликованы в MQTT
          </p>
        </Card>
      )}

      {/* Если MQTT не подключен */}
      {!isConnected && !mqttError && (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Подключение к MQTT...
          </h3>
          <p className="text-gray-600">
            Ожидание данных аналитики из брокера
          </p>
        </Card>
      )}

      {/* Информация о топиках MQTT */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Источник данных: MQTT</p>
            <p className="text-xs text-blue-700 mb-2">
              Данные аналитики загружаются из MQTT топиков в реальном времени:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <code className="bg-blue-100 px-1 rounded">Skud/analytics/statistics</code> - общая статистика</li>
              <li>• <code className="bg-blue-100 px-1 rounded">Skud/analytics/timeSeries</code> - временные ряды</li>
              <li>• <code className="bg-blue-100 px-1 rounded">Skud/analytics/topLocations</code> - топ локаций</li>
              <li>• <code className="bg-blue-100 px-1 rounded">Skud/analytics/weekdayPattern</code> - по дням недели</li>
              <li>• <code className="bg-blue-100 px-1 rounded">Skud/analytics/locationsComparison</code> - сравнение локаций</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
