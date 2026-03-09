import { useState } from 'react';
import { 
  Search, 
  Calendar, 
  UserX, 
  Download,
  CheckCircle,
  XCircle,
  Globe,
  FileSpreadsheet
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css';
import * as XLSX from 'xlsx';
import { Card } from './ui/card';
import { SimpleStatCard } from './SimpleStatCard';
import { DonutChartCard } from './DonutChartCard';
import { useForeignStudentsMQTT } from '../hooks/useForeignStudentsMQTT';
import { skudApi } from '../lib/api';
import { toast } from 'sonner';
import { LoadingCatWidget } from './LoadingCatWidget';

registerLocale('ru', ru);

type ReportTemplate = 'search' | 'missing';

interface SearchFormData {
  searchType: 'fio' | 'upn';
  searchValue: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  timeFrom: string;
  timeTo: string;
}

interface MissingFormData {
  country: string;
  daysThreshold: number;
}

type DaysFilter = 'all' | 'undefined' | 'up10' | 'up30' | 'up100' | 'over100';

interface PassRecord {
  id: number;
  time: string;
  fullName: string;
  upn: string | null;
  cardNumber: string | null;
  checkpoint: string;
  deviceName?: string | null;
  country?: string | null;
  eventName?: string | null;
  direction?: string | null;
  building?: string | null;
  daysMissing?: number;
}

export function ForeignStudentsReport() {
  const { statCards, cardValues, countryStats, isConnected } = useForeignStudentsMQTT();
  
  // Установка сегодняшней даты по умолчанию
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplate>('search');
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    searchType: 'fio',
    searchValue: '',
    dateFrom: todayStart,
    dateTo: todayEnd,
    timeFrom: '00:00',
    timeTo: '23:59'
  });
  const [missingForm, setMissingForm] = useState<MissingFormData>({
    country: 'all',
    daysThreshold: 3
  });
  
  const [searchResults, setSearchResults] = useState<PassRecord[]>([]);
  const [missingResults, setMissingResults] = useState<PassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [daysFilter, setDaysFilter] = useState<DaysFilter>('all');

  // Функция форматирования даты
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '—';
    
    try {
      const date = new Date(dateString);
      
      // Проверка на невалидную дату
      if (isNaN(date.getTime())) return '—';
      
      // Форматируем дату: ДД.ММ.ГГГГ ЧЧ:ММ:СС
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '—';
    }
  };

  // Автоматическое определение типа поиска при вводе
  const handleInputChange = (value: string) => {
    setSearchForm(prev => ({ ...prev, searchValue: value }));
    
    // Если поле пустое, ничего не меняем
    if (!value.trim()) {
      return;
    }
    
    // Если содержит @, это скорее всего UPN (email)
    if (value.includes('@')) {
      setSearchForm(prev => ({ ...prev, searchType: 'upn' }));
    } else {
      // Если нет @, это скорее всего ФИО
      setSearchForm(prev => ({ ...prev, searchType: 'fio' }));
    }
  };

  // Шаблон 1: Поиск по ФИО/Логину с датами
  const handleSearch = async () => {
    if (!searchForm.searchValue.trim()) {
      toast.error('Введите ФИО или логин для поиска');
      return;
    }
    if (!searchForm.dateFrom || !searchForm.dateTo) {
      toast.error('Необходимо указать диапазон дат');
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    
    try {
      // Форматируем даты с учетом времени для API
      const yearFrom = searchForm.dateFrom.getFullYear();
      const monthFrom = String(searchForm.dateFrom.getMonth() + 1).padStart(2, '0');
      const dayFrom = String(searchForm.dateFrom.getDate()).padStart(2, '0');
      const dateFromStr = `${yearFrom}-${monthFrom}-${dayFrom}`;
      
      const yearTo = searchForm.dateTo.getFullYear();
      const monthTo = String(searchForm.dateTo.getMonth() + 1).padStart(2, '0');
      const dayTo = String(searchForm.dateTo.getDate()).padStart(2, '0');
      const dateToStr = `${yearTo}-${monthTo}-${dayTo}`;
      
      const dateFrom = `${dateFromStr} ${searchForm.timeFrom}:00`;
      const dateTo = `${dateToStr} ${searchForm.timeTo}:59`;

      let response;

      if (searchForm.searchType === 'fio') {
        // Разбираем ФИО на части
        const parts = searchForm.searchValue.trim().split(/\s+/);
        if (parts.length < 2) {
          toast.error('Введите хотя бы фамилию и имя');
          setIsLoading(false);
          return;
        }

        const [lastName, firstName, ...middleNameParts] = parts;
        const middleName = middleNameParts.join(' ');

        response = await skudApi.getForeignStudentsPassesByFio(lastName, firstName, middleName, dateFrom, dateTo);
      } else {
        // Поиск по UPN
        response = await skudApi.getForeignStudentsPassesByUpn(searchForm.searchValue.trim(), dateFrom, dateTo);
      }

      if (response.success && response.data) {
        setSearchResults(response.data as PassRecord[]);
        if (response.data.length === 0) {
          toast.info('Проходы не найдены за указанный период');
        } else {
          toast.success(`Найдено записей: ${response.data.length}`);
        }
      } else {
        toast.error(response.error?.message || 'Ошибка при поиске проходов');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка при поиске проходов');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Шаблон 2: Отчет о пропавших студентах (>3 дней)
  const handleMissingReport = async () => {
    setIsLoading(true);
    setMissingResults([]);
    
    try {
      const response = await skudApi.getForeignStudentsMissing(missingForm.country, missingForm.daysThreshold);
      
      console.log('Missing students response:', response);
      
      if (response.success) {
        // Данные приходят напрямую в response.results, а не в response.data
        const results = response.results || [];
        
        console.log('Parsed results:', results);
        setMissingResults(results);
        
        if (results.length === 0) {
          toast.info('Пропавшие студенты не найдены');
        } else {
          toast.success(`Найдено записей: ${results.length}`);
        }
      } else {
        console.error('API error:', response.error);
        toast.error(response.error?.message || 'Ошибка при получении данных');
        setMissingResults([]);
      }
    } catch (err) {
      console.error('Exception:', err);
      toast.error(err instanceof Error ? err.message : 'Произошла ошибка');
      setMissingResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Экспорт в Excel (как в PassesReportPage)
  const handleExportExcel = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.warning('Нет данных для экспорта');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');
      
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
      
      toast.success('Отчет успешно выгружен в Excel');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка при экспорте в Excel');
    }
  };

  // Фильтрация результатов по дням отсутствия
  const filterMissingResultsByDays = (results: PassRecord[]): PassRecord[] => {
    if (daysFilter === 'all') {
      return results;
    }

    return results.filter(result => {
      const days = result.daysMissing;
      
      switch (daysFilter) {
        case 'undefined':
          return days === null || days === undefined;
        case 'up10':
          return days !== null && days !== undefined && days <= 10;
        case 'up30':
          return days !== null && days !== undefined && days <= 30;
        case 'up100':
          return days !== null && days !== undefined && days <= 100;
        case 'over100':
          return days !== null && days !== undefined && days > 100;
        default:
          return true;
      }
    });
  };

  // Получаем отфильтрованные результаты
  const filteredMissingResults = filterMissingResultsByDays(missingResults);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отчет по иностранным студентам</h2>
        {/* Connection Status */}
        {isConnected ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <XCircle className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">
              Информация о статистике
            </h3>
            <p className="text-sm text-blue-700">
              Статистика составлена на основании наличия <span className="font-semibold">кампусных карт</span> у студентов. 
              Данные о проходах фиксируются системой контроля и управления доступом (СКУД) при использовании кампусной карты 
              для доступа в здания и помещения университета.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <SimpleStatCard 
              key={index} 
              title={card.title}
              value={cardValues[card.valueTopic] || '—'}
              icon={card.icon}
              unit={card.unit}
            />
          ))}
        </div>
      )}

      {/* Chart Card - Распределение по странам */}
      {countryStats.length > 0 && (
        <DonutChartCard 
          title="Распределение иностранных студентов по странам"
          data={countryStats.filter(item => item.country !== 'РОССИЯ')}
        />
      )}

      {/* Report Templates Selector */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Шаблоны отчетов
        </h3>
        
        {/* Template Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTemplate('search')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTemplate === 'search'
                ? 'text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            style={activeTemplate === 'search' ? { borderColor: '#00aeef', color: '#00aeef' } : {}}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Поиск проходов</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTemplate('missing')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTemplate === 'missing'
                ? 'text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            style={activeTemplate === 'missing' ? { borderColor: '#00aeef', color: '#00aeef' } : {}}
          >
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4" />
              <span>Пропавшие студенты</span>
            </div>
          </button>
        </div>

        {/* Шаблон 1: Поиск проходов */}
        {activeTemplate === 'search' && (
          <div className="space-y-4">
            {/* Search Type Selector */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="fio"
                  checked={searchForm.searchType === 'fio'}
                  onChange={() => setSearchForm(prev => ({ ...prev, searchType: 'fio' }))}
                  className="w-4 h-4 accent-[#00aeef]"
                />
                <span className="text-sm text-gray-700">По ФИО</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="upn"
                  checked={searchForm.searchType === 'upn'}
                  onChange={() => setSearchForm(prev => ({ ...prev, searchType: 'upn' }))}
                  className="w-4 h-4 accent-[#00aeef]"
                />
                <span className="text-sm text-gray-700">По Логину или Почте</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ФИО or UPN Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchForm.searchType === 'fio' ? 'ФИО' : 'Логин или Почта'}
                </label>
                <input
                  type="text"
                  value={searchForm.searchValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                  placeholder={searchForm.searchType === 'fio' ? 'Иванов Иван Иванович' : 'stud0123456789@study.utmn.ru'}
                />
                {searchForm.searchType === 'fio' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">💡 Подсказка:</span> Для иностранных студентов используйте первые два слова.
                      <br />
                      <span className="font-medium">Пример:</span> "Абдалла Алаиддин Саед Хафез" → 
                      <span className="font-semibold"> Фамилия: Абдалла, Имя: Алаиддин</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Date From + Time From Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата от
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    selected={searchForm.dateFrom}
                    onChange={(date) => setSearchForm({ ...searchForm, dateFrom: date })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    placeholderText="Выберите дату"
                    locale="ru"
                    dateFormat="dd.MM.yyyy"
                  />
                  <input
                    type="time"
                    value={searchForm.timeFrom}
                    onChange={(e) => setSearchForm({ ...searchForm, timeFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Date To + Time To Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата до
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    selected={searchForm.dateTo}
                    onChange={(date) => setSearchForm({ ...searchForm, dateTo: date })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    placeholderText="Выберите дату"
                    locale="ru"
                    dateFormat="dd.MM.yyyy"
                  />
                  <input
                    type="time"
                    value={searchForm.timeTo}
                    onChange={(e) => setSearchForm({ ...searchForm, timeTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                    style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                style={{ backgroundColor: '#00aeef' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#0098d1')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#00aeef')}
              >
                <Search size={20} />
                <span>{isLoading ? 'Поиск...' : 'Найти'}</span>
              </button>
              
              {searchResults.length > 0 && (
                <button
                  onClick={() => handleExportExcel(searchResults.map(r => ({
                    'ФИО': r.fullName,
                    'Логин/Почта': r.upn,
                    'Страна': r.country || '—',
                    'Дата/Время': r.time,
                    'Место': r.checkpoint,
                    'Направление': r.direction === 'in' ? 'Вход' : r.direction === 'out' ? 'Выход' : '—'
                  })), 'foreign_students_search')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
                  <span>Выгрузить в Excel</span>
                </button>
              )}
            </div>

            {/* Total Records */}
            {searchResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Всего записей:</span>
                  <span className="text-2xl font-bold" style={{ color: '#00aeef' }}>
                    {searchResults.length}
                  </span>
                </div>
              </div>
            )}

            {/* Results Table */}
            {searchResults.length > 0 && (
              <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#00aeef' }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">ФИО</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Логин/Почта</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Страна</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Дата/Время</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Место</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Направление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {searchResults.map((result, index) => (
                      <tr 
                        key={result.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{result.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(result.time)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.checkpoint}</td>
                        <td className="px-6 py-4 text-sm">
                          {result.direction === 'in' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Вход
                            </span>
                          ) : result.direction === 'out' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Выход
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* No Results Message */}
            {!isLoading && searchResults.length === 0 && (
              <div className="mt-4 p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                Нет данных. Выполните поиск.
              </div>
            )}
          </div>
        )}

        {/* Шаблон 2: Пропавшие студенты */}
        {activeTemplate === 'missing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Выбор страны */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Страна
                </label>
                <select
                  value={missingForm.country}
                  onChange={(e) => setMissingForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                >
                  <option value="all">Все страны (кроме Рссии)</option>
                  {countryStats
                    .filter(c => c.country !== 'РОССИЯ')
                    .map(country => (
                      <option key={country.country} value={country.country}>
                        {country.country}
                      </option>
                    ))}
                </select>
              </div>

              {/* Порог дней */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отсутствие более (дней)
                </label>
                <input
                  type="number"
                  min="1"
                  value={missingForm.daysThreshold}
                  onChange={(e) => setMissingForm(prev => ({ ...prev, daysThreshold: parseInt(e.target.value) || 3 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleMissingReport}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                style={{ backgroundColor: '#00aeef' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#0098d1')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#00aeef')}
              >
                <UserX size={20} />
                <span>{isLoading ? 'Поиск...' : 'Сформировать отчет'}</span>
              </button>
              
              {missingResults.length > 0 && (
                <button
                  onClick={() => handleExportExcel(filteredMissingResults.map(r => ({
                    'ФИО': r.fullName,
                    'Логин/Почта': r.upn,
                    'Страна': r.country || '—',
                    'Последний визит': r.time,
                    'Место': r.checkpoint,
                    'Точка прохода': r.deviceName || '—',
                    'Дней отсутствия': r.daysMissing
                  })), 'foreign_students_missing')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
                  <span>Выгрузить в Excel</span>
                </button>
              )}
            </div>

            {/* Days Filter */}
            {missingResults.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фильтр по дням отсутствия
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDaysFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'all'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'all' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    Показать все
                  </button>
                  <button
                    onClick={() => setDaysFilter('up10')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'up10'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'up10' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    До 10 дней
                  </button>
                  <button
                    onClick={() => setDaysFilter('up30')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'up30'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'up30' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    До 30 дней
                  </button>
                  <button
                    onClick={() => setDaysFilter('up100')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'up100'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'up100' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    До 100 дней
                  </button>
                  <button
                    onClick={() => setDaysFilter('over100')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'over100'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'over100' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    Более 100 дней
                  </button>
                  <button
                    onClick={() => setDaysFilter('undefined')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      daysFilter === 'undefined'
                        ? 'text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={daysFilter === 'undefined' ? { backgroundColor: '#00aeef' } : {}}
                  >
                    Не определено
                  </button>
                </div>
              </div>
            )}

            {/* Total Records */}
            {missingResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    {daysFilter === 'all' ? 'Всего записей:' : 'Отфильтровано записей:'}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: '#00aeef' }}>
                    {filteredMissingResults.length}
                    {daysFilter !== 'all' && (
                      <span className="text-sm text-gray-500 ml-2">из {missingResults.length}</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Results Table */}
            {missingResults.length > 0 && (
              <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#00aeef' }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">ФИО</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Логин/Почта</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Страна</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Последний визит</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Место</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Точка прохода</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Дней отсутствия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMissingResults.map((result, index) => (
                      <tr 
                        key={result.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{result.fullName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(result.time)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.checkpoint || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{result.deviceName || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          {result.daysMissing === null || result.daysMissing === undefined ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Не определено
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.daysMissing >= 7
                                ? 'bg-red-100 text-red-800'
                                : result.daysMissing >= 4
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {result.daysMissing} {result.daysMissing === 1 ? 'день' : result.daysMissing >= 2 && result.daysMissing <= 4 ? 'дня' : 'дней'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* No Results Message */}
            {!isLoading && missingResults.length === 0 && (
              <div className="mt-4 p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                Нет данных. Выполните поиск.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Cat Widget */}
      <LoadingCatWidget 
        isVisible={isLoading} 
        message={activeTemplate === 'search' 
          ? 'Котик ищет проходы в базе данных СКУД...' 
          : 'Котик ищет пропавших студентов...'} 
      />
    </div>
  );
}