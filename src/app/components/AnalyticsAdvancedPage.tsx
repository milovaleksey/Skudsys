import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Users, Building2, TrendingUp, TrendingDown, Clock,
  Activity, Zap, MapPin, RefreshCw, ChevronDown,
  AlertTriangle, Construction, ArrowUp, ArrowDown,
  Flame, BarChart3
} from 'lucide-react';
import { analyticsApi } from '../lib/api';
import { toast } from 'sonner';

// ─── типы ────────────────────────────────────────────────────────────────────

type PeriodPreset = 'today' | 'week' | 'month' | 'semester' | 'year' | 'custom';
type CategoryFilter = 'all' | 'students' | 'teachers' | 'employees';

interface Filters {
  period: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  category: CategoryFilter;
}

interface StatRow { date: string; count: number }
interface HourRow { date: number; count: number }
interface DayRow  { day: string; dayIndex: number; count: number }
interface LocationRow { name: string; count: number; percentage: number }

interface Statistics {
  totalPasses: number;
  uniquePeople: number;
  uniqueLocations: number;
  avgDailyPasses: number;
  peakHour?: number;
  peakDay?: string;
}

// ─── вспомогательные ─────────────────────────────────────────────────────────

const BRAND  = '#00aeef';
const COLORS = ['#00aeef','#0097d1','#0080b3','#006a96','#005378','#003d5a','#00c4f0','#33ceef'];

const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WEEKDAYS_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

function getPeriodDates(period: PeriodPreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case 'today':
      return { dateFrom: fmt(today), dateTo: fmt(today) };
    case 'week': {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { dateFrom: fmt(from), dateTo: fmt(today) };
    }
    case 'month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: fmt(from), dateTo: fmt(today) };
    }
    case 'semester': {
      const month = today.getMonth();
      const fromMonth = month < 6 ? 1 : 8; // февраль или август
      const from = new Date(today.getFullYear(), fromMonth, 1);
      return { dateFrom: fmt(from), dateTo: fmt(today) };
    }
    case 'year': {
      const from = new Date(today.getFullYear(), 8, 1); // 1 сентября
      const fromDate = from > today
        ? new Date(today.getFullYear() - 1, 8, 1)
        : from;
      return { dateFrom: fmt(fromDate), dateTo: fmt(today) };
    }
    default:
      return { dateFrom: fmt(today), dateTo: fmt(today) };
  }
}

function pluralDays(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'дня';
  return 'дней';
}

function formatNumber(n: number) {
  return n.toLocaleString('ru-RU');
}

// ─── тепловая карта (час × день недели) ──────────────────────────────────────

function buildHeatmap(hourData: HourRow[], dayData: DayRow[]) {
  // Нормализуем часовые веса
  const totalH = hourData.reduce((s, r) => s + r.count, 0) || 1;
  const hourWeight: Record<number, number> = {};
  hourData.forEach(r => { hourWeight[r.date] = r.count / totalH; });

  // Нормализуем дневные веса
  const totalD = dayData.reduce((s, r) => s + r.count, 0) || 1;
  const dayWeight: Record<string, number> = {};
  dayData.forEach(r => { dayWeight[r.day] = r.count / totalD; });

  // Строим матрицу 24 × 7
  const matrix: { hour: number; day: string; value: number }[] = [];
  const dayOrder = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  for (let h = 6; h <= 22; h++) {
    dayOrder.forEach(d => {
      const hw = hourWeight[h] ?? 0;
      const dw = dayWeight[d] ?? 0;
      matrix.push({ hour: h, day: d, value: Math.round(hw * dw * 10000) });
    });
  }

  const maxVal = Math.max(...matrix.map(m => m.value), 1);
  return matrix.map(m => ({ ...m, intensity: m.value / maxVal }));
}

function heatColor(intensity: number) {
  if (intensity === 0) return '#f3f4f6';
  if (intensity < 0.2) return '#dbeafe';
  if (intensity < 0.4) return '#93c5fd';
  if (intensity < 0.6) return '#3b82f6';
  if (intensity < 0.8) return '#1d4ed8';
  return '#1e3a8a';
}

// ─── компонент KPI-карточки ───────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, trend, color = BRAND,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: 'up' | 'down' | null; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-3 -mr-3 opacity-5">
        <Icon size={90} />
      </div>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
          <div className="rounded-lg p-2 bg-gray-50">
            <Icon size={16} style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {sub && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {trend === 'up' && <ArrowUp size={12} className="text-green-500" />}
            {trend === 'down' && <TrendingDown size={12} className="text-red-400" />}
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── «В разработке» плейсхолдер ──────────────────────────────────────────────

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center gap-3">
      <Construction size={32} className="text-gray-300" />
      <div>
        <div className="font-semibold text-gray-500">{title}</div>
        <div className="text-xs text-gray-400 mt-1 max-w-xs">{description}</div>
      </div>
      <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
        В разработке
      </span>
    </div>
  );
}

