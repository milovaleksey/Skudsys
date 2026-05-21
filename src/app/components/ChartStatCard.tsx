import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartStatCardProps {
  label: string;
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  description?: string;
}

const DEFAULT_COLORS = [
  '#00aeef', // Фирменный цвет ТюмГУ
  '#0088cc',
  '#0066aa',
  '#004488',
  '#66ccff',
  '#3399cc',
  '#0099dd',
  '#005577',
];

export function ChartStatCard({ label, data, colors = DEFAULT_COLORS, description }: ChartStatCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border-l-4"
         style={{ borderLeftColor: '#00aeef' }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Студентов']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Всего студентов:</span>
          <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
