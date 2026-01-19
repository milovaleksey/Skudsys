import { 
  Users, 
  BarChart3, 
  Car, 
  Package, 
  FileText, 
  UserCheck, 
  Briefcase,
  MapPin,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState } from 'react';
import logo from 'figma:asset/32eaed114e6767da38e137450e9193fa44597d9f.png';
import { PassesReportPage } from './PassesReportPage';
import { LocationPage } from './LocationPage';
import { StudentsReportPage } from './StudentsReportPage';
import { EmployeesReportPage } from './EmployeesReportPage';
import { ParkingPage } from './ParkingPage';
import { UnderConstructionPage } from './UnderConstructionPage';

export function MainPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  // Mock user data
  const user = {
    login: 'admin_security',
    fullName: 'Иванов Иван Иванович',
    role: 'Администратор системы'
  };

  // Statistics data
  const statistics = [
    { label: 'Всего студентов', value: '32 000' },
    { label: 'Всего сотрудников', value: '2 400' },
    { label: 'Студентов в общежитии №1', value: '345' },
    { label: 'Студентов в общежитии №2', value: '264' },
    { label: 'Студентов в общежитии №3', value: '412' },
    { label: 'Студентов в общежитии №4', value: '298' },
    { label: 'Иностранных студентов', value: '1 247' },
    { label: 'Парковочных мест занято', value: '156 / 200' },
  ];

  // Menu items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Главная',
      icon: Home,
    },
    {
      id: 'passes',
      label: 'Отчет о проходах',
      icon: UserCheck,
    },
    {
      id: 'location',
      label: 'Где находится человек',
      icon: MapPin,
    },
    {
      id: 'analytics',
      label: 'Аналитика',
      icon: BarChart3,
    },
    {
      id: 'parking',
      label: 'Парковочная система',
      icon: Car,
    },
    {
      id: 'storage',
      label: 'Система хранения вещей',
      icon: Package,
    },
    {
      id: 'foreign-students',
      label: 'Отчет по иностранным студентам',
      icon: Users,
    },
    {
      id: 'students',
      label: 'Отчет по студентам',
      icon: FileText,
    },
    {
      id: 'employees',
      label: 'Отчет по сотрудникам',
      icon: Briefcase,
    },
  ];

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
            <img src={logo} alt="ТюмГУ" className={`transition-all duration-300 ${isSidebarOpen ? 'h-16' : 'h-12'}`} />
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
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Выйти</span>}
            </button>
          </div>

          {/* User Info Card - Only show on dashboard */}
          {activePage === 'dashboard' && (
            <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#00aeef' }}>
                Информация о пользователе
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Логин:</span>
                  <span className="text-gray-900">{user.login}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">ФИО:</span>
                  <span className="text-gray-900">{user.fullName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-600 w-32">Права доступа:</span>
                  <span className="text-gray-900">{user.role}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Статистика</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {statistics.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold" style={{ color: '#00aeef' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === 'passes' && <PassesReportPage />}
        {activePage === 'location' && <LocationPage />}
        {activePage === 'students' && <StudentsReportPage />}
        {activePage === 'employees' && <EmployeesReportPage />}
        {activePage === 'parking' && <ParkingPage />}
        {activePage === 'analytics' && <UnderConstructionPage />}
        {activePage === 'storage' && <UnderConstructionPage />}
        {activePage === 'foreign-students' && <UnderConstructionPage />}
      </main>
    </div>
  );
}