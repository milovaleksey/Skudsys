import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, User, FileText, Download, Settings, Wifi, WifiOff, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Filter, Clock, MapPin, Calendar, Wrench, Shield, X, Save, Edit2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Типы данных
interface BadEvent {
  id?: number;
  time_label: string;
  Тип_события: string;
  ФИО_пользователя: string | null;
  UPN: string | null;
  Zone: string | null;
  Child_Zone: string | null;
  Device: string;
  identificator: number;
}

interface AccessRule {
  id: string;
  department: string;
  accessTemplate: string;
  userType: 'employee' | 'student' | 'both';
  isActive: boolean;
  createdAt: string;
}

// Функции форматирования времени БЕЗ конвертации часового пояса
// time_label приходит уже в локальном времени UTC+5 (с "Z" на конце)
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  // Добавляем +3 часа
  date.setHours(date.getHours() + 3);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  // Добавляем +3 часа
  date.setHours(date.getHours() + 3);
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const formatDateTime = (dateStr: string): string => {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
};

export function EngineeringPage() {
  const [badEvents, setBadEvents] = useState<BadEvent[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Фильтры для таблицы аномальных проходов
  const [filters, setFilters] = useState({
    eventType: 'all',
    device: 'all',
    fioFilter: 'all', // all | with_fio | without_fio
    searchQuery: ''
  });

  // Состояние складной таблицы
  const [isTableExpanded, setIsTableExpanded] = useState(true);

  // Состояние сортировки по времени
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc'); // По умолчанию: новые сверху

  // Модальное окно для создания/редактирования правила
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    department: '',
    accessTemplate: '',
    userType: 'both' as 'employee' | 'student' | 'both'
  });

  // WebSocket подключение для аномальных событий
  useEffect(() => {
    // Получаем базовый URL из переменных окружения
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
    const baseUrl = apiUrl.replace('/v1', '').replace('http://', '').replace('https://', '');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('[Engineering] Нет токена авторизации');
      return;
    }

    const wsUrl = `${protocol}//${baseUrl}/ws/mqtt?token=${token}`;
    console.log('[Engineering] Подключение к WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ [Engineering] WebSocket подключен');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Engineering] Получено WebSocket сообщение:', message);
        
        // Обработка данных из топика Skud/baddialsevent
        if (message.topic === 'Skud/baddialsevent' && message.data) {
          console.log('🚨 [Engineering] Получено аномальное событие:', message.data);
          const newEvents = Array.isArray(message.data) ? message.data : [message.data];
          setBadEvents(prev => [...newEvents, ...prev].slice(0, 1000)); // Храним последние 1000
        }
      } catch (error) {
        console.error('[Engineering] Ошибка парсинга WebSocket сообщения:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ [Engineering] WebSocket ошибка:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('🔌 [Engineering] WebSocket отключен');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Загрузка данных с backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Загрузка аномальных событий через api helper
        const eventsResponse = await api.get('/engineering/bad-events');
        if (eventsResponse.success && eventsResponse.data) {
          setBadEvents(eventsResponse.data.events || []);
        }

        // Загрузка правил доступа через api helper
        const rulesResponse = await api.get('/engineering/access-rules');
        if (rulesResponse.success && rulesResponse.data) {
          setAccessRules(rulesResponse.data.rules || []);
        }
      } catch (error) {
        console.error('[Engineering] Ошибка загрузки данных:', error);
        toast.error('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Фильтрация и сортировка событий
  const filteredAndSortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Фильтрация
    const filtered = badEvents.filter(event => {
      const eventDate = new Date(event.time_label);
      const isToday = eventDate >= today && eventDate < tomorrow;
      const matchType = filters.eventType === 'all' || event.Тип_события === filters.eventType;
      const matchDevice = filters.device === 'all' || event.Device === filters.device;
      const matchFio = 
        filters.fioFilter === 'all' ||
        (filters.fioFilter === 'with_fio' && event.ФИО_пользователя) ||
        (filters.fioFilter === 'without_fio' && !event.ФИО_пользователя);
      const matchSearch = 
        filters.searchQuery === '' ||
        event.ФИО_пользователя?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        event.Device.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        event.identificator.toString().includes(filters.searchQuery);

      return isToday && matchType && matchDevice && matchFio && matchSearch;
    });

    // Сортировка по времени
    if (sortOrder) {
      filtered.sort((a, b) => {
        const timeA = new Date(a.time_label).getTime();
        const timeB = new Date(b.time_label).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    return filtered;
  }, [badEvents, filters, sortOrder]);

  // Обработчик переключения сортировки
  const toggleSort = () => {
    setSortOrder(prev => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return 'desc';
    });
  };

  // Иконка сортировки
  const getSortIcon = () => {
    if (sortOrder === 'desc') return <ArrowDown size={14} style={{ color: '#00aeef' }} />;
    if (sortOrder === 'asc') return <ArrowUp size={14} style={{ color: '#00aeef' }} />;
    return <ArrowUpDown size={14} className="text-gray-400" />;
  };

  // Уникальные типы событий и устройства для фильтров
  const eventTypes = useMemo(() => {
    return Array.from(new Set(badEvents.map(e => e.Тип_события)));
  }, [badEvents]);

  const devices = useMemo(() => {
    return Array.from(new Set(badEvents.map(e => e.Device))).sort();
  }, [badEvents]);

  // Экспорт таблицы в Excel
  const handleExportEvents = () => {
    try {
      const exportData = filteredAndSortedEvents.map(event => ({
        'Дата и время': formatDateTime(event.time_label),
        'Тип события': event.Тип_события,
        'ФИО': event.ФИО_пользователя || '—',
        'UPN': event.UPN || '—',
        'Зона': event.Zone || '—',
        'Подзона': event.Child_Zone || '—',
        'Устрйство': event.Device,
        'ID карты': event.identificator
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Аномальные события');

      const today = new Date().toLocaleDateString('ru-RU');
      const filename = `Аномальные_события_${today}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success('Отчет успешно выгружен');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      toast.error('Ошибка при экспорте');
    }
  };

  // Содание/обновление правила доступа
  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        const response = await api.put(`/engineering/access-rules/${editingRule.id}`, ruleForm);
        if (response.success && response.data) {
          setAccessRules(prev => prev.map(r => r.id === editingRule.id ? response.data.rule : r));
          toast.success('Правило обновлено');
        }
      } else {
        const response = await api.post('/engineering/access-rules', ruleForm);
        if (response.success && response.data) {
          setAccessRules(prev => [response.data.rule, ...prev]);
          toast.success('Правило создано');
        }
      }
      
      setShowRuleModal(false);
      setEditingRule(null);
      setRuleForm({ department: '', accessTemplate: '', userType: 'both' });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошиба сохранения правила');
    }
  };

  // Удаление правила
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это правило?')) return;

    try {
      const response = await api.delete(`/engineering/access-rules/${ruleId}`);
      if (response.success) {
        setAccessRules(prev => prev.filter(r => r.id !== ruleId));
        toast.success('Правило удалено');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка удаления правила');
    }
  };

  // Переключение активности правила
  const toggleRuleActive = async (ruleId: string) => {
    try {
      const response = await api.patch(`/engineering/access-rules/${ruleId}/toggle`, {});
      if (response.success && response.data) {
        setAccessRules(prev => prev.map(r => r.id === ruleId ? response.data.rule : r));
        toast.success(response.data.rule.isActive ? 'Правило активировано' : 'Правило деактивировано');
      }
    } catch (error) {
      console.error('Ошибка переключения:', error);
      toast.error('Ошибка переключения правила');
    }
  };

  const openEditModal = (rule: AccessRule) => {
    setEditingRule(rule);
    setRuleForm({
      department: rule.department,
      accessTemplate: rule.accessTemplate,
      userType: rule.userType
    });
    setShowRuleModal(true);
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm({ department: '', accessTemplate: '', userType: 'both' });
    setShowRuleModal(true);
  };

  const todayDate = new Date().toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Заголовок страницы */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#00aeef20' }}>
            <Wrench size={28} style={{ color: '#00aeef' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Инженерный раздел</h1>
            <p className="text-sm text-gray-600">Мониторинг аномальных событий и управление правилами доступа</p>
          </div>
        </div>
        
        {/* Индикатор подключения */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2 relative overflow-hidden h-6 w-32">
            {wsConnected && (
              <div className="absolute animate-[slide_3s_linear_infinite]">
                <span className="text-xl">🐱</span>
              </div>
            )}
            {!wsConnected && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-600">MQTT отключен</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: '#00aeef' }} />
            <span className="text-xs font-medium" style={{ color: '#00aeef' }}>
              События за сегодня: {todayDate}
            </span>
          </div>
        </div>
      </div>

      {/* Раздел 1: Аномльные события */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} style={{ color: '#00aeef' }} />
            <h2 className="text-lg font-semibold text-gray-900">Аномальные события СКУД</h2>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md">
              {filteredAndSortedEvents.length}
            </span>
          </div>
          <button
            onClick={handleExportEvents}
            disabled={filteredAndSortedEvents.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00aeef' }}
          >
            <Download size={18} />
            <span>Экспорт</span>
          </button>
        </div>

        {/* Фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Тип события</label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Все типы</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Устройство</label>
            <select
              value={filters.device}
              onChange={(e) => setFilters(prev => ({ ...prev, device: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Все устройства</option>
              {devices.slice(0, 50).map(device => (
                <option key={device} value={device}>{device}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ФИО</label>
            <select
              value={filters.fioFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, fioFilter: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Все</option>
              <option value="with_fio">С ФИО</option>
              <option value="without_fio">Без ФИО</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ФИО, устройство, ID..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Панель управления таблицей */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            {/* Кнопка разворачивания */}
            <Button
              onClick={() => setIsTableExpanded(prev => !prev)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTableExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Свернуть таблицу
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Развернуть таблицу ({filteredAndSortedEvents.length})
                </>
              )}
            </Button>

            {/* Счетчик результатов */}
            {filters.searchQuery && (
              <div className="text-sm text-gray-600">
                Найдено: <span className="font-semibold text-gray-900">{filteredAndSortedEvents.length}</span> событий
              </div>
            )}
          </div>
        </div>

        {/* Таблица событий */}
        {isTableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#00aeef' }}>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    <button 
                      onClick={toggleSort}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <Clock size={16} style={{ color: '#00aeef' }} />
                      Дата и время
                      {getSortIcon()}
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Тип события</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <User size={16} style={{ color: '#00aeef' }} />
                      ФИО
                    </div>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} style={{ color: '#00aeef' }} />
                      Устройство
                    </div>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Зона</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">ID карты</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Загрузка данных...
                    </td>
                  </tr>
                ) : filteredAndSortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      {filters.searchQuery ? 'По вашему запросу ничего не найдено' : 'Нет аномальных событий за сегодня'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedEvents.slice(0, 100).map((event, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="text-gray-900 font-medium">
                          {formatDate(event.time_label)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(event.time_label)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                          {event.Тип_события}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-900">{event.ФИО_пользователя || '—'}</div>
                        {event.UPN && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{event.UPN}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-700">{event.Device}</td>
                      <td className="py-3 px-3">
                        <div className="text-gray-900 text-xs">{event.Zone || '—'}</div>
                        {event.Child_Zone && (
                          <div className="text-xs text-gray-500">{event.Child_Zone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-gray-600">{event.identificator}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filteredAndSortedEvents.length > 100 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Показано первых 100 из {filteredAndSortedEvents.length} событий. Используйте фильтры для уточнения.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Раздел 2: Правила доступа */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: '#00aeef' }} />
            <h2 className="text-lg font-semibold text-gray-900">Правила доступа</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">
              {accessRules.length}
            </span>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#00aeef' }}
          >
            <Plus size={18} />
            <span>Создать правило</span>
          </button>
        </div>

        {/* Таблица правил */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#00aeef' }}>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Отдел</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Шаблон доступа</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Применяется к</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Статус</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Создано</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Загрузка правил...
                  </td>
                </tr>
              ) : accessRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Правила доступа не настроены. Создайте первое правило.
                  </td>
                </tr>
              ) : (
                accessRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{rule.department}</td>
                    <td className="py-3 px-3 text-gray-700">{rule.accessTemplate}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        rule.userType === 'employee' 
                          ? 'bg-blue-100 text-blue-700'
                          : rule.userType === 'student'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rule.userType === 'employee' ? 'Сотрудники' : rule.userType === 'student' ? 'Студенты' : 'Все'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          rule.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {rule.isActive ? 'Активно' : 'Нактивно'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {new Date(rule.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно созданя/редактирования правила */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRule ? 'Редактировать правило' : 'Создать правило'}
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отдел / Подразделение
                </label>
                <input
                  type="text"
                  placeholder="Например: Институт математики и компьютерных наук"
                  value={ruleForm.department}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#00aeef' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Шаблон доступа
                </label>
                <input
                  type="text"
                  placeholder="Например: Полный доступ 24/7"
                  value={ruleForm.accessTemplate}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, accessTemplate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#00aeef' } as any}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Применяется к
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="employee"
                      checked={ruleForm.userType === 'employee'}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Сотруднии</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="student"
                      checked={ruleForm.userType === 'student'}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Студенты</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userType"
                      value="both"
                      checked={ruleForm.userType === 'both'}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, userType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Все (сотрудники и студенты)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSaveRule}
                disabled={!ruleForm.department || !ruleForm.accessTemplate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#00aeef' }}
              >
                <Save size={18} />
                <span>Сохранить</span>
              </button>
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}