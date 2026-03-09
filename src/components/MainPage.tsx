import { UsersSettingsPage } from './UsersSettingsPage';
import { RolesManagementPage } from './RolesManagementPage';
import { DashboardBuilder } from './DashboardBuilder';
import { UserLogsPage } from './UserLogsPage';
import { IdentifierSearchPage } from './IdentifierSearchPage';
import { DynamicStatCard } from './DynamicStatCard';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from './ui/badge';
import { Logo } from './Logo';
import { studentsApi, employeesApi, parkingApi } from '../lib/api';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { useMQTTWebSocket } from '../hooks/useMQTT';
import { Card } from './ui/card';
import { ForeignStudentsReport } from './ForeignStudentsReport';
import { AnalyticsPage } from './AnalyticsPage';
import { PassesReportPage } from './PassesReportPage';
import { LocationPage } from './LocationPage';
import { StudentsReportPage } from './StudentsReportPage';
import { EmployeesReportPage } from './EmployeesReportPage';
import { ParkingPage } from './ParkingPage';
import { StorageSystemsPage } from './StorageSystemsPage';

export function MainPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();

  // WebSocket подключение к MQTT через backend
  const { cards: mqttCards, status: mqttStatus, isConnected: wsConnected, error: mqttError, reconnect } = useMQTTWebSocket();

  // Fallback статистика из API (если MQTT не подключен)
  const [stats, setStats] = useState([
    { label: 'Всего студентов', value: '...' },
    { label: 'Всего сотрудников', value: '...' },
    { label: 'Парковочных мест занято', value: '...' },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [students, employees, parking] = await Promise.all([
           studentsApi.getStatistics().catch(() => ({ success: false, data: { total: 0 } })),
           employeesApi.getStatistics().catch(() => ({ success: false, data: { total: 0 } })),
           parkingApi.getStatistics().catch(() => ({ success: false, data: { occupied: 0, total: 0 } }))
        ]);
        
        setStats([
          { label: 'Всего студентов', value: students.success ? (students.data as any).total : 'Нет данных' },
          { label: 'Всего сотрудников', value: employees.success ? (employees.data as any).total : 'Нет данных' },
          { label: 'Парковочных мест занято', value: parking.success ? `${(parking.data as any).occupied} / ${(parking.data as any).total}` : 'Нет данных' },
        ]);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    };
    
    if (activePage === 'dashboard' && !wsConnected) {
      loadStats();
    }
  }, [activePage, wsConnected]);

  // Получение метки роли
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Администратор',
      security: 'Безопасность',
      manager: 'Менеджер',
      operator: 'Оператор',
      viewer: 'Наблюдатель',
    };
    return labels[role] || role;
  };

  // Menu items с проверкой прав доступа
  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Главная',
      icon: Home,
      permission: 'dashboard',
    },
    {
      id: 'dashboard-builder',
      label: 'Конструктор дашборда',
      icon: Layout,
      permission: 'dashboard-builder',
    },
    {
      id: 'passes',
      label: 'Отчет о проходах',
      icon: UserCheck,
      permission: 'passes',
    },
    {
      id: 'identifier-search',
      label: 'Поиск по идентификатору',
      icon: Search,
      permission: 'identifier-search',
    },
    {
      id: 'location',
      label: 'Где находится человек',
      icon: MapPin,
      permission: 'location',
    },
    {
      id: 'analytics',
      label: 'Аналитика',
      icon: BarChart3,
      permission: 'analytics',
    },
    {
      id: 'parking',
      label: 'Парковочная система',
      icon: Car,
      permission: 'parking',
    },
    {
      id: 'storage',
      label: 'Система хранения вещей',
      icon: Package,
      permission: 'storage',
    },
    {
      id: 'foreign-students',
      label: 'Отчет по иностранным студентам',
      icon: Users,
      permission: 'foreign-students',
    },
    {
      id: 'students',
      label: 'Отчет по студентам',
      icon: FileText,
      permission: 'students',
    },
    {
      id: 'employees',
      label: 'Отчет по сотрудникам',
      icon: Briefcase,
      permission: 'employees',
    },
    {
      id: 'users-settings',
      label: 'Управление пользователями',
      icon: Settings,
      permission: 'users-settings',
    },
    {
      id: 'roles-settings',
      label: 'Управление ролями',
      icon: Settings,
      permission: 'roles-settings',
    },
    {
      id: 'user-logs',
      label: 'Логи пользователей',
      icon: ScrollText,
      permission: 'user-logs',
    },
  ];

  // Фильтрация меню по правам доступа
  const menuItems = allMenuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <aside 
        className={`bg-white shadow-xl transition-all duration-300 ${
          isSidebarOpen ? 'w-80' : 'w-20'
        } flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <Logo className={`transition-all duration-300 ${isSidebarOpen ? 'h-16' : 'h-12'}`} />
          </div>
        </div>

        {/* Menu Section */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left text-gray-700"
                onClick={() => setActivePage(item.id)}
              >
                <item.icon size={20} style={{ color: '#00aeef' }} />
                {isSidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Toggle Sidebar Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            style={{ color: '#00aeef' }}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Системы безопасности инфраструктуры
            </h1>
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/50 transition-colors text-gray-700"
              title="Выйти"
              onClick={logout}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Выйти</span>}
            </button>
          </div>

          {/* User Info Card - Only show on dashboard */}
          {activePage === 'dashboard' && user && (
            <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#00aeef' }}>
                Информация о пользователе
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Логин:</span>
                  <span className="text-gray-900">{user.username}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">ФИО:</span>
                  <span className="text-gray-900">{user.fullName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Права доступа:</span>
                  <span className="text-gray-900">
                    <Badge>{getRoleLabel(user.role)}</Badge>
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="text-sm text-[#00aeef] hover:underline flex items-center gap-2"
                >
                  <Settings size={14} />
                  Сменить пароль
                </button>
              </div>
            </div>
          )}
        </div>

        <ChangePasswordDialog 
          open={isChangePasswordOpen} 
          onOpenChange={setIsChangePasswordOpen} 
        />

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <div>
            {/* MQTT Connection Status - простой значок без текста */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Статистика</h2>
              {wsConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {/* Динамические карточки из MQTT или статичные из API */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wsConnected && mqttCards.length > 0 ? (
                // Динамические карточки из MQTT
                mqttCards.map((card) => (
                  <DynamicStatCard
                    key={card.id}
                    card={card}
                    value={card.value}
                  />
                ))
              ) : (
                // Fallback статичные карточки из API
                stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                    <div className="text-3xl font-bold" style={{ color: '#00aeef' }}>
                      {stat.value}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Информационное сообщение если MQTT не подключен */}
            {!wsConnected && !mqttError && (
              <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Подключите MQTT для динамических данных</p>
                    <p className="text-xs text-blue-700">
                      Для отображения карточек в реальном времени настройте MQTT подключение. 
                      Конфигурация карточек загружается из топика <code className="bg-blue-100 px-1 rounded">Skud/main/stat</code>.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Ошибка подключения MQTT */}
            {mqttError && (
              <Card className="mt-6 p-4 bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-900">
                    <p className="font-medium mb-1">Ошибка подключения к MQTT</p>
                    <p className="text-xs text-red-700">{mqttError}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activePage === 'dashboard-builder' && <DashboardBuilder />}
        {activePage === 'passes' && <PassesReportPage />}
        {activePage === 'location' && <LocationPage />}
        {activePage === 'students' && <StudentsReportPage />}
        {activePage === 'employees' && <EmployeesReportPage />}
        {activePage === 'parking' && <ParkingPage />}
        {activePage === 'storage' && <StorageSystemsPage />}
        {activePage === 'analytics' && <AnalyticsPage />}
        {activePage === 'foreign-students' && <ForeignStudentsReport />}
        {activePage === 'users-settings' && <UsersSettingsPage />}
        {activePage === 'roles-settings' && <RolesManagementPage />}
        {activePage === 'user-logs' && <UserLogsPage />}
        {activePage === 'identifier-search' && <IdentifierSearchPage />}
      </main>
    </div>
  );
}