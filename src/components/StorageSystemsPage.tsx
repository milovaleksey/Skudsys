/**
 * Storage Systems Page
 * Displays all storage systems (clothes and items) with real-time occupancy
 * Similar to parking lots visualization
 */

import { useState, useEffect } from 'react';
import { storageApi } from '../lib/api';
import { useStorageWebSocket } from '../hooks/useStorageWebSocket';
import { toast } from 'sonner@2.0.3';
import { Building2, Package, Shirt, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StorageSystem {
  id: number;
  name: string;
  type: 'clothes' | 'items';
  building: string;
  address?: string;
  total_capacity: number;
  occupied_count: number;
  status: 'active' | 'inactive' | 'maintenance';
  mqtt_topic_status: string;
  mqtt_topic_occupancy: string;
  created_at: string;
  updated_at: string;
}

interface StorageStatistics {
  overall: {
    total_systems: number;
    total_capacity: number;
    total_occupied: number;
    total_available: number;
    active_systems: number;
    inactive_systems: number;
  };
  byType: Array<{
    type: 'clothes' | 'items';
    count: number;
    total_capacity: number;
    occupied_count: number;
    available_count: number;
  }>;
  byBuilding: Array<{
    building: string;
    count: number;
    total_capacity: number;
    occupied_count: number;
    available_count: number;
  }>;
}

export function StorageSystemsPage() {
  const [systems, setSystems] = useState<StorageSystem[]>([]);
  const [statistics, setStatistics] = useState<StorageStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'clothes' | 'items'>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [systemsRes, statsRes] = await Promise.all([
        storageApi.getAllSystems(),
        storageApi.getStatistics()
      ]);

      if (systemsRes.success && systemsRes.data) {
        setSystems(systemsRes.data);
      } else {
        toast.error('Ошибка при загрузке систем хранения');
      }

      if (statsRes.success && statsRes.data) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket for real-time updates
  const { isConnected } = useStorageWebSocket({
    onOccupancyUpdate: (data) => {
      console.log('Occupancy update:', data);
      
      // Update systems state
      setSystems((prev) => {
        return prev.map((system) => {
          if (system.mqtt_topic_occupancy === data.topic) {
            return {
              ...system,
              occupied_count: data.occupiedCount,
              updated_at: data.timestamp
            };
          }
          return system;
        });
      });

      // Reload statistics
      loadStatistics();
    },
    onStatusUpdate: (data) => {
      console.log('Status update:', data);
      
      // Update systems state
      setSystems((prev) => {
        return prev.map((system) => {
          if (system.mqtt_topic_status === data.topic) {
            return {
              ...system,
              status: data.status,
              updated_at: data.timestamp
            };
          }
          return system;
        });
      });

      // Reload statistics
      loadStatistics();
    },
    onConnected: () => {
      console.log('Storage WebSocket connected');
    },
    onDisconnected: () => {
      console.log('Storage WebSocket disconnected');
    },
  });

  const loadStatistics = async () => {
    try {
      const res = await storageApi.getStatistics();
      if (res.success && res.data) {
        setStatistics(res.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Filter systems
  const filteredSystems = systems.filter((system) => {
    if (filter !== 'all' && system.type !== filter) return false;
    if (buildingFilter !== 'all' && system.building !== buildingFilter) return false;
    return true;
  });

  // Get unique buildings
  const buildings = ['all', ...new Set(systems.map(s => s.building))];

  // Calculate occupancy percentage
  const getOccupancyPercentage = (system: StorageSystem) => {
    if (system.total_capacity === 0) return 0;
    return Math.round((system.occupied_count / system.total_capacity) * 100);
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
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Всего систем</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.overall.total_systems}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{statistics.overall.total_capacity}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{statistics.overall.total_occupied}</p>
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
                  <p className="text-2xl font-bold text-green-600">{statistics.overall.total_available}</p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
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
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building === 'all' ? 'Все корпуса' : building}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Systems Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Загрузка систем хранения...</p>
          </div>
        </div>
      ) : filteredSystems.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Нет систем хранения для отображения</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSystems.map((system) => {
            const percentage = getOccupancyPercentage(system);
            const availableSpots = system.total_capacity - system.occupied_count;

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
                    <p className="text-lg font-bold text-gray-900">{system.total_capacity}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Занято</p>
                    <p className="text-lg font-bold text-yellow-600">{system.occupied_count}</p>
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
                  <span className="text-xs text-gray-500 ml-3">
                    Обновлено: {new Date(system.updated_at).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
