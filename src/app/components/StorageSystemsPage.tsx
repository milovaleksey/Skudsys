/**
 * Storage Systems Page
 * Displays all storage systems (clothes and items) with real-time occupancy
 * Similar to parking lots visualization
 */

import { useState } from 'react';
import { useStorageMQTT } from '../hooks/useStorageMQTT';
import { Building2, Package, Shirt, AlertCircle, CheckCircle, XCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function StorageSystemsPage() {
  const { storages, isConnected, error, reconnect } = useStorageMQTT();
  const [filter, setFilter] = useState<'all' | 'clothes' | 'items'>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  // Filter storages by type
  const filteredByType = filter === 'all' 
    ? storages 
    : storages.filter(s => s.type === filter);

  // Filter by building
  const filteredStorages = buildingFilter === 'all'
    ? filteredByType
    : filteredByType.filter(s => s.building === buildingFilter);

  // Get unique buildings for filter
  const buildings = Array.from(new Set(storages.map(s => s.building))).sort();

  // Calculate statistics
  const totalCapacity = filteredStorages.reduce((sum, s) => sum + s.totalCapacity, 0);
  const totalOccupied = filteredStorages.reduce((sum, s) => sum + s.occupiedCount, 0);
  const totalAvailable = totalCapacity - totalOccupied;
  const occupancyPercentage = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Get occupancy percentage for a system
  const getOccupancyPercentage = (system: typeof storages[0]) => {
    if (system.totalCapacity === 0) return 0;
    return Math.round((system.occupiedCount / system.totalCapacity) * 100);
  };

  // Get occupancy color
  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get occupancy background
  const getOccupancyBg = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100 border-red-300';
    if (percentage >= 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case 'maintenance':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'inactive':
        return 'Неактивна';
      case 'maintenance':
        return 'Обслуживание';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Системы хранения вещей</h1>
            <p className="text-gray-600 mt-1">
              Мониторинг систем хранения одежды и вещей в режиме реального времени
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Подключено</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">Отключено</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего систем</p>
                <p className="text-2xl font-bold text-gray-900">{storages.length}</p>
              </div>
              <div style={{ backgroundColor: '#00aeef' }} className="p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Общая вместимость</p>
                <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Занято</p>
                <p className="text-2xl font-bold text-gray-900">{totalOccupied}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Shirt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Доступно</p>
                <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Тип системы</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter('clothes')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filter === 'clothes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shirt className="w-4 h-4" />
                Одежда
              </button>
              <button
                onClick={() => setFilter('items')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filter === 'items'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                Вещи
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Корпус</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все корпуса</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      {error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Ошибка при загрузке систем хранения: {error}</p>
            <button
              onClick={reconnect}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Переподключиться
            </button>
          </div>
        </div>
      ) : filteredStorages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Нет систем хранения для отображения</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStorages.map((system) => {
            const percentage = getOccupancyPercentage(system);
            const availableSpots = system.totalCapacity - system.occupiedCount;

            return (
              <div
                key={system.id}
                className={`bg-white rounded-xl p-6 shadow-md border-2 transition-all hover:shadow-lg ${
                  system.status === 'active' ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ backgroundColor: '#00aeef' }} className="p-2 rounded-lg">
                      {system.type === 'clothes' ? (
                        <Shirt className="w-6 h-6 text-white" />
                      ) : (
                        <Package className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{system.name}</h3>
                      <p className="text-sm text-gray-600">{system.building}</p>
                      {system.address && (
                        <p className="text-xs text-gray-500">{system.address}</p>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(system.status)}
                </div>

                {/* Occupancy Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Заполненность</span>
                    <span className={`text-sm font-bold ${getOccupancyColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage >= 90
                          ? 'bg-red-500'
                          : percentage >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Всего</p>
                    <p className="text-lg font-bold text-gray-900">{system.totalCapacity}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Занято</p>
                    <p className="text-lg font-bold text-yellow-600">{system.occupiedCount}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Свободно</p>
                    <p className="text-lg font-bold text-green-600">{availableSpots}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      system.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : system.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusLabel(system.status)}
                  </span>
                  {system.updatedAt && (
                    <span className="text-xs text-gray-500 ml-3">
                      Обновлено: {new Date(system.updatedAt).toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}