// ─── заголовок блока ─────────────────────────────────────────────────────────

function BlockHeader({ icon: Icon, title, subtitle, badge }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string; subtitle?: string; badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="rounded-xl p-2.5 flex-shrink-0" style={{ backgroundColor: `${BRAND}18` }}>
        <Icon size={20} style={{ color: BRAND }} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── кастомный тултип ────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name || 'Проходы'}:</span>
          <span className="font-bold text-gray-900">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── ГЛАВНЫЙ КОМПОНЕНТ ────────────────────────────────────────────────────────

export function AnalyticsAdvancedPage() {
  const [filters, setFilters] = useState<Filters>(() => {
    const { dateFrom, dateTo } = getPeriodDates('week');
    return { period: 'week', dateFrom, dateTo, category: 'all' };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Данные
  const [statistics, setStatistics]   = useState<Statistics | null>(null);
  const [timeSeries, setTimeSeries]   = useState<StatRow[]>([]);
  const [hourly, setHourly]           = useState<HourRow[]>([]);
  const [weekday, setWeekday]         = useState<DayRow[]>([]);
  const [topLocations, setTopLocations] = useState<LocationRow[]>([]);
  const [comparison, setComparison]   = useState<{ data: any[]; locations: string[] }>({ data: [], locations: [] });

  // ─── загрузка данных ────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const { dateFrom, dateTo } = filters;

      const [statsRes, tsRes, hrRes, wdRes, topRes, cmpRes] = await Promise.allSettled([
        analyticsApi.getStatistics(dateFrom, dateTo),
        analyticsApi.getTimeSeries(dateFrom, dateTo),
        analyticsApi.getHourly(dateFrom, dateTo),
        analyticsApi.getWeekdayPattern(dateFrom, dateTo),
        analyticsApi.getTopLocations(dateFrom, dateTo, 10),
        analyticsApi.getLocationsComparison(dateFrom, dateTo, 5),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        const s = statsRes.value.data;
        const hr: HourRow[] = hrRes.status === 'fulfilled' && hrRes.value.success
          ? hrRes.value.data : [];
        const peakHour = hr.length
          ? hr.reduce((a, b) => a.count > b.count ? a : b).date
          : undefined;
        const wd: DayRow[] = wdRes.status === 'fulfilled' && wdRes.value.success
          ? wdRes.value.data : [];
        const peakDay = wd.length
          ? wd.reduce((a, b) => a.count > b.count ? a : b).day
          : undefined;

        setStatistics({
          totalPasses: s.totalPasses ?? 0,
          uniquePeople: s.uniquePeople ?? 0,
          uniqueLocations: s.uniqueLocations ?? 0,
          avgDailyPasses: s.avgDailyPasses ?? 0,
          peakHour,
          peakDay,
        });
        setHourly(hr);
        setWeekday(wd);
      }

      if (tsRes.status === 'fulfilled' && tsRes.value.success) {
        setTimeSeries(tsRes.value.data ?? []);
      }

      if (topRes.status === 'fulfilled' && topRes.value.success) {
        setTopLocations(topRes.value.data ?? []);
      }

      if (cmpRes.status === 'fulfilled' && cmpRes.value.success) {
        setComparison({
          data: cmpRes.value.data ?? [],
          locations: cmpRes.value.locations ?? [],
        });
      }

      setLastUpdated(new Date());
    } catch (e) {
      toast.error('Ошибка загрузки данных аналитики');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── тепловая карта ─────────────────────────────────────────────────────────

  const heatmap = useMemo(() => buildHeatmap(hourly, weekday), [hourly, weekday]);

  // ─── пиковый час для отображения ────────────────────────────────────────────

  const peakHourLabel = statistics?.peakHour !== undefined
    ? `${statistics.peakHour}:00–${statistics.peakHour + 1}:00`
    : '—';

  // ─── смена периода ───────────────────────────────────────────────────────────

  const setPeriod = (p: PeriodPreset) => {
    if (p === 'custom') {
      setFilters(f => ({ ...f, period: 'custom' }));
      return;
    }
    const { dateFrom, dateTo } = getPeriodDates(p);
    setFilters(f => ({ ...f, period: p, dateFrom, dateTo }));
  };

  // ─── сколько дней в периоде ──────────────────────────────────────────────────

  const periodDays = useMemo(() => {
    const ms = new Date(filters.dateTo).getTime() - new Date(filters.dateFrom).getTime();
    return Math.round(ms / 86400000) + 1;
  }, [filters.dateFrom, filters.dateTo]);

  const PERIOD_LABELS: Record<PeriodPreset, string> = {
    today: 'Сегодня', week: 'Неделя', month: 'Месяц',
    semester: 'Семестр', year: 'Учебный год', custom: 'Период',
  };

  const CATEGORY_LABELS: Record<CategoryFilter, string> = {
    all: 'Все', students: 'Студенты', teachers: 'Преподаватели', employees: 'Сотрудники',
  };

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Аналитика посещаемости</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Данные СКУД · {lastUpdated
              ? `обновлено в ${lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
              : 'загрузка...'}
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* ── Панель фильтров ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Период */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Период
            </label>
            <div className="flex gap-1 flex-wrap">
              {(['today','week','month','semester','year'] as PeriodPreset[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.period === p ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={filters.period === p ? { backgroundColor: BRAND } : {}}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Дата от/до (custom) */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">С</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, period: 'custom', dateFrom: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">По</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, period: 'custom', dateTo: e.target.value }))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Категория
            </label>
            <div className="flex gap-1">
              {(['all','students','teachers','employees'] as CategoryFilter[]).map(c => (
                <button
                  key={c}
                  onClick={() => setFilters(f => ({ ...f, category: c }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.category === c ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={filters.category === c ? { backgroundColor: BRAND } : {}}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Инфо об периоде */}
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-400">Выбрано</div>
            <div className="text-sm font-semibold text-gray-700">
              {filters.dateFrom === filters.dateTo
                ? new Date(filters.dateFrom).toLocaleDateString('ru-RU')
                : `${new Date(filters.dateFrom).toLocaleDateString('ru-RU')} — ${new Date(filters.dateTo).toLocaleDateString('ru-RU')}`}
            </div>
            <div className="text-xs text-gray-400">{periodDays} {pluralDays(periodDays)}</div>
          </div>
        </div>
      </div>

      {/* ══ БЛОК 1: Текущая загруженность ═══════════════════════════════════ */}
      <section>
        <BlockHeader
          icon={Zap}
          title="Блок 1 — Текущая загруженность"
          subtitle="Показатели за выбранный период на основе данных СКУД"
          badge={isLoading ? 'загрузка...' : `${PERIOD_LABELS[filters.period]}`}
        />

        {/* KPI карточки */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <KpiCard
            label="Проходов" icon={Activity}
            value={statistics?.totalPasses ?? '—'}
            sub="за период"
          />
          <KpiCard
            label="Уникальных людей" icon={Users}
            value={statistics?.uniquePeople ?? '—'}
            sub="прошли через СКУД"
          />
          <KpiCard
            label="Точек контроля" icon={MapPin}
            value={statistics?.uniqueLocations ?? '—'}
            sub="активных за период"
          />
          <KpiCard
            label="Среднее в день" icon={BarChart3}
            value={statistics?.avgDailyPasses ?? '—'}
            sub="проходов"
          />
          <KpiCard
            label="Пик нагрузки" icon={Flame}
            value={peakHourLabel}
            sub={`в ${statistics?.peakDay ?? '—'}`}
          />
          <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-center">
            <Construction size={20} className="text-gray-300 mb-1" />
            <div className="text-xs text-gray-400 font-medium">Сейчас внутри</div>
            <div className="text-xs text-amber-500 mt-1">Требует доп. API</div>
          </div>
        </div>

        {/* Динамика по дням */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Динамика потока за период</div>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke={BRAND} fill="url(#gradTs)" strokeWidth={2} name="Проходов" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {isLoading ? 'Загрузка...' : 'Нет данных за период'}
            </div>
          )}
        </div>
      </section>

      {/* ══ БЛОК 2: Историческая загруженность ══════════════════════════════ */}
      <section>
        <BlockHeader
          icon={Flame}
          title="Блок 2 — Историческая загруженность и пики"
          subtitle="Тепловая карта час × день недели и распределение по часам"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Тепловая карта */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Тепловая карта «Час пик»</div>
            <div className="text-xs text-gray-400 mb-4">Интенсивность потока: час × день недели</div>

            {heatmap.length > 0 ? (
              <div>
                {/* Заголовки дней */}
                <div className="flex items-center mb-1 ml-10">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="flex-1 text-center text-xs font-medium text-gray-500">{d}</div>
                  ))}
                </div>
                {/* Строки по часам */}
                {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => (
                  <div key={hour} className="flex items-center mb-0.5">
                    <div className="w-10 text-right pr-2 text-xs text-gray-400 flex-shrink-0">
                      {hour}:00
                    </div>
                    {WEEKDAYS.map(day => {
                      const cell = heatmap.find(h => h.hour === hour && h.day === day);
                      const intensity = cell?.intensity ?? 0;
                      return (
                        <div
                          key={day}
                          className="flex-1 mx-0.5 rounded-sm transition-colors"
                          style={{ height: 18, backgroundColor: heatColor(intensity) }}
                          title={`${WEEKDAYS_FULL[WEEKDAYS.indexOf(day)]} ${hour}:00 — интенсивность ${Math.round(intensity * 100)}%`}
                        />
                      );
                    })}
                  </div>
                ))}
                {/* Легенда */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span>Низкая</span>
                  {['#f3f4f6','#dbeafe','#93c5fd','#3b82f6','#1d4ed8','#1e3a8a'].map(c => (
                    <div key={c} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                  <span>Высокая</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                {isLoading ? 'Загрузка...' : 'Нет данных'}
              </div>
            )}
          </div>

          {/* Распределение по часам */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-1">Распределение по часам</div>
            <div className="text-xs text-gray-400 mb-4">Суммарно за выбранный период</div>
            {hourly.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hourly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={v => `${v}h`} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={v => `${v}:00`} />
                  <Bar dataKey="count" name="Проходов" radius={[3, 3, 0, 0]}>
                    {hourly.map((entry, i) => (
                      <Cell key={i} fill={entry.date === statistics?.peakHour ? '#f59e0b' : BRAND} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                {isLoading ? 'Загрузка...' : 'Нет данных'}
              </div>
            )}
            {statistics?.peakHour !== undefined && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                <Flame size={12} />
                Пик: {peakHourLabel} — выделен жёлтым
              </div>
            )}
          </div>

          {/* Паттерн по дням недели */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <div className="text-sm font-semibold text-gray-700 mb-1">Паттерн по дням недели</div>
            <div className="text-xs text-gray-400 mb-4">Суммарная активность за выбранный период</div>
            {weekday.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[...weekday].sort((a, b) => a.dayIndex - b.dayIndex)}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Проходов" radius={[4, 4, 0, 0]}>
                    {[...weekday].sort((a, b) => a.dayIndex - b.dayIndex).map((entry, i) => (
                      <Cell key={i} fill={entry.day === statistics?.peakDay ? '#f59e0b' : COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                {isLoading ? 'Загрузка...' : 'Нет данных'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ БЛОК 3: Сравнительный анализ ════════════════════════════════════ */}
      <section>
        <BlockHeader
          icon={Building2}
          title="Блок 3 — Сравнительный анализ"
          subtitle="Рейтинг точек прохода и сравнение активности"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Топ локаций */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-1">Рейтинг точек прохода</div>
            <div className="text-xs text-gray-400 mb-4">Топ-10 по количеству проходов</div>
            {topLocations.length > 0 ? (
              <div className="space-y-2">
                {topLocations.slice(0, 10).map((loc, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ backgroundColor: i < 3 ? BRAND : '#9ca3af' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{loc.name}</div>
                      <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${loc.percentage}%`,
                            backgroundColor: i < 3 ? BRAND : '#9ca3af',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-gray-800">{formatNumber(loc.count)}</div>
                      <div className="text-xs text-gray-400">{loc.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                {isLoading ? 'Загрузка...' : 'Нет данных'}
              </div>
            )}
          </div>

          {/* Сравнение локаций по дням */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-1">Сравнение точек прохода</div>
            <div className="text-xs text-gray-400 mb-4">Топ-5 по дням</div>
            {comparison.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={comparison.data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => String(v).slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {comparison.locations.map((loc, i) => (
                    <Line
                      key={loc}
                      type="monotone"
                      dataKey={loc}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      name={loc.length > 25 ? loc.slice(0, 25) + '…' : loc}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                {isLoading ? 'Загрузка...' : 'Нет данных'}
              </div>
            )}
          </div>

          {/* Маятниковая миграция — coming soon */}
          <ComingSoon
            title="Анализ маятниковой миграции"
            description="Перемещение студентов между корпусами в течение учебного дня. Требует привязки точек прохода к корпусам."
          />

          {/* Продолжительность нахождения — coming soon */}
          <ComingSoon
            title="Продолжительность нахождения"
            description="Среднее время пребывания внутри корпуса за день. Требует парной обработки событий вход/выход."
          />
        </div>
      </section>

      {/* ══ БЛОК 4: Предиктивная аналитика ═════════════════════════════════ */}
      <section>
        <BlockHeader
          icon={TrendingUp}
          title="Блок 4 — Предиктивная аналитика"
          subtitle="Прогнозы и обнаружение аномалий (в разработке)"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComingSoon
            title="Прогноз на основе расписания"
            description="Интеграция с системой Модус для визуализации ожидаемой нагрузки на следующую неделю."
          />
          <ComingSoon
            title="Индикатор заполняемости"
            description="Процент текущего числа людей от максимальной вместимости корпуса. Ожидаем данные по имущественным комплексам."
          />
          <ComingSoon
            title="Обнаружение аномалий"
            description="Автоматические уведомления о неожиданных всплесках активности: массовые мероприятия, эвакуации и пр."
          />
        </div>
      </section>

    </div>
  );
}
