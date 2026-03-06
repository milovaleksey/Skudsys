import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CountryData {
  country: string;
  students_count: number;
}

interface DonutChartCardProps {
  title: string;
  data: CountryData[];
}

// Цветовая палитра для диаграммы
const COLORS = [
  '#00aeef', // Основной цвет ТюмГУ
  '#0088cc',
  '#006ba6',
  '#004e7a',
  '#7ec8e3',
  '#5ab9d8',
  '#36a9cd',
  '#1299c2',
  '#a7d8ec',
  '#92cfe7'
];

export function DonutChartCard({ title, data }: DonutChartCardProps) {
  // Если данных нет, показываем заглушку
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  // Подготавливаем данные для диаграммы
  const chartData = data.map(item => ({
    name: item.country,
    value: item.students_count
  }));

  // Вычисляем общее количество
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Кастомная метка для сегментов
  const renderCustomLabel = (entry: any) => {
    const percent = (entry.value / total) * 100;
    
    // Показываем метку только если процент >= 3%
    if (percent >= 3) {
      return `${entry.name} ${percent.toFixed(0)}%`;
    }
    
    // Для маленьких значений показываем только процент
    if (percent >= 1) {
      return `${percent.toFixed(0)}%`;
    }
    
    // Для очень маленьких не показываем ничего
    return '';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Диаграмма */}
        <div className="w-full lg:w-1/2 relative">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={1}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} студентов`, 'Количество']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Общее количество в центре */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-500">Всего</div>
          </div>
        </div>

        {/* Легенда */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {chartData.map((item, index) => {
              const percent = (item.value / total) * 100;
              return (
                <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}