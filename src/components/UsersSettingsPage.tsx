import { useState } from 'react';
import { toast } from 'sonner';
import { User, useAuth } from '../contexts/AuthContext';
import { RolesManagementPage } from './RolesManagementPage';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  Save, 
  X, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff,
  UserCog
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// Define UserRole type
type UserRole = 'admin' | 'security' | 'manager' | 'operator' | 'viewer';

// Mock данные пользователей
const initialUsers: User[] = [
  {
    id: 1,
    username: 'admin_security',
    fullName: 'Иванов Иван Иванович',
    email: 'ivanov@utmn.ru',
    role: 'admin',
    authType: 'local',
    createdAt: '2025-01-15T10:30:00Z',
    lastLogin: '2026-01-19T08:15:00Z',
    isActive: true,
  },
  {
    id: 2,
    username: 'petrova@utmn.ru',
    fullName: 'Петрова Мария Сергеевна',
    email: 'petrova@utmn.ru',
    role: 'security',
    authType: 'sso',
    createdAt: '2025-02-10T14:20:00Z',
    lastLogin: '2026-01-19T09:30:00Z',
    isActive: true,
  },
  {
    id: 3,
    username: 'sidorov',
    fullName: 'Сидоров Петр Алексеевич',
    email: 'sidorov@utmn.ru',
    role: 'manager',
    authType: 'local',
    createdAt: '2025-03-05T11:45:00Z',
    lastLogin: '2026-01-18T16:20:00Z',
    isActive: true,
  },
  {
    id: 4,
    username: 'kuznetsova@utmn.ru',
    fullName: 'Кузнецова Елена Викторовна',
    email: 'kuznetsova@utmn.ru',
    role: 'operator',
    authType: 'sso',
    createdAt: '2025-04-12T09:15:00Z',
    lastLogin: '2026-01-19T07:45:00Z',
    isActive: true,
  },
  {
    id: 5,
    username: 'viewer_user',
    fullName: 'Смирнов Андрей Николаевич',
    email: 'smirnov@utmn.ru',
    role: 'viewer',
    authType: 'local',
    createdAt: '2025-05-20T13:30:00Z',
    lastLogin: '2026-01-17T12:10:00Z',
    isActive: false,
  },
];

interface UserFormData {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  authType: 'local' | 'sso';
  isActive: boolean;
}

