import { useAuth } from '../contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Shield } from 'lucide-react';

export function RoleSwitcher() {
  const { user, updateUser, roles } = useAuth();

  if (!user) return null;

  const handleRoleChange = (newRole: string) => {
    updateUser({
      ...user,
      role: newRole,
    });
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-900">
          Тестирование ролей
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-yellow-700">Текущая роль:</span>
        <Select value={user.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-64 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.displayName} {role.isSystem ? '' : '(кастомная)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-yellow-600 mt-2">
        Измените роль, чтобы увидеть, как меняется доступ к разделам в меню
      </p>
    </div>
  );
}