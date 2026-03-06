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
import { DynamicStatCard } from './DynamicStatCard';
import { ChartStatCard } from './ChartStatCard';
import { useForeignStudentsMQTT } from '../hooks/useForeignStudentsMQTT';
import { toast } from 'sonner';

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

interface SearchResult {
  id: number;
  fio: string;
  upn: string;
  email: string;
  country: string;
  lastSeen: string;
  location: string;
  direction: string;
}

interface MissingResult {
  id: number;
  fio: string;
  upn: string;
  email: string;
  country: string;
  lastSeen: string;
  lastLocation: string;
  daysMissing: number;
}

export function ForeignStudentsReport() {
  const { statCards, cardValues, countryStats, countries, isConnected } = useForeignStudentsMQTT();
  
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
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [missingResults, setMissingResults] = useState<MissingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      const params = new URLSearchParams({
        searchType: searchForm.searchType,
        searchValue: searchForm.searchValue,
        dateFrom,
        dateTo
      });

      const response = await fetch(`/api/foreign-students/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при получении данных');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      
      if (data.results.length === 0) {
        toast.info('Проходы не найдены за указанный период');
      } else {
        toast.success(`Найдено записей: ${data.results.length}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Произошла ошибка');
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
      const params = new URLSearchParams({
        country: missingForm.country,
        daysThreshold: missingForm.daysThreshold.toString()
      });

      const response = await fetch(`/api/foreign-students/missing?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при получении данных');
      }

      const data = await response.json();
      setMissingResults(data.results || []);
      
      if (data.results.length === 0) {
        toast.info('Пропавшие студенты не найдены');
      } else {
        toast.success(`Найдено записей: ${data.results.length}`);
      }
    } catch (err) {
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

  // Подготовка данных для диаграммы (топ 7 стран)
  const chartData = countryStats
    .filter(item => item.country !== 'РОССИЯ')
    .sort((a, b) => b.students_count - a.students_count)
    .slice(0, 7)
    .map(item => ({
      name: item.country,
      value: item.students_count
    }));

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

      {/* Dynamic Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(card => (
            <DynamicStatCard 
              key={card.id} 
              card={card} 
              value={cardValues[card.id]} 
            />
          ))}
        </div>
      )}

      {/* Chart Card - Распределение по странам */}
      {chartData.length > 0 && (
        <ChartStatCard 
          label="Распределение иностранных студентов по странам"
          description="Топ-7 стран по количеству студентов"
          data={chartData}
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
                  placeholder={searchForm.searchType === 'fio' ? 'Иванов Иван ��ванович' : 'user@utmn.ru'}
                />
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
                    'ФИО': r.fio,
                    'Логин/Почта': r.upn,
                    'Страна': r.country,
                    'Дата/Время': r.lastSeen,
                    'Место': r.location,
                    'Направление': r.direction
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
                        <td className="px-6 py-4 text-sm text-gray-900">{result.fio}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{result.lastSeen}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.location}</td>
                        <td className="px-6 py-4 text-sm">
                          {result.direction === 'Вход' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Вход
                            </span>
                          ) : result.direction === 'Выход' ? (
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
                  <option value="all">Все страны (кроме России)</option>
                  {countries
                    .filter(c => c.name !== 'РОССИЯ')
                    .map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
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
                  onClick={() => handleExportExcel(missingResults.map(r => ({
                    'ФИО': r.fio,
                    'Логин/Почта': r.upn,
                    'Страна': r.country,
                    'Последний визит': r.lastSeen,
                    'Место': r.lastLocation,
                    'Дней отсутствия': r.daysMissing
                  })), 'foreign_students_missing')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
                  <span>Выгрузить в Excel</span>
                </button>
              )}
            </div>

            {/* Total Records */}
            {missingResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Всего записей:</span>
                  <span className="text-2xl font-bold" style={{ color: '#00aeef' }}>
                    {missingResults.length}
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Дней отсутствия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missingResults.map((result, index) => (
                      <tr 
                        key={result.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{result.fio}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{result.lastSeen}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{result.lastLocation}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.daysMissing >= 7
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.daysMissing} дней
                          </span>
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
    </div>
  );
}