export function UsersSettingsPage() {
  const { roles } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAuthType, setFilterAuthType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'viewer',
    authType: 'local',
    isActive: true,
  });

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesAuthType = filterAuthType === 'all' || user.authType === filterAuthType;
    
    return matchesSearch && matchesRole && matchesAuthType;
  });

  // Открытие диалога добавления
  const handleAddUser = () => {
    setFormData({
      username: '',
      fullName: '',
      email: '',
      password: '',
      role: 'viewer',
      authType: 'local',
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  // Открытие диалога редактирования
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      authType: user.authType,
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Сохранение нового пользователя
  const handleSaveNewUser = () => {
    if (!formData.username || !formData.fullName || !formData.email) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (formData.authType === 'local' && !formData.password) {
      toast.error('Для локального пользователя требуется пароль');
      return;
    }

    const newUser: User = {
      id: Math.max(...users.map(u => u.id)) + 1,
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      authType: formData.authType,
      createdAt: new Date().toISOString(),
      isActive: formData.isActive,
    };

    setUsers([...users, newUser]);
    setIsAddDialogOpen(false);
    toast.success('Пользователь успешно добавлен');
  };

  // Сохранение изменений пользователя
  const handleSaveEditUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(user => 
      user.id === selectedUser.id
        ? {
            ...user,
            username: formData.username,
            fullName: formData.fullName,
            email: formData.email,
            role: formData.role,
            authType: formData.authType,
            isActive: formData.isActive,
          }
        : user
    );

    setUsers(updatedUsers);
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    toast.success('Изменения сохранены');
  };

  // Удаление пользователя
  const handleDeleteUser = () => {
    if (!selectedUser) return;

    setUsers(users.filter(user => user.id !== selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
    toast.success('Пользователь удален');
  };

  // Переключение статуса активности
  const toggleUserStatus = (userId: number) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    toast.success('Статус пользователя изменен');
  };

  // Получение badge для роли
  const getRoleBadge = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      security: 'bg-blue-100 text-blue-800 border-blue-200',
      manager: 'bg-purple-100 text-purple-800 border-purple-200',
      operator: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const labels = {
      admin: 'Администратор',
      security: 'Безопасность',
      manager: 'Менеджер',
      operator: 'Оператор',
      viewer: 'Наблюдатель',
    };

    return (
      <Badge className={`${colors[role]} border`}>
        {labels[role]}
      </Badge>
    );
  };

  // Получение badge для типа авторизации
  const getAuthTypeBadge = (authType: 'local' | 'sso') => {
    return authType === 'local' ? (
      <Badge variant="outline" className="border-gray-300">
        <Lock className="w-3 h-3 mr-1" />
        Локальный
      </Badge>
    ) : (
      <Badge variant="outline" className="border-[#00aeef]">
        <Shield className="w-3 h-3 mr-1" />
        SSO UTMN
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Управление пользователями
        </h1>
        <p className="text-gray-600">
          Настройка пользователей и управление ролями системы безопасности
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">
            <UserCog className="w-4 h-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Роли и права
          </TabsTrigger>
        </TabsList>

        {/* Вкладка пользователей */}
        <TabsContent value="users" className="space-y-6">
          {/* Фильтры и поиск */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Поиск по имени, логину или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="security">Безопасность</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="viewer">Наблюдатель</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAuthType} onValueChange={setFilterAuthType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Тип авторизации" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="local">Локальные</SelectItem>
                  <SelectItem value="sso">SSO UTMN</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddUser} className="bg-[#00aeef] hover:bg-[#008ac4]">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Всего пользователей</div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Активных</div>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Локальных</div>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.authType === 'local').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">SSO</div>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.authType === 'sso').length}
              </div>
            </div>
          </div>

          {/* Таблица пользователей */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Авторизация
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последний вход
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAuthTypeBadge(user.authType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Пользователи не найдены</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Вкладка ролей и прав */}
        <TabsContent value="roles" className="space-y-6">
          <RolesManagementPage />
        </TabsContent>
      </Tabs>

      {/* Диалог добавления пользователя */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#00aeef]" />
              Добавить пользователя
            </DialogTitle>
            <DialogDescription>
              Создайте нового пользователя в системе
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username или email@utmn.ru"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">ФИО *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivanov@utmn.ru"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authType">Тип авторизации *</Label>
              <Select 
                value={formData.authType} 
                onValueChange={(value: 'local' | 'sso') => setFormData({ ...formData, authType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Локальная авторизация
                    </div>
                  </SelectItem>
                  <SelectItem value="sso">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      SSO UTMN
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.authType === 'local' && (
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Введите пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Роль *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roles.find(r => r.name === formData.role) && (
                <p className="text-xs text-gray-500">
                  {roles.find(r => r.name === formData.role)?.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Активный пользователь</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveNewUser} className="bg-[#00aeef] hover:bg-[#008ac4]">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования пользователя */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#00aeef]" />
              Редактировать пользователя
            </DialogTitle>
            <DialogDescription>
              Изменение данных пользователя {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Логин *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fullName">ФИО *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-authType">Тип авторизации *</Label>
              <Select 
                value={formData.authType} 
                onValueChange={(value: 'local' | 'sso') => setFormData({ ...formData, authType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Локальная авторизация
                    </div>
                  </SelectItem>
                  <SelectItem value="sso">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      SSO UTMN
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.authType === 'local' && (
              <div className="space-y-2">
                <Label htmlFor="edit-password">Новый пароль (оставьте пустым, чтобы не менять)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Введите новый пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-role">Роль *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roles.find(r => r.name === formData.role) && (
                <p className="text-xs text-gray-500">
                  {roles.find(r => r.name === formData.role)?.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Активный пользователь</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveEditUser} className="bg-[#00aeef] hover:bg-[#008ac4]">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить пользователя <strong>{selectedUser?.fullName}</strong>?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}