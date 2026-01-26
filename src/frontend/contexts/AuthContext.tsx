import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TokenManager, authApi, rolesApi, type ApiResponse, type LoginResponse } from '../lib/api';

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
  externalGroups?: string[]; // Внешние группы AD/SSO для автоматического маппинга
  createdAt: string;
  updatedAt?: string;
}

// Список всех доступных прав (permissions)
export const ALL_PERMISSIONS = [
  { id: 'dashboard', name: 'Главная панель', category: 'Основные' },
  { id: 'dashboard-builder', name: 'Конструктор дашборда', category: 'Администрирование' },
  { id: 'passes', name: 'Отчет о проходах', category: 'Безопасность' },
  { id: 'identifier-search', name: 'Поиск по идентификатору', category: 'Безопасность' },
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
    permissions: ['dashboard', 'passes', 'identifier-search', 'location', 'parking', 'storage'],
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
    permissions: ['dashboard', 'passes', 'identifier-search', 'location', 'students', 'employees'],
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
  loading: boolean;
  login: (username: string, password: string, authType: 'local' | 'sso') => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  updateUser: (user: User) => void;
  addRole: (role: Omit<Role, 'id' | 'createdAt'>) => Promise<Role>;
  updateRole: (roleId: string, updates: Partial<Role>) => void;
  deleteRole: (roleId: string) => void;
  getRoleByName: (name: string) => Role | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState<boolean>(true);

  // Загрузка текущего пользователя при монтировании
  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = TokenManager.getToken();
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data as User);
          } else {
            TokenManager.clearTokens();
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          TokenManager.clearTokens();
        }
      }
      setLoading(false);
    };

    const loadRoles = async () => {
      // Загружаем роли только если пользователь авторизован
      const token = TokenManager.getToken();
      if (!token) {
        console.log('Skipping roles load - no token');
        return;
      }

      try {
        const response = await rolesApi.getAll();
        if (response.success && response.data) {
          setRoles(response.data as Role[]);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        // Используем роли по умолчанию, если не удалось загрузить
      }
    };

    loadCurrentUser();
    loadRoles();
  }, []);

  const login = async (username: string, password: string, authType: 'local' | 'sso') => {
    try {
      console.log('🔐 Attempting login for:', username, 'authType:', authType);
      
      const response: ApiResponse<LoginResponse> = await authApi.login({
        username,
        password,
        authType,
      });

      console.log('📥 Login response:', response);

      if (response.success && response.data) {
        console.log('✅ Login successful, saving tokens...');
        console.log('Token:', response.data.token ? response.data.token.substring(0, 20) + '...' : 'null');
        console.log('Refresh Token:', response.data.refreshToken ? 'present' : 'null');
        
        TokenManager.setToken(response.data.token);
        TokenManager.setRefreshToken(response.data.refreshToken);
        
        console.log('👤 Setting user:', response.data.user);
        setUser(response.data.user as User);
        
        // Проверяем что токен сохранился
        const savedToken = TokenManager.getToken();
        console.log('✔️ Token verification after save:', savedToken ? 'saved' : 'NOT SAVED!');
        
        // Загружаем роли после успешного логина
        try {
          const rolesResponse = await rolesApi.getAll();
          if (rolesResponse.success && rolesResponse.data) {
            setRoles(rolesResponse.data as Role[]);
          }
        } catch (error) {
          console.error('Failed to load roles after login:', error);
          // Не критично, используем роли по умолчанию
        }
      } else {
        throw new Error(response.error?.message || 'Ошибка авторизации');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Ошибка подключения к серверу');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
    }
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

  const addRole = async (roleData: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    try {
      const response = await rolesApi.create(roleData);
      if (response.success && response.data) {
        const newRole = response.data as Role;
        setRoles([...roles, newRole]);
        return newRole;
      } else {
        throw new Error(response.error?.message || 'Не удалось создать роль');
      }
    } catch (error: any) {
      console.error('Failed to add role:', error);
      throw error;
    }
  };

  const updateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      const response = await rolesApi.update(roleId as any, updates);
      if (response.success) {
        setRoles(roles.map(role => 
          role.id === roleId 
            ? { ...role, ...updates, updatedAt: new Date().toISOString() }
            : role
        ));
      } else {
        throw new Error(response.error?.message || 'Не удалось обновить роль');
      }
    } catch (error: any) {
      console.error('Failed to update role:', error);
      throw error;
    }
  };

  const deleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      throw new Error('Системные роли нельзя удалять');
    }
    
    try {
      const response = await rolesApi.delete(roleId as any);
      if (response.success) {
        setRoles(roles.filter(r => r.id !== roleId));
      } else {
        throw new Error(response.error?.message || 'Не удалось удалить роль');
      }
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      throw error;
    }
  };

  // Показываем загрузку при первой инициализации
  if (loading) {
    return null; // Или можно показать компонент загрузки
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        roles,
        loading,
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