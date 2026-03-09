import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  RefreshCw,
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAnalyticsMQTT } from '../hooks/useAnalyticsMQTT';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function AnalyticsPage() {
  const { config, data, isConnected, error, requestUpdate, status } = useAnalyticsMQTT();
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Запрос обновления данных
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    requestUpdate();
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Данные обновлены');
    }, 1000);
  };

  /**
   * Экспорт в Excel
   */
  const handleExport = () => {
    if (!data) {
      toast.error('Нет данных для экспорта');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // Экспортируем каждый датасет
      Object.entries(data.datasets).forEach(([key, dataset]) => {
        const worksheet = XLSX.utils.json_to_sheet(dataset);
        XLSX.utils.book_append_sheet(workbook, worksheet, key.substring(0, 31)); // Excel limit 31 chars
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `analytics_${dateStr}.xlsx`);
      
      toast.success('Аналитика выгружена в Excel');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка при экспорте');
    }
  };

  /**
   * Форматирование даты для отображения
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
   * Получение цветов для графиков
   */
  const getColors = (widget: any) => {
    if (widget.colors && Array.isArray(widget.colors)) {
      return widget.colors;
    }
    return [widget.color || '#00aeef'];
  };

  /**
   * Рендер виджета в зависимости от типа
   */
  const renderWidget = (widget: any) => {
    if (!data || !data.datasets[widget.dataSource]) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          Нет данных
        </div>
      );
    }

    const dataset = data.datasets[widget.dataSource];

    switch (widget.type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dataset}>
              <defs>
                <linearGradient id={`color-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={widget.color || '#00aeef'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={widget.color || '#00aeef'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={widget.color || '#00aeef'}
                strokeWidth={2}
                fill={`url(#color-${widget.id})`}
                name="Проходов"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <div className="space-y-3">
            {dataset.map((item: any, index: number) => {
              const colors = getColors(widget);
              const color = colors[index % colors.length];
              const maxValue = Math.max(...dataset.map((d: any) => d.count || 0));
              
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.name || item.day || item.category}
                    </div>
                    {widget.showPercentage && item.percentage !== undefined && (
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold" style={{ color }}>
                      {(item.count || 0).toLocaleString('ru-RU')}
                    </div>
                    <div className="text-xs text-gray-500">проходов</div>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'line':
        const buildings = widget.buildings || [];
        const colors = getColors(widget);
        
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dataset}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#666"
              />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {buildings.map((building: string, idx: number) => (
                <Line 
                  key={building}
                  type="monotone" 
                  dataKey={building}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  name={building}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieColors = getColors(widget);
        
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={dataset}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.category}: ${entry.percentage}%`}
              >
                {dataset.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Неизвестный тип виджета: {widget.type}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Аналитика</h2>
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="w-5 h-5" />
              <span className="text-sm font-medium">MQTT подключен</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <WifiOff className="w-5 h-5" />
              <span className="text-sm font-medium">MQTT отключен</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={!isConnected || isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} style={{ color: '#00aeef' }} />
            <span>Обновить</span>
          </button>
          <button
            onClick={handleExport}
            disabled={!data}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} style={{ color: '#00aeef' }} />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      {/* Metadata Cards */}
      {data?.metadata && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Activity size={24} style={{ color: '#00aeef' }} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Всего проходов</div>
            <div className="text-2xl font-bold" style={{ color: '#00aeef' }}>
              {data.metadata.totalPasses.toLocaleString('ru-RU')}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Users size={24} style={{ color: '#00aeef' }} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Уникальных зданий</div>
            <div className="text-2xl font-bold" style={{ color: '#00aeef' }}>
              {data.metadata.uniqueBuildings}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#e6f7ff' }}>
                <Calendar size={24} style={{ color: '#00aeef' }} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">Период данных</div>
            <div className="text-sm font-bold" style={{ color: '#00aeef' }}>
              {formatDate(data.metadata.dateRange.from)} - {formatDate(data.metadata.dateRange.to)}
            </div>
          </Card>
        </div>
      )}

      {/* Widgets */}
      {config && config.widgets.length > 0 ? (
        <div className="space-y-6">
          {config.widgets.map((widget) => (
            <Card key={widget.id} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#00aeef' }}>
                  {widget.title}
                </h3>
                <p className="text-sm text-gray-600">{widget.description}</p>
              </div>
              {renderWidget(widget)}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <BarChart3 className="w-16 h-16 text-gray-300" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Загрузка конфигурации...
              </h3>
              <p className="text-sm text-gray-600">
                Ожидание данных от MQTT сервера
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                Ошибка подключения
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              О данных аналитики
            </h3>
            <p className="text-sm text-blue-700">
              Данные собираются из системы контроля и управления доступом (СКУД) в режиме реального времени через MQTT. 
              Конфигурация виджетов загружается из топика <code className="bg-blue-100 px-1 rounded">Skud/analytics/config</code>, 
              данные из топика <code className="bg-blue-100 px-1 rounded">Skud/analytics/data</code>. 
              Обновление происходит автоматически каждые 5 минут.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
