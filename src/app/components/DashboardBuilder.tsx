import { useState } from 'react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  GripVertical, 
  Database, 
  Wifi,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { toast } from 'sonner';

// Типы виджетов
export type WidgetType = 
  | 'stat' 
  | 'chart-bar' 
  | 'chart-line' 
  | 'chart-pie' 
  | 'table' 
  | 'mqtt-live'
  | 'trend';

// Источники данных
export type DataSourceType = 'database' | 'mqtt' | 'api';

// Интерфейс виджета
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: DataSourceType;
  
  // Для БД
  sqlQuery?: string;
  database?: string;
  table?: string;
  column?: string;
  
  // Для MQTT
  mqttTopic?: string;
  mqttField?: string;
  
  // Для API
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST';
  
  // Настройки отображения
  width: 1 | 2 | 3 | 4; // Ширина в колонках (1-4)
  height: 'small' | 'medium' | 'large';
  color?: string;
  icon?: string;
  unit?: string; // Единица измерения (шт, %, км и т.д.)
  refreshInterval?: number; // Интервал обновления в секундах
  
  // Позиция
  order: number;
  isVisible: boolean;
}

interface DashboardBuilderProps {
  onSave?: (widgets: DashboardWidget[]) => void;
}

// Моковые данные для начала
const initialWidgets: DashboardWidget[] = [
  {
    id: '1',
    type: 'stat',
    title: 'Всего студентов',
    dataSource: 'database',
    database: 'utmn_security',
    table: 'students',
    sqlQuery: 'SELECT COUNT(*) as value FROM students',
    width: 1,
    height: 'small',
    color: '#00aeef',
    order: 0,
    isVisible: true,
    unit: 'чел'
  },
  {
    id: '2',
    type: 'stat',
    title: 'Всего сотрудников',
    dataSource: 'database',
    database: 'utmn_security',
    table: 'employees',
    sqlQuery: 'SELECT COUNT(*) as value FROM employees',
    width: 1,
    height: 'small',
    color: '#00aeef',
    order: 1,
    isVisible: true,
    unit: 'чел'
  },
  {
    id: '3',
    type: 'mqtt-live',
    title: 'Температура сервера',
    dataSource: 'mqtt',
    mqttTopic: 'utmn/server/temperature',
    mqttField: 'value',
    width: 1,
    height: 'small',
    color: '#ef4444',
    order: 2,
    isVisible: true,
    unit: '°C',
    refreshInterval: 5
  },
];

