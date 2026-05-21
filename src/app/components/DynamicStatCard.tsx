import { 
  Users, 
  Briefcase, 
  Car, 
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import { StatCard } from '../lib/mqtt';

interface DynamicStatCardProps {
  card: StatCard;
  value: string | undefined;
}

// Маппинг иконок из строки в компонент
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  users: Users,
  briefcase: Briefcase,
  car: Car,
  activity: Activity,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  clock: Clock,
  database: Database,
  server: Server,
  wifi: Wifi,
  'wifi-off': WifiOff,
};

export function DynamicStatCard({ card, value }: DynamicStatCardProps) {
  const Icon = card.icon ? iconMap[card.icon.toLowerCase()] || Activity : Activity;
  const displayValue = value !== undefined ? value : '...';
  const cardColor = card.color || '#00aeef';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-l-4 relative overflow-hidden"
         style={{ borderLeftColor: cardColor }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-5">
        <Icon size={120} />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="text-sm font-medium text-gray-600">
            {card.label}
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <Icon size={20} style={{ color: cardColor }} />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900">
            {displayValue}
          </div>
          {card.unit && (
            <span className="text-sm text-gray-500 font-medium">
              {card.unit}
            </span>
          )}
        </div>

        {/* Индикатор статуса данных */}
        <div className="flex items-center gap-1 mt-3">
          {value !== undefined ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}