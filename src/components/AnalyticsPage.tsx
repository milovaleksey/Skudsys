import { useState } from 'react';
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
  Activity
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
  const analyticsData = useAnalyticsMQTT();
  const {
    isConnected,
    error: mqttError,
    reconnect,
    ...allData
  } = analyticsData;

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Извлекаем данные из конфигурации
  const statistics = allData.total_stats;
  const timeSeries = allData.time_series;
  const topLocations = allData.top_zones;
  const weekdayPattern = allData.weekday_pattern;
  const locationsComparison = allData.zone_comparison;
  const categorization = allData.zone_categories;
  const dormitories = allData.dormitory_analysis;

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
          ['Всего проходов', statistics.totalPasses || 0],
          ['Уникальных зон', statistics.uniqueZones || 0],
          ['Среднее в день', statistics.avgDailyPasses || 0],
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
            <h2 className="text-2xl font-bold text-gray-900">Аналитика СКУД (MQTT)</h2>
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
                  {formatNumber(statistics.totalPasses || 0)}
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
                <p className="text-sm text-gray-600 mb-1">Уникальных зон</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(statistics.uniqueZones || 0)}
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
                  {formatNumber(statistics.avgDailyPasses || 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Calendar className="w-6 h-6" style={{ color: '#00aeef' }} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Пиковый день</p>
                {statistics.peakDay && typeof statistics.peakDay === 'object' ? (
                  <>
                    <p className="text-lg font-bold text-gray-900">
                      {formatNumber(statistics.peakDay.value || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(statistics.peakDay.date)}
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
          </Card>
        </div>
      )}

      {/* График: Динамика по дням */}
      {timeSeries && timeSeries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Динамика проходов по дням</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeries}>
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
        </Card>
      )}

      {/* График: Топ-10 зон */}
      {topLocations && topLocations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Топ-10 зон по активности</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topLocations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
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
        </Card>
      )}

      {/* График: По дням недели */}
      {weekdayPattern && weekdayPattern.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Распределение по дням недели</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekdayPattern}>
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
        </Card>
      )}

      {/* График: Сравнение зон */}
      {locationsComparison && locationsComparison.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Сравнение топ-5 зон по дням</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={locationsComparison}>
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
              {locationsComparison.length > 0 && Object.keys(locationsComparison[0])
                .filter(key => key !== 'date')
                .map((key, index) => (
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
        </Card>
      )}

      {/* Загрузка / Нет данных */}
      {!statistics && !mqttError && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={48} className="animate-spin text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">Загрузка данных аналитики...</p>
              <p className="text-sm text-gray-500 mt-1">
                Ожидание данных из MQTT топиков
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Топик конфигурации: Skud/analytics/config<br />
                Топик данных: Skud/analytics/events/aggregated
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Отладочная информация (в production убрать) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50">
          <details>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              🔧 Отладочная информация
            </summary>
            <div className="mt-4 space-y-2 text-xs">
              <p><strong>Подключение:</strong> {isConnected ? '✅ Да' : '❌ Нет'}</p>
              <p><strong>Ошибка:</strong> {mqttError || '—'}</p>
              <p><strong>Доступные данные:</strong></p>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(allData, null, 2)}
              </pre>
            </div>
          </details>
        </Card>
      )}
    </div>
  );
}
