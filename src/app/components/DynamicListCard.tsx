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
  WifiOff,
  Building,
  Home,
  MapPin,
  List,
} from 'lucide-react';
import { StatCard } from '../hooks/useMQTT';

interface DynamicListCardProps {
  card: StatCard;
}

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
  building: Building,
  home: Home,
  'map-pin': MapPin,
  list: List,
};

export function DynamicListCard({ card }: DynamicListCardProps) {
  const Icon = card.icon ? iconMap[card.icon.toLowerCase()] || List : List;
  const cardColor = card.color || '#00aeef';
  const rows = card.rows ?? [];

  return (
    <div
      className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all duration-300 border-l-4 relative overflow-hidden"
      style={{ borderLeftColor: cardColor }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-5 pointer-events-none">
        <Icon size={100} />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-sm font-semibold text-gray-700 leading-tight pr-2">
            {card.label}
          </div>
          <div className="bg-gray-50 p-2 rounded-lg flex-shrink-0">
            <Icon size={18} style={{ color: cardColor }} />
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.length === 0 ? (
            <div className="text-xs text-gray-400 italic">Нет данных</div>
          ) : (
            rows.map((row, idx) => {
              const rowValue =
                card.rowValues?.[row.valueTopic] ?? row.value ?? '...';
              const isLoaded =
                card.rowValues?.[row.valueTopic] !== undefined ||
                row.value !== undefined;

              return (
                <div
                  key={row.id ?? idx}
                  className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cardColor, opacity: 0.6 }}
                    />
                    <span className="text-xs text-gray-500 truncate">
                      {row.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-gray-900">
                      {rowValue}
                    </span>
                    {row.unit && (
                      <span className="text-xs text-gray-400">{row.unit}</span>
                    )}
                    {isLoaded ? (
                      <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                    ) : (
                      <XCircle className="w-3 h-3 text-gray-300 ml-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
