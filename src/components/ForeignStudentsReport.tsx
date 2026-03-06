import { useState } from 'react';
import { 
  Search, 
  Calendar, 
  UserX, 
  Download,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { DynamicStatCard } from './DynamicStatCard';
import { ChartStatCard } from './ChartStatCard';
import { useForeignStudentsMQTT } from '../hooks/useForeignStudentsMQTT';

type ReportTemplate = 'search' | 'missing';

interface SearchFormData {
  searchType: 'fio' | 'upn' | 'email';
  searchValue: string;
  dateFrom: string;
  dateTo: string;
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
  
  const [activeTemplate, setActiveTemplate] = useState<ReportTemplate>('search');
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    searchType: 'fio',
    searchValue: '',
    dateFrom: '',
    dateTo: ''
  });
  const [missingForm, setMissingForm] = useState<MissingFormData>({
    country: 'all',
    daysThreshold: 3
  });
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [missingResults, setMissingResults] = useState<MissingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Шаблон 1: Поиск по ФИО/Логину/Email с датами
  const handleSearch = async () => {
    if (!searchForm.searchValue.trim()) {
      setError('Введите значение для поиска');
      return;
    }
    if (!searchForm.dateFrom || !searchForm.dateTo) {
      setError('Выберите период');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        searchType: searchForm.searchType,
        searchValue: searchForm.searchValue,
        dateFrom: searchForm.dateFrom,
        dateTo: searchForm.dateTo
      });

      const response = await fetch(`/api/foreign-students/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при получении данных');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Шаблон 2: Отчет о пропавших студентах (>3 дней)
  const handleMissingReport = async () => {
    setIsLoading(true);
    setError(null);
    
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setMissingResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Экспорт в CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Подготовка данных для диаграммы (топ 7 стран)
  const chartData = countryStats
    .filter(item => item.country !== 'РОССИЯ') // Исключаем Россию
    .sort((a, b) => b.students_count - a.students_count)
    .slice(0, 7)
    .map(item => ({
      name: item.country,
      value: item.students_count
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Отчет по иностранным студентам</h2>
          <p className="text-gray-600 mt-2">Статистика и отчеты по иностранным студентам</p>
        </div>
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

      {/* Report Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Шаблоны отчетов</h3>
        
        {/* Template Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTemplate('search')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTemplate === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
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
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Тип поиска */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип поиска
                </label>
                <select
                  value={searchForm.searchType}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, searchType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fio">По ФИО</option>
                  <option value="upn">По Логину или Почте</option>
                  <option value="email">По Email</option>
                </select>
              </div>

              {/* Значение поиска */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Значение
                </label>
                <Input
                  value={searchForm.searchValue}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, searchValue: e.target.value }))}
                  placeholder={
                    searchForm.searchType === 'fio' ? 'Иванов Иван Иванович' :
                    searchForm.searchType === 'upn' ? 'i.i.ivanov@utmn.ru' :
                    'ivanov@utmn.ru'
                  }
                />
              </div>

              {/* Дата от */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Дата от
                </label>
                <Input
                  type="date"
                  value={searchForm.dateFrom}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              {/* Дата до */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Дата до
                </label>
                <Input
                  type="date"
                  value={searchForm.dateTo}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Поиск...' : 'Найти'}
              </Button>
              {searchResults.length > 0 && (
                <Button
                  onClick={() => exportToCSV(searchResults, 'foreign-students-search.csv')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт CSV
                </Button>
              )}
            </div>

            {/* Results Table */}
            {searchResults.length > 0 && (
              <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ФИО</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Логин/Почта</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Страна</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Дата/Время</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Место</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Направление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {searchResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{result.fio}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{result.lastSeen}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.location}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            result.direction === 'Вход' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {result.direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  <Globe className="w-4 h-4 inline mr-1" />
                  Страна
                </label>
                <select
                  value={missingForm.country}
                  onChange={(e) => setMissingForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <Input
                  type="number"
                  min="1"
                  value={missingForm.daysThreshold}
                  onChange={(e) => setMissingForm(prev => ({ ...prev, daysThreshold: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleMissingReport}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <UserX className="w-4 h-4 mr-2" />
                {isLoading ? 'Поиск...' : 'Сформировать отчет'}
              </Button>
              {missingResults.length > 0 && (
                <Button
                  onClick={() => exportToCSV(missingResults, 'foreign-students-missing.csv')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт CSV
                </Button>
              )}
            </div>

            {/* Results Table */}
            {missingResults.length > 0 && (
              <div className="mt-6 overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ФИО</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Логин/Почта</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Страна</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Последний визит</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Место</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Дней отсутствия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {missingResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{result.fio}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.upn}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            <Globe className="w-3 h-3" />
                            {result.country}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{result.lastSeen}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{result.lastLocation}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && !error && (
          <>
            {activeTemplate === 'search' && searchResults.length === 0 && searchForm.searchValue && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">Результаты не найдены</p>
              </div>
            )}
            {activeTemplate === 'missing' && missingResults.length === 0 && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-600">Пропавшие студенты не найдены</p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
