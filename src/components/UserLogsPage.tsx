import { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  FileText,
  User,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { accessLogsApi } from '../lib/api';

// Типы действий пользователей
type ActionType = string;

// Уровень важности
type LogLevel = 'info' | 'warning' | 'error' | 'success';

// Интерфейс лога
interface UserLog {
  id: number;
  timestamp: string;
  userId: number;
  userName: string;
  userUPN: string;
  userRole: string;
  action: ActionType;
  actionDescription: string;
  ipAddress: string;
  userAgent: string;
  level: LogLevel;
  details?: string;
}

export function UserLogsPage() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const itemsPerPage = 20;

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь стоит использовать серверную пагинацию и фильтрацию
      // Для совместимости с текущей логикой загрузим последние 1000 логов
      const response = await accessLogsApi.getAll({ limit: 1000 });
      if (response.success && response.data) {
        // Маппинг данных если необходимо. Предполагаем, что API возвращает совместимый формат
        // Если формат отличается, здесь нужно добавить преобразование
        setLogs(response.data as any[]); 
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Фильтрация логов
  const filteredLogs = logs.filter(log => {
    // Поиск по ФИО или UPN
    const searchLower = searchQuery.toLowerCase();
    const userName = log.userName || '';
    const userUPN = log.userUPN || '';
    
    const matchesSearch = !searchQuery || 
      userName.toLowerCase().includes(searchLower) ||
      userUPN.toLowerCase().includes(searchLower);

    // Фильтр по типу действия
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    // Фильтр по уровню
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;

    // Фильтр по датам
    const logDate = new Date(log.timestamp);
    const matchesDateFrom = !dateFrom || logDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesAction && matchesLevel && matchesDateFrom && matchesDateTo;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Иконки для типов действий (fallback для неизвестных типов)
  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      'login': CheckCircle,
      'logout': XCircle,
      'view_report': FileText,
      'export_data': Download,
      'edit_user': User,
      'delete_user': AlertCircle,
      'create_user': User,
      'edit_role': User,
      'change_settings': Activity,
      'access_denied': AlertCircle
    };
    return icons[action] || Activity;
  };

  // Цвета для уровней
  const levelColors: Record<string, string> = {
    'info': 'bg-blue-100 text-blue-800',
    'success': 'bg-green-100 text-green-800',
    'warning': 'bg-yellow-100 text-yellow-800',
    'error': 'bg-red-100 text-red-800'
  };

  // Иконки для уровней
  const levelIcons: Record<string, any> = {
    'info': Info,
    'success': CheckCircle,
    'warning': AlertCircle,
    'error': XCircle
  };


  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;

    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обновить логи
  const handleRefresh = () => {
    loadLogs();
  };

  // Экспорт логов
  const handleExport = () => {
    const csv = [
      ['Дата и время', 'Пользователь', 'UPN', 'Роль', 'Действие', 'IP адрес', 'Уровень'].join(';'),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString('ru-RU'),
        log.userName,
        log.userUPN,
        log.userRole,
        log.actionDescription,
        log.ipAddress,
        log.level
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `user_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setLevelFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Логи действий пользователей</h2>
          <p className="text-gray-600 mt-1">
            История всех действий пользователей в системе
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          
          <Button
            onClick={handleExport}
            className="bg-[#00aeef] hover:bg-[#008ac4]"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Всего логов</div>
              <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Успешных</div>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.level === 'success').length}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Предупреждений</div>
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.level === 'warning').length}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Ошибок</div>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.level === 'error').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Фильтры */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#00aeef]" />
          <h3 className="font-semibold text-gray-900">Фильтры</h3>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Поиск по ФИО или UPN */}
          <div className="col-span-2">
            <Label htmlFor="search">Поиск по ФИО или UPN</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Иванов или ivanov@utmn.ru"
                className="pl-10"
              />
            </div>
          </div>

          {/* Дата от */}
          <div>
            <Label htmlFor="dateFrom">Дата от</Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Дата до */}
          <div>
            <Label htmlFor="dateTo">Дата до</Label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Тип действия */}
          <div>
            <Label htmlFor="actionFilter">Тип действия</Label>
            <Select 
              value={actionFilter} 
              onValueChange={(value) => {
                setActionFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                <SelectItem value="login">Вход в систему</SelectItem>
                <SelectItem value="logout">Выход из системы</SelectItem>
                <SelectItem value="view_report">Просмотр отчета</SelectItem>
                <SelectItem value="export_data">Экспорт данных</SelectItem>
                <SelectItem value="edit_user">Редактирование пользователя</SelectItem>
                <SelectItem value="delete_user">Удаление пользователя</SelectItem>
                <SelectItem value="create_user">Создание пользователя</SelectItem>
                <SelectItem value="edit_role">Изменение роли</SelectItem>
                <SelectItem value="change_settings">Изменение настроек</SelectItem>
                <SelectItem value="access_denied">Отказ в доступе</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Уровень */}
          <div>
            <Label htmlFor="levelFilter">Уровень</Label>
            <Select 
              value={levelFilter} 
              onValueChange={(value) => {
                setLevelFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="info">Информация</SelectItem>
                <SelectItem value="success">Успех</SelectItem>
                <SelectItem value="warning">Предупреждение</SelectItem>
                <SelectItem value="error">Ошибка</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Кнопка сброса */}
          <div className="col-span-2 flex items-end">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>

        {/* Результаты поиска */}
        <div className="mt-4 text-sm text-gray-600">
          Найдено записей: <span className="font-semibold text-gray-900">{filteredLogs.length}</span>
        </div>
      </Card>

      {/* Таблица логов */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата и время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP адрес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                const LevelIcon = levelIcons[log.level];
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <div className="text-xs text-gray-500">{log.userUPN}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ActionIcon className="w-4 h-4 text-[#00aeef]" />
                        <div>
                          <div className="text-sm text-gray-900">{log.actionDescription}</div>
                          {log.details && (
                            <div className="text-xs text-gray-500">{log.details}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">{log.ipAddress}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${levelColors[log.level]} flex items-center gap-1 w-fit`}>
                        <LevelIcon className="w-3 h-3" />
                        {log.level === 'info' ? 'Инфо' :
                         log.level === 'success' ? 'Успех' :
                         log.level === 'warning' ? 'Предупр.' :
                         'Ошибка'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Показано {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} из {filteredLogs.length}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Предыдущая
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-[#00aeef] hover:bg-[#008ac4]" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Следующая
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}