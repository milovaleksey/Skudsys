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
  Info,
  Eye,
  Database
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { auditLogsApi } from '../lib/api';
import { toast } from 'sonner';

// Интерфейс лога
interface AuditLog {
  id: number;
  userId: number;
  actorUsername: string;
  actorFullName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export function UserLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{ actions: string[], entityTypes: string[] }>({ actions: [], entityTypes: [] });
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isLoading, setIsLoading] = useState(false);

  // Selected log for details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortOrder: 'DESC'
      };

      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityTypeFilter !== 'all') params.entityType = entityTypeFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo + ' 23:59:59';

      const response = await auditLogsApi.getAll(params);
      
      if (response.success && response.data) {
        // @ts-ignore - backend returns logs inside data object wrapper if strictly typed, but let's check structure
        // The API returns { data: { logs: [], pagination: {} } }
        // My interface definition in api.ts might be slightly generic, but runtime response is what matters.
        const responseData = response.data as any;
        setLogs(responseData.logs || []);
        setTotalLogs(responseData.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Не удалось загрузить журнал аудита');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const response = await auditLogsApi.getFilters();
      if (response.success && response.data) {
        setFilterOptions(response.data as any);
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [currentPage, actionFilter, entityTypeFilter, dateFrom, dateTo]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Обновить логи
  const handleRefresh = () => {
    loadLogs();
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setActionFilter('all');
    setEntityTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Просмотр деталей
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  // Получение цвета для бейджа действия
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Журнал аудита</h2>
          <p className="text-gray-600 mt-1">
            История изменений и действий пользователей в системе
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
        </div>
      </div>

      {/* Фильтры */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#00aeef]" />
          <h3 className="font-semibold text-gray-900">Фильтры</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Тип действия */}
          <div>
            <Label htmlFor="actionFilter">Действие</Label>
            <Select 
              value={actionFilter} 
              onValueChange={(value) => {
                setActionFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Все действия" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                {filterOptions.actions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Сущность */}
          <div>
            <Label htmlFor="entityTypeFilter">Объект</Label>
            <Select 
              value={entityTypeFilter} 
              onValueChange={(value) => {
                setEntityTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Все объекты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все объекты</SelectItem>
                {filterOptions.entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Кнопка сброса */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Сбросить
            </Button>
          </div>
        </div>
      </Card>

      {/* Таблица логов */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Объект
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Детали
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Записей не найдено
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.actorFullName || log.actorUsername || 'Система'}</div>
                          {log.actorUsername && <div className="text-xs text-gray-500">{log.actorUsername}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{log.entityType} #{log.entityId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Страница {currentPage} из {totalPages} ({totalLogs} записей)
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Модальное окно деталей */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали события #{selectedLog?.id}</DialogTitle>
            <DialogDescription>
              Полная информация о зафиксированном действии
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Дата и время</Label>
                  <div className="font-medium">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Действие</Label>
                  <div className="font-medium">{selectedLog.action}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Пользователь</Label>
                  <div className="font-medium">{selectedLog.actorFullName} ({selectedLog.actorUsername})</div>
                </div>
                <div>
                  <Label className="text-gray-500">Объект</Label>
                  <div className="font-medium">{selectedLog.entityType} #{selectedLog.entityId}</div>
                </div>
                <div>
                  <Label className="text-gray-500">IP адрес</Label>
                  <div className="font-medium">{selectedLog.ipAddress || '-'}</div>
                </div>
                <div>
                  <Label className="text-gray-500">User Agent</Label>
                  <div className="truncate text-xs text-gray-600" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || '-'}
                  </div>
                </div>
              </div>

              {/* Changes / Values */}
              <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <Label className="text-gray-500 mb-2 block">Изменения / Данные</Label>
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {selectedLog.changes 
                    ? JSON.stringify(typeof selectedLog.changes === 'string' ? JSON.parse(selectedLog.changes) : selectedLog.changes, null, 2)
                    : selectedLog.newValues || selectedLog.oldValues
                      ? JSON.stringify({
                          old: typeof selectedLog.oldValues === 'string' ? JSON.parse(selectedLog.oldValues) : selectedLog.oldValues,
                          new: typeof selectedLog.newValues === 'string' ? JSON.parse(selectedLog.newValues) : selectedLog.newValues
                        }, null, 2)
                      : 'Нет данных об изменениях'}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
