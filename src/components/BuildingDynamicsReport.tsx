import { TrendingUp, Download, AlertCircle, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface BuildingDynamicsReportProps {
  topLocations: any[];
  timeSeries: any[];
  reportFilters: {
    periodType: string;
    startDate: Date;
    endDate: Date;
  };
  filters: {
    yearFrom: number;
    yearTo: number;
  };
  formatNumber: (num: number) => string;
}

export function BuildingDynamicsReport({
  topLocations,
  timeSeries,
  reportFilters,
  filters,
  formatNumber
}: BuildingDynamicsReportProps) {
  // Фильтруем timeSeries по выбранному периоду
  let dynamicTimeSeries = timeSeries;
  if (reportFilters.periodType !== 'all' && timeSeries && timeSeries.length > 0) {
    const start = new Date(reportFilters.startDate);
    const end = new Date(reportFilters.endDate);
    end.setHours(23, 59, 59, 999);
    
    dynamicTimeSeries = timeSeries.filter((item: any) => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  }

  // Если нет данных за период - не показываем виджет
  if (dynamicTimeSeries.length === 0) {
    return null;
  }

  // Извлекаем уникальные корпуса
  const buildingsSet = new Set<string>();
  topLocations.forEach((location: any) => {
    if (location.name) {
      let buildingName = '';
      if (location.name.includes('-')) {
        const buildingMatch = location.name.match(/^([^-]+)/);
        if (buildingMatch) {
          buildingName = buildingMatch[1].trim();
        }
      } else {
        buildingName = location.name.trim();
      }
      
      if (buildingName) {
        const normalizedBuilding = buildingName
          .replace(/\s+/g, ' ')
          .replace(/№\s+/g, '№')
          .replace(/\s+№/g, ' №');
        buildingsSet.add(normalizedBuilding);
      }
    }
  });

  const buildingsList = Array.from(buildingsSet).sort();

  // Получаем общее количество проходов по каждому корпусу
  const buildingTotals: Record<string, number> = {};
  topLocations.forEach((location: any) => {
    if (location.name) {
      let buildingName = '';
      if (location.name.includes('-')) {
        const buildingMatch = location.name.match(/^([^-]+)/);
        if (buildingMatch) {
          buildingName = buildingMatch[1].trim();
        }
      } else {
        buildingName = location.name.trim();
      }
      
      if (buildingName) {
        const building = buildingName
          .replace(/\s+/g, ' ')
          .replace(/№\s+/g, '№')
          .replace(/\s+№/g, ' №');
        
        if (!buildingTotals[building]) {
          buildingTotals[building] = 0;
        }
        buildingTotals[building] += location.count || 0;
      }
    }
  });

  const totalAllPasses = Object.values(buildingTotals).reduce((sum, val) => sum + val, 0);

  // Рассчитываем данные по дням для каждого корпуса (пропорционально)
  const buildingDynamics: Record<string, Array<{ date: string; count: number }>> = {};
  
  buildingsList.forEach(building => {
    buildingDynamics[building] = dynamicTimeSeries.map((item: any) => {
      // Пропорциональный расчет: (проходы корпуса / общие проходы) * проходы за день
      const buildingShare = totalAllPasses > 0 ? buildingTotals[building] / totalAllPasses : 0;
      const dayCount = Math.round((item.count || 0) * buildingShare);
      
      return {
        date: item.date,
        count: dayCount
      };
    });
  });

  // Функция экспорта динамики
  const handleExportDynamics = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Лист 1: Динамика по дням (корпуса в строках, даты в столбцах)
      const dynamicsData: any[] = [];
      buildingsList.forEach(building => {
        const row: any = { 'Корпус': building };
        buildingDynamics[building].forEach((day) => {
          const dateStr = new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
          row[dateStr] = day.count;
        });
        row['ИТОГО'] = buildingDynamics[building].reduce((sum, d) => sum + d.count, 0);
        dynamicsData.push(row);
      });

      // Добавляем строку ИТОГО
      const totalRow: any = { 'Корпус': 'ИТОГО' };
      dynamicTimeSeries.forEach((day: any) => {
        const dateStr = new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        totalRow[dateStr] = day.count || 0;
      });
      totalRow['ИТОГО'] = dynamicTimeSeries.reduce((sum: number, d: any) => sum + (d.count || 0), 0);
      dynamicsData.push(totalRow);

      const ws1 = XLSX.utils.json_to_sheet(dynamicsData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Динамика по дням');

      // Лист 2: Статистика по корпусам
      const statsData = buildingsList.map(building => {
        const total = buildingDynamics[building].reduce((sum, d) => sum + d.count, 0);
        const avg = Math.round(total / buildingDynamics[building].length);
        const max = Math.max(...buildingDynamics[building].map(d => d.count));
        const min = Math.min(...buildingDynamics[building].map(d => d.count));
        
        return {
          'Корпус': building,
          'Всего проходов': total,
          'Среднее в день': avg,
          'Максимум': max,
          'Минимум': min,
          'Доля от общего': `${((total / dynamicTimeSeries.reduce((sum: number, d: any) => sum + (d.count || 0), 0)) * 100).toFixed(1)}%`
        };
      });
      const ws2 = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Статистика');

      const periodText = reportFilters.periodType === 'all' 
        ? `${filters.yearFrom}-${filters.yearTo}`
        : `${reportFilters.startDate.toLocaleDateString('ru-RU')}-${reportFilters.endDate.toLocaleDateString('ru-RU')}`;

      XLSX.writeFile(wb, `Динамика_по_корпусам_${periodText}.xlsx`);
      toast.success('Отчет успешно выгружен');
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      toast.error('Ошибка при экспорте отчета');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} style={{ color: '#00aeef' }} />
          <h3 className="text-lg font-semibold text-gray-900">Динамика проходов по корпусам</h3>
        </div>
        <button
          onClick={handleExportDynamics}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#00aeef' }}
        >
          <Download size={18} />
          <span>Выгрузить динамику</span>
        </button>
      </div>

      {/* Предупреждение о расчетах */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>Метод расчета:</strong> Данные рассчитаны пропорционально на основе общей статистики по зонам и временного ряда проходов. Показывают приблизительное распределение активности.
        </div>
      </div>

      {/* Информация о периоде */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={16} style={{ color: '#00aeef' }} />
            <span className="font-medium">Период:</span>
            <span>
              {reportFilters.periodType === 'all' 
                ? `${filters.yearFrom} - ${filters.yearTo}` 
                : `${reportFilters.startDate.toLocaleDateString('ru-RU')} - ${reportFilters.endDate.toLocaleDateString('ru-RU')}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-medium">Дней в периоде:</span>
            <span className="px-2 py-1 bg-[#00aeef] text-white rounded-md text-xs font-bold">
              {dynamicTimeSeries.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-medium">Корпусов:</span>
            <span className="px-2 py-1 bg-[#00aeef] text-white rounded-md text-xs font-bold">
              {buildingsList.length}
            </span>
          </div>
        </div>
      </div>

      {/* Таблица с прокруткой */}
      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b-2" style={{ borderColor: '#00aeef' }}>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 bg-gray-50 sticky left-0 z-20">
                  Корпус
                </th>
                {dynamicTimeSeries.map((day: any, idx: number) => (
                  <th key={idx} className="text-center py-3 px-3 font-semibold text-gray-900 min-w-[80px]">
                    <div className="text-xs">
                      {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-500 font-normal">
                      {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-semibold text-gray-900 bg-gray-50 sticky right-0 z-20">
                  ИТОГО
                </th>
              </tr>
            </thead>
            <tbody>
              {buildingsList.map((building, buildingIdx) => {
                const total = buildingDynamics[building].reduce((sum, d) => sum + d.count, 0);
                const avg = Math.round(total / buildingDynamics[building].length);
                
                return (
                  <tr 
                    key={buildingIdx}
                    className="border-b hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                      {building}
                    </td>
                    {buildingDynamics[building].map((day, dayIdx) => {
                      // Цветовая индикация
                      let bgColor = 'transparent';
                      if (day.count > avg * 1.5) {
                        bgColor = 'rgb(220, 252, 231)'; // green-100
                      } else if (day.count < avg * 0.5 && day.count > 0) {
                        bgColor = 'rgb(254, 243, 199)'; // yellow-100
                      } else if (day.count === 0) {
                        bgColor = 'rgb(254, 226, 226)'; // red-100
                      }
                      
                      return (
                        <td 
                          key={dayIdx}
                          className="py-3 px-3 text-center text-sm text-gray-700"
                          style={{ backgroundColor: bgColor }}
                        >
                          {formatNumber(day.count)}
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center font-bold text-gray-900 bg-blue-50 sticky right-0 z-10">
                      {formatNumber(total)}
                    </td>
                  </tr>
                );
              })}
              
              {/* Строка ИТОГО */}
              <tr className="border-t-2 font-bold bg-gray-100" style={{ borderColor: '#00aeef' }}>
                <td className="py-3 px-4 text-gray-900 sticky left-0 z-10 bg-gray-100">
                  ИТОГО
                </td>
                {dynamicTimeSeries.map((day: any, idx: number) => (
                  <td key={idx} className="py-3 px-3 text-center text-gray-900">
                    {formatNumber(day.count || 0)}
                  </td>
                ))}
                <td className="py-3 px-4 text-center text-gray-900 sticky right-0 z-10 bg-gray-100">
                  {formatNumber(dynamicTimeSeries.reduce((sum: number, d: any) => sum + (d.count || 0), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Выше среднего (&gt;150%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
          <span className="text-gray-600">Ниже среднего (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div>
          <span className="text-gray-600">Нет проходов</span>
        </div>
      </div>

      {/* Статистика топ-3 корпусов */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildingsList.slice(0, 3).map((building, idx) => {
          const total = buildingDynamics[building].reduce((sum, d) => sum + d.count, 0);
          const avg = Math.round(total / buildingDynamics[building].length);
          const max = Math.max(...buildingDynamics[building].map(d => d.count));
          
          return (
            <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="font-medium text-gray-900 mb-2 truncate">{building}</div>
              <div className="space-y-1 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Всего:</span>
                  <span className="font-bold">{formatNumber(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Среднее/день:</span>
                  <span className="font-bold">{formatNumber(avg)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Максимум:</span>
                  <span className="font-bold text-green-600">{formatNumber(max)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}