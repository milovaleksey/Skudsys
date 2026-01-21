import { createContext, useContext, useState, ReactNode } from 'react';

// Определение базовых ролей
export type UserRole = string; // Теперь может быть любая строка

// Интерфейс для роли
export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // Системные роли нельзя удалять
  createdAt: string;
  updatedAt?: string;
}

// Список всех доступных прав (permissions)
export const ALL_PERMISSIONS = [
  { id: 'dashboard', name: 'Главная панель', category: 'Основные' },
  { id: 'dashboard-builder', name: 'Конструктор дашборда', category: 'Администрирование' },
  { id: 'passes', name: 'Отчет о проходах', category: 'Безопасность' },
  { id: 'location', name: 'Местонахождение людей', category: 'Безопасность' },
  { id: 'analytics', name: 'Аналитика', category: 'Отчеты' },
  { id: 'parking', name: 'Парковочная система', category: 'Инфраструктура' },
  { id: 'storage', name: 'Система хранения вещей', category: 'Инфраструктура' },
  { id: 'foreign-students', name: 'Отчет по иностранным студентам', category: 'Отчеты' },
  { id: 'students', name: 'Отчет по студентам', category: 'Отчеты' },
  { id: 'employees', name: 'Отчет по сотрудникам', category: 'Отчеты' },
  { id: 'users-settings', name: 'Управление пользователями', category: 'Администрирование' },
  { id: 'roles-settings', name: 'Управление ролями', category: 'Администрирование' },
  { id: 'user-logs', name: 'Логи действий пользователей', category: 'Администрирование' },
];

// Системные роли (по умолчанию)
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: ALL_PERMISSIONS.map(p => p.id),
    isSystem: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'security',
    name: 'security',
    displayName: 'Безопасность',
    description: 'Доступ к системам безопасности и контроля доступа',
    permissions: ['dashboard', 'passes', 'location', 'parking', 'storage'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'manager',
    name: 'manager',
    displayName: 'Менеджер',
    description: 'Доступ к аналитике и отчетам',
    permissions: ['dashboard', 'analytics', 'students', 'employees', 'foreign-students'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'operator',
    name: 'operator',
    displayName: 'Оператор',
    description: 'Доступ к просмотру и работе с данными',
    permissions: ['dashboard', 'passes', 'location', 'students', 'employees'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'viewer',
    name: 'viewer',
    displayName: 'Наблюдатель',
    description: 'Только просмотр общей информации',
    permissions: ['dashboard', 'analytics'],
    isSystem: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string; // Теперь ссылается на role.name
  authType: 'local' | 'sso';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  roles: Role[];
  login: (username: string, password: string, authType: 'local' | 'sso') => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  updateUser: (user: User) => void;
  addRole: (role: Omit<Role, 'id' | 'createdAt'>) => Role;
  updateRole: (roleId: string, updates: Partial<Role>) => void;
  deleteRole: (roleId: string) => void;
  getRoleByName: (name: string) => Role | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: 'admin_security',
    fullName: 'Иванов Иван Иванович',
    email: 'ivanov@utmn.ru',
    role: 'admin',
    authType: 'local',
    createdAt: '2025-01-15T10:30:00Z',
    lastLogin: '2026-01-19T08:15:00Z',
    isActive: true,
  });

  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);

  const login = async (username: string, password: string, authType: 'local' | 'sso') => {
    // Здесь должна быть реальная логика авторизации
    // Пока используем мок данные
    const mockUser: User = {
      id: 1,
      username,
      fullName: 'Иванов Иван Иванович',
      email: username.includes('@') ? username : `${username}@utmn.ru`,
      role: 'admin',
      authType,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
    };
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const getRoleByName = (name: string): Role | undefined => {
    return roles.find(r => r.name === name);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const role = getRoleByName(user.role);
    return role ? role.permissions.includes(permission) : false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    const role = getRoleByName(user.role);
    if (!role) return false;
    return permissions.some(p => role.permissions.includes(p));
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const addRole = (roleData: Omit<Role, 'id' | 'createdAt'>): Role => {
    const newRole: Role = {
      ...roleData,
      id: `custom_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRoles([...roles, newRole]);
    return newRole;
  };

  const updateRole = (roleId: string, updates: Partial<Role>) => {
    setRoles(roles.map(role => 
      role.id === roleId 
        ? { ...role, ...updates, updatedAt: new Date().toISOString() }
        : role
    ));
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      throw new Error('Системные роли нельзя удалять');
    }
    setRoles(roles.filter(r => r.id !== roleId));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        roles,
        login, 
        logout, 
        hasPermission, 
        hasAnyPermission,
        updateUser,
        addRole,
        updateRole,
        deleteRole,
        getRoleByName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}