import { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Save,
  X,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
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
import { toast } from 'sonner';
import { useAuth, Role, ALL_PERMISSIONS } from '../contexts/AuthContext';
import { ScrollArea } from './ui/scroll-area';

export function RolesManagementPage() {
  const { roles, addRole, updateRole, deleteRole } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
  });

  // Группировка прав по категориям
  const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  // Сброс формы
  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      permissions: [],
    });
  };

  // Открытие диалога создания
  const handleAddRole = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Открытие диалога редактирования
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: [...role.permissions],
    });
    setIsEditDialogOpen(true);
  };

  // Сохранение новой роли
  const handleSaveNewRole = () => {
    // Валидация
    if (!formData.name || !formData.displayName) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Выберите хотя бы одно право доступа');
      return;
    }

    // Проверка уникальности имени
    if (roles.some(r => r.name === formData.name)) {
      toast.error('Роль с таким именем уже существует');
      return;
    }

    try {
      addRole({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        permissions: formData.permissions,
        isSystem: false,
      });
      setIsAddDialogOpen(false);
      toast.success('Роль успешно создана');
      resetForm();
    } catch (error) {
      toast.error('Ошибка при создании роли');
    }
  };

  // Сохранение изменений роли
  const handleSaveEditRole = () => {
    if (!selectedRole) return;

    // Валидация
    if (!formData.displayName) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Выберите хотя бы одно право доступа');
      return;
    }

    try {
      updateRole(selectedRole.id, {
        displayName: formData.displayName,
        description: formData.description,
        permissions: formData.permissions,
      });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      toast.success('Изменения сохранены');
      resetForm();
    } catch (error) {
      toast.error('Ошибка при сохранении роли');
    }
  };

  // Удаление роли
  const handleDeleteRole = () => {
    if (!selectedRole) return;

    try {
      deleteRole(selectedRole.id);
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      toast.success('Роль удалена');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при удалении роли');
    }
  };

  // Переключение права доступа
  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  // Выбрать все права в категории
  const toggleCategoryPermissions = (category: string) => {
    const categoryPerms = permissionsByCategory[category].map(p => p.id);
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Убрать все права категории
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPerms.includes(p))
      }));
    } else {
      // Добавить все права категории
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPerms])]
      }));
    }
  };

  // Получение badge для типа роли
  const getRoleTypeBadge = (role: Role) => {
    if (role.isSystem) {
      return (
        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
          <Lock className="w-3 h-3 mr-1" />
          Системная
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
        Кастомная
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление ролями</h2>
          <p className="text-gray-600 mt-1">
            Создание и редактирование ролей с настройкой прав доступа
          </p>
        </div>
        <Button onClick={handleAddRole} className="bg-[#00aeef] hover:bg-[#008ac4]">
          <Plus className="w-4 h-4 mr-2" />
          Создать роль
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Всего ролей</div>
          <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Системных</div>
          <div className="text-2xl font-bold text-blue-600">
            {roles.filter(r => r.isSystem).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Кастомных</div>
          <div className="text-2xl font-bold text-green-600">
            {roles.filter(r => !r.isSystem).length}
          </div>
        </div>
      </div>

      {/* Список ролей */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#00aeef]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#00aeef]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role.displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleTypeBadge(role)}
                    <span className="text-sm text-gray-500">
                      ID: {role.name}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditRole(role)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {role.description}
            </p>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Права доступа ({role.permissions.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 5).map((permId) => {
                  const perm = ALL_PERMISSIONS.find(p => p.id === permId);
                  return perm ? (
                    <Badge key={permId} variant="outline" className="text-xs">
                      {perm.name}
                    </Badge>
                  ) : null;
                })}
                {role.permissions.length > 5 && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    +{role.permissions.length - 5} еще
                  </Badge>
                )}
              </div>
            </div>

            {role.updatedAt && (
              <div className="mt-3 text-xs text-gray-500">
                Обновлено: {new Date(role.updatedAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Диалог создания роли */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00aeef]" />
              Создать новую роль
            </DialogTitle>
            <DialogDescription>
              Укажите название роли и выберите права доступа
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Системное имя роли * 
                  <span className="text-xs text-gray-500 ml-2">(латиница, без пробелов)</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="custom_role_name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Отображаемое название *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Моя кастомная роль"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание роли и её предназначения"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Права доступа *</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Выбрано прав: {formData.permissions.length} из {ALL_PERMISSIONS.length}
                </div>

                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const categoryPerms = perms.map(p => p.id);
                  const allSelected = categoryPerms.every(p => formData.permissions.includes(p));
                  const someSelected = categoryPerms.some(p => formData.permissions.includes(p));

                  return (
                    <div key={category} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => toggleCategoryPermissions(category)}
                          />
                          <Label className="font-medium cursor-pointer" onClick={() => toggleCategoryPermissions(category)}>
                            {category}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {categoryPerms.filter(p => formData.permissions.includes(p)).length} / {categoryPerms.length}
                        </Badge>
                      </div>

                      <div className="space-y-2 ml-6">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.permissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                              id={`perm-${perm.id}`}
                            />
                            <Label 
                              htmlFor={`perm-${perm.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {perm.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveNewRole} className="bg-[#00aeef] hover:bg-[#008ac4]">
              <Save className="w-4 h-4 mr-2" />
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования роли */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-[#00aeef]" />
              Редактировать роль
            </DialogTitle>
            <DialogDescription>
              Изменение роли: {selectedRole?.displayName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              {selectedRole?.isSystem && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Системная роль</strong> - вы можете изменить только права доступа. 
                    Название и системное имя изменить нельзя.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Системное имя роли</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Отображаемое название *</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  disabled={selectedRole?.isSystem}
                  className={selectedRole?.isSystem ? 'bg-gray-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Права доступа *</Label>
                <div className="text-sm text-gray-500 mb-2">
                  Выбрано прав: {formData.permissions.length} из {ALL_PERMISSIONS.length}
                </div>

                {Object.entries(permissionsByCategory).map(([category, perms]) => {
                  const categoryPerms = perms.map(p => p.id);
                  const allSelected = categoryPerms.every(p => formData.permissions.includes(p));

                  return (
                    <div key={category} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => toggleCategoryPermissions(category)}
                          />
                          <Label className="font-medium cursor-pointer" onClick={() => toggleCategoryPermissions(category)}>
                            {category}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {categoryPerms.filter(p => formData.permissions.includes(p)).length} / {categoryPerms.length}
                        </Badge>
                      </div>

                      <div className="space-y-2 ml-6">
                        {perms.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.permissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                              id={`edit-perm-${perm.id}`}
                            />
                            <Label 
                              htmlFor={`edit-perm-${perm.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {perm.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleSaveEditRole} className="bg-[#00aeef] hover:bg-[#008ac4]">
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
            <AlertDialogTitle>Удалить роль?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить роль <strong>{selectedRole?.displayName}</strong>?
              Это действие нельзя отменить.
              {selectedRole?.isSystem && (
                <div className="mt-2 text-red-600">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Системную роль нельзя удалить!
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-red-600 hover:bg-red-700"
              disabled={selectedRole?.isSystem}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}