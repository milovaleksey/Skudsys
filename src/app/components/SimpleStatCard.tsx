import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SimpleStatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  unit?: string;
}

export function SimpleStatCard({ title, value, icon = 'activity', unit = '' }: SimpleStatCardProps) {
  // Получаем иконку динамически
  const IconComponent = (Icons[icon as keyof typeof Icons] as LucideIcon) || Icons.Activity;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">
            {value}
            {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-[#00aeef]/10 rounded-lg flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-[#00aeef]" />
          </div>
        </div>
      </div>
    </div>
  );
}