export function DashboardBuilder({ onSave }: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState<Partial<DashboardWidget>>({
    type: 'stat',
    title: '',
    dataSource: 'database',
    width: 1,
    height: 'small',
    isVisible: true,
    color: '#00aeef',
    refreshInterval: 30
  });

  // Иконки для типов виджетов
  const widgetTypeIcons: Record<WidgetType, any> = {
    'stat': TrendingUp,
    'chart-bar': BarChart3,
    'chart-line': LineChart,
    'chart-pie': PieChart,
    'table': TableIcon,
    'mqtt-live': Activity,
    'trend': TrendingUp
  };

  // Названия типов виджетов
  const widgetTypeLabels: Record<WidgetType, string> = {
    'stat': 'Статистика',
    'chart-bar': 'Столбчатая диаграмма',
    'chart-line': 'Линейный график',
    'chart-pie': 'Круговая диаграмма',
    'table': 'Таблица',
    'mqtt-live': 'MQTT Live данные',
    'trend': 'Тренд'
  };

  // Открыть диалог добавления
  const handleAddWidget = () => {
    setFormData({
      type: 'stat',
      title: '',
      dataSource: 'database',
      width: 1,
      height: 'small',
      isVisible: true,
      color: '#00aeef',
      refreshInterval: 30
    });
    setIsAddDialogOpen(true);
  };

  // Открыть диалог редактирования
  const handleEditWidget = (widget: DashboardWidget) => {
    setSelectedWidget(widget);
    setFormData(widget);
    setIsEditDialogOpen(true);
  };

  // Сохранить новый виджет
  const handleSaveNewWidget = () => {
    if (!formData.title) {
      toast.error('Введите название виджета');
      return;
    }

    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      type: formData.type || 'stat',
      title: formData.title,
      dataSource: formData.dataSource || 'database',
      sqlQuery: formData.sqlQuery,
      database: formData.database,
      table: formData.table,
      column: formData.column,
      mqttTopic: formData.mqttTopic,
      mqttField: formData.mqttField,
      apiEndpoint: formData.apiEndpoint,
      apiMethod: formData.apiMethod,
      width: formData.width || 1,
      height: formData.height || 'small',
      color: formData.color,
      unit: formData.unit,
      refreshInterval: formData.refreshInterval,
      order: widgets.length,
      isVisible: true
    };

    setWidgets([...widgets, newWidget]);
    setIsAddDialogOpen(false);
    toast.success('Виджет добавлен');
  };

  // Сохранить изменения виджета
  const handleSaveEditWidget = () => {
    if (!selectedWidget) return;

    const updatedWidgets = widgets.map(w => 
      w.id === selectedWidget.id ? { ...selectedWidget, ...formData } : w
    );

    setWidgets(updatedWidgets);
    setIsEditDialogOpen(false);
    setSelectedWidget(null);
    toast.success('Виджет обновлен');
  };

  // Удалить виджет
  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    toast.success('Виджет удален');
  };

  // Переключить видимость
  const toggleVisibility = (id: string) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, isVisible: !w.isVisible } : w
    ));
  };

  // Переместить виджет вверх
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
    newWidgets.forEach((w, i) => w.order = i);
    setWidgets(newWidgets);
  };

  // Переместить виджет вниз
  const moveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    newWidgets.forEach((w, i) => w.order = i);
    setWidgets(newWidgets);
  };

  // Сохранить конфигурацию
  const handleSaveConfig = () => {
    if (onSave) {
      onSave(widgets);
    }
    // Здесь можно отправить на бэкенд
    localStorage.setItem('dashboard_config', JSON.stringify(widgets));
    toast.success('Конфигурация сохранена');
  };

  // Рендер формы настроек виджета
  const renderWidgetForm = () => (
    <div className="space-y-4 py-4">
      {/* Название */}
      <div className="space-y-2">
        <Label htmlFor="title">Название виджета *</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Например: Всего студентов"
        />
      </div>

      {/* Тип виджета */}
      <div className="space-y-2">
        <Label htmlFor="type">Тип виджета *</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value: WidgetType) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(widgetTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Источник данных */}
      <div className="space-y-2">
        <Label htmlFor="dataSource">Источник данных *</Label>
        <Select 
          value={formData.dataSource} 
          onValueChange={(value: DataSourceType) => setFormData({ ...formData, dataSource: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="database">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                База данных (MySQL)
              </div>
            </SelectItem>
            <SelectItem value="mqtt">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                MQTT брокер
              </div>
            </SelectItem>
            <SelectItem value="api">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                REST API
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Настройки для БД */}
      {formData.dataSource === 'database' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="database">База данных</Label>
            <Input
              id="database"
              value={formData.database || ''}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              placeholder="utmn_security"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table">Таблица</Label>
            <Input
              id="table"
              value={formData.table || ''}
              onChange={(e) => setFormData({ ...formData, table: e.target.value })}
              placeholder="students, employees, access_logs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sqlQuery">SQL запрос</Label>
            <Textarea
              id="sqlQuery"
              value={formData.sqlQuery || ''}
              onChange={(e) => setFormData({ ...formData, sqlQuery: e.target.value })}
              placeholder="SELECT COUNT(*) as value FROM students"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Запрос должен возвращать поле 'value' с числовым значением
            </p>
          </div>
        </>
      )}

      {/* Настройки для MQTT */}
      {formData.dataSource === 'mqtt' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mqttTopic">MQTT Topic *</Label>
            <Input
              id="mqttTopic"
              value={formData.mqttTopic || ''}
              onChange={(e) => setFormData({ ...formData, mqttTopic: e.target.value })}
              placeholder="utmn/sensors/temperature"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mqttField">Поле в JSON</Label>
            <Input
              id="mqttField"
              value={formData.mqttField || ''}
              onChange={(e) => setFormData({ ...formData, mqttField: e.target.value })}
              placeholder="value, temperature, count"
            />
            <p className="text-xs text-gray-500">
              Если MQTT отправляет JSON, укажите название поля
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refreshInterval">Интервал обновления (сек)</Label>
            <Input
              id="refreshInterval"
              type="number"
              value={formData.refreshInterval || 30}
              onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
              min={1}
            />
          </div>
        </>
      )}

      {/* Настройки для API */}
      {formData.dataSource === 'api' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="apiEndpoint">API Endpoint *</Label>
            <Input
              id="apiEndpoint"
              value={formData.apiEndpoint || ''}
              onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              placeholder="/api/students/count"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiMethod">HTTP метод</Label>
            <Select 
              value={formData.apiMethod || 'GET'} 
              onValueChange={(value: 'GET' | 'POST') => setFormData({ ...formData, apiMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Настройки отображения */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-3">Настройки отображения</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">Ширина</Label>
            <Select 
              value={formData.width?.toString()} 
              onValueChange={(value) => setFormData({ ...formData, width: parseInt(value) as 1 | 2 | 3 | 4 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 колонка</SelectItem>
                <SelectItem value="2">2 колонки</SelectItem>
                <SelectItem value="3">3 колонки</SelectItem>
                <SelectItem value="4">4 колонки (полная ширина)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Высота</Label>
            <Select 
              value={formData.height} 
              onValueChange={(value: 'small' | 'medium' | 'large') => setFormData({ ...formData, height: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Маленькая</SelectItem>
                <SelectItem value="medium">Средняя</SelectItem>
                <SelectItem value="large">Большая</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="unit">Единица измерения</Label>
          <Input
            id="unit"
            value={formData.unit || ''}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="чел, шт, %, °C, км"
          />
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="color">Цвет акцента</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color || '#00aeef'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={formData.color || '#00aeef'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#00aeef"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Конструктор дашборда</h2>
          <p className="text-gray-600 mt-1">
            Настройка виджетов главной страницы с данными из БД и MQTT
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Режим редактирования
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Предпросмотр
              </>
            )}
          </Button>
          
          <Button
            onClick={handleAddWidget}
            className="bg-[#00aeef] hover:bg-[#008ac4]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить виджет
          </Button>
          
          <Button
            onClick={handleSaveConfig}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Всего виджетов</div>
          <div className="text-2xl font-bold text-gray-900">{widgets.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Видимых</div>
          <div className="text-2xl font-bold text-green-600">
            {widgets.filter(w => w.isVisible).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Из БД</div>
          <div className="text-2xl font-bold text-blue-600">
            {widgets.filter(w => w.dataSource === 'database').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Из MQTT</div>
          <div className="text-2xl font-bold text-purple-600">
            {widgets.filter(w => w.dataSource === 'mqtt').length}
          </div>
        </Card>
      </div>

      {/* Список виджетов */}
      {!previewMode ? (
        <div className="space-y-3">
          {widgets.map((widget, index) => {
            const Icon = widgetTypeIcons[widget.type];
            const SourceIcon = widget.dataSource === 'database' ? Database : 
                              widget.dataSource === 'mqtt' ? Wifi : Activity;
            
            return (
              <Card 
                key={widget.id} 
                className={`p-4 ${!widget.isVisible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Drag handle */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === widgets.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Иконка типа */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: widget.color + '20' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: widget.color }} />
                  </div>

                  {/* Информация */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{widget.title}</h3>
                      <Badge variant="outline">{widgetTypeLabels[widget.type]}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <SourceIcon className="w-3 h-3" />
                        {widget.dataSource === 'database' ? 'БД' : 
                         widget.dataSource === 'mqtt' ? 'MQTT' : 'API'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {widget.dataSource === 'database' && widget.table && (
                        <span>Таблица: {widget.table}</span>
                      )}
                      {widget.dataSource === 'mqtt' && widget.mqttTopic && (
                        <span>Topic: {widget.mqttTopic}</span>
                      )}
                      {widget.dataSource === 'api' && widget.apiEndpoint && (
                        <span>Endpoint: {widget.apiEndpoint}</span>
                      )}
                    </div>
                  </div>

                  {/* Размер */}
                  <div className="text-sm text-gray-500">
                    <div>Ширина: {widget.width} кол.</div>
                    <div>Высота: {widget.height}</div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(widget.id)}
                      title={widget.isVisible ? 'Скрыть' : 'Показать'}
                    >
                      {widget.isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWidget(widget)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWidget(widget.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {widgets.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500">Нет виджетов. Нажмите "Добавить виджет" для начала</p>
            </Card>
          )}
        </div>
      ) : (
        // Режим предпросмотра
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Предпросмотр дашборда</h3>
          <div className="grid grid-cols-4 gap-4">
            {widgets.filter(w => w.isVisible).map((widget) => {
              const Icon = widgetTypeIcons[widget.type];
              const widthClass = {
                1: 'col-span-1',
                2: 'col-span-2',
                3: 'col-span-3',
                4: 'col-span-4'
              }[widget.width];

              return (
                <Card 
                  key={widget.id} 
                  className={`p-6 ${widthClass}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" style={{ color: widget.color }} />
                    <div className="text-sm text-gray-600">{widget.title}</div>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: widget.color }}>
                    1,234 {widget.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {widget.dataSource === 'database' ? '🗄️ БД' : 
                     widget.dataSource === 'mqtt' ? '📡 MQTT Live' : '🌐 API'}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Диалог добавления виджета */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00aeef]" />
              Добавить виджет
            </DialogTitle>
            <DialogDescription>
              Создайте новый виджет для отображения данных на главной странице
            </DialogDescription>
          </DialogHeader>

          {renderWidgetForm()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveNewWidget} className="bg-[#00aeef] hover:bg-[#008ac4]">
              <Save className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования виджета */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00aeef]" />
              Редактировать виджет
            </DialogTitle>
            <DialogDescription>
              Изменение настроек виджета "{selectedWidget?.title}"
            </DialogDescription>
          </DialogHeader>

          {renderWidgetForm()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveEditWidget} className="bg-[#00aeef] hover:bg-[#008ac4]">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}