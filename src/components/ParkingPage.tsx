import { useState } from 'react';
import { Car, Clock, Search, ChevronDown, ChevronUp, Wifi, WifiOff, RefreshCw, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useParkingMQTT, ParkingVehicle } from '../hooks/useParkingMQTT';
import { Card } from './ui/card';

export function ParkingPage() {
  const { parkings, isConnected, error, reconnect } = useParkingMQTT();
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [expandedParkings, setExpandedParkings] = useState<Record<string, boolean>>({});

  // Функция фильтрации
  const filterRecords = (records: any[], searchQuery: string) => {
    if (!searchQuery) return records;
    
    const query = searchQuery.toLowerCase();
    return records.filter(record => {
      const fullName = record.fullName?.toLowerCase() || '';
      const licensePlate = record.licensePlate?.toLowerCase() || '';
      return fullName.includes(query) || licensePlate.includes(query);
    });
  };

  const renderParkingBlock = (parking: any) => {
    const searchQuery = searchQueries[parking.id] || '';
    const isExpanded = expandedParkings[parking.id] || false;
    
    const occupancyPercentage = (parking.currentCount / parking.maxCapacity) * 100;
    const isCrowded = occupancyPercentage > 80;
    const isModerate = occupancyPercentage > 50 && occupancyPercentage <= 80;
    
    const filteredRecords = filterRecords(parking.vehicles, searchQuery);

    return (
      <div key={parking.id} className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div 
          className="p-6"
          style={{ backgroundColor: '#00aeef' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Car size={24} style={{ color: '#00aeef' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{parking.name}</h3>
                <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{parking.address}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {parking.currentCount} / {parking.maxCapacity}
              </div>
              <div className="text-blue-100 text-sm">занято мест</div>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isCrowded 
                    ? 'bg-red-400' 
                    : isModerate 
                    ? 'bg-yellow-400' 
                    : 'bg-green-400'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-blue-100">
              <span>Свободно: {parking.maxCapacity - parking.currentCount}</span>
              <span>{occupancyPercentage.toFixed(1)}% загрузка</span>
            </div>
          </div>
        </div>

        {/* Панель управления */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Поиск */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, [parking.id]: e.target.value }))}
                placeholder="Поиск по ФИО или ГРЗ..."
                className="pl-10"
              />
            </div>
            
            {/* нопка разворачивания */}
            <Button
              onClick={() => setExpandedParkings(prev => ({ ...prev, [parking.id]: !isExpanded }))}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Свернуть таблицу
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Развернуть таблицу ({parking.vehicles.length})
                </>
              )}
            </Button>
          </div>
          
          {/* Счетчик результатов поиска */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Найдено: <span className="font-semibold text-gray-900">{filteredRecords.length}</span> из {parking.vehicles.length}
            </div>
          )}
        </div>

        {/* Table */}
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Время заезда</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ФИО</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">UPN</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Марка автомобиля</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ГРЗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr 
                      key={`${parking.id}-${index}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {record.entryTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.upn}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.carBrand}</td>
                      <td className="px-6 py-4 text-sm">
                        <span 
                          className="inline-block px-3 py-1 rounded font-mono font-semibold text-white"
                          style={{ backgroundColor: '#00aeef' }}
                        >
                          {record.licensePlate}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? 'По вашему запросу ничего не найдено' : 'Нет припаркованных автомобилей'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Подсчет общей статистики
  const totalCapacity = parkings.reduce((sum, p) => sum + p.maxCapacity, 0);
  const totalOccupied = parkings.reduce((sum, p) => sum + p.currentCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Парковочная система</h2>
        <p className="text-gray-600 mt-2">Мониторинг загрузки и управление парковками университета</p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Система парковок подключена</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Отключено</span>
            </>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={reconnect}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Переподключиться
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-medium mb-1">Ошибка подключения</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Info Message */}
      {!isConnected && !error && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Подключите MQTT для динамических данных парковок</p>
              <p className="text-xs text-blue-700">
                Конфигурация парковок загружается из топика <code className="bg-blue-100 px-1 rounded">Skud/parking/config</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#00aeef' }}
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Всего парковок</div>
              <div className="text-2xl font-bold text-gray-900">{parkings.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500"
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Всего мест</div>
              <div className="text-2xl font-bold text-gray-900">{totalCapacity}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500"
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Занято мест</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalOccupied} / {totalCapacity}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parking Blocks */}
      {parkings.length > 0 ? (
        <div className="space-y-6">
          {parkings.map(parking => renderParkingBlock(parking))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {isConnected 
              ? 'Парковки не настроены. Опубликуйте конфигурацию в топик Skud/parking/config'
              : 'Подключение к системе парковок...'
            }
          </p>
        </Card>
      )}
    </div>
  );
}