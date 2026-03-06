import { useState, useEffect } from 'react';
import { Search, Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css';
import * as XLSX from 'xlsx';
import { skudApi } from '../lib/api';
import { toast } from 'sonner';

registerLocale('ru', ru);

interface PassRecord {
  id: number;
  time: string;
  fullName: string;
  upn: string | null;
  cardNumber: string | null;
  checkpoint: string;
  eventName?: string | null;
  direction?: string | null;
  building?: string | null;
}

export function StudentsReportPage() {
  // Установка сегодняшней даты по умолчанию
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'fio' | 'upn'>('fio');
  const [filters, setFilters] = useState({
    dateFrom: todayStart as Date | null,
    dateTo: todayEnd as Date | null,
    timeFrom: '00:00',
    timeTo: '23:59'
  });

  const [passRecords, setPassRecords] = useState<PassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Автоматическое определение типа поиска при вводе
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Если поле пустое, ничего не меняем
    if (!value.trim()) {
      return;
    }
    
    // Если содержит @, это скорее всего UPN (email)
    if (value.includes('@')) {
      setSearchType('upn');
    } else {
      // Если нет @, это скорее всего ФИО
      setSearchType('fio');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Введите ФИО или UPN для поиска');
      return;
    }

    if (!filters.dateFrom || !filters.dateTo) {
      toast.error('Необходимо указать диапазон дат');
      return;
    }

    setIsLoading(true);
    setPassRecords([]);

    try {
      // Форматируем даты с учетом времени для API (YYYY-MM-DD HH:MM:SS)
      const dateFromStr = filters.dateFrom.toISOString().slice(0, 10);
      const dateToStr = filters.dateTo.toISOString().slice(0, 10);
      const dateFrom = `${dateFromStr} ${filters.timeFrom}:00`;
      const dateTo = `${dateToStr} ${filters.timeTo}:59`;

      let response;

      if (searchType === 'fio') {
        // Разбираем ФИО на части
        const parts = searchQuery.trim().split(/\s+/);
        if (parts.length < 2) {
          toast.error('Введите хотя бы фамилию и имя');
          setIsLoading(false);
          return;
        }

        const [lastName, firstName, ...middleNameParts] = parts;
        const middleName = middleNameParts.join(' ');

        response = await skudApi.getStudentsPassesByFio(lastName, firstName, middleName, dateFrom, dateTo);
      } else {
        // Поиск по UPN
        response = await skudApi.getStudentsPassesByUpn(searchQuery.trim(), dateFrom, dateTo);
      }

      if (response.success && response.data) {
        setPassRecords(response.data as PassRecord[]);
        if (response.data.length === 0) {
          toast.info('Проходы студентов не найдены за указанный период');
        } else {
          toast.success(`Найдено записей: ${response.data.length}`);
        }
      } else {
        toast.error(response.error?.message || 'Ошибка при поиске проходов студентов');
        setPassRecords([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Ошибка при поиске проходов студентов');
      setPassRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExportExcel = () => {
    if (passRecords.length === 0) {
      toast.warning('Нет данных для экспорта');
      return;
    }

    try {
      // Подготавливаем данные для экспорта
      const exportData = passRecords.map(record => ({
        'Время': record.time,
        'ФИО': record.fullName,
        'UPN': record.upn || '',
        'Номер карты': record.cardNumber || '',
        'Событие': record.eventName || '',
        'Точка прохода': record.checkpoint,
        'Направление': record.direction === 'in' ? 'Вход' : record.direction === 'out' ? 'Выход' : '',
        'Здание': record.building || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Проходы студентов');
      
      // Генерируем имя файла с датой
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `students_report_${dateStr}.xlsx`);
      
      toast.success('Отчет успено выгружен в Excel');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ошибка при экспорте в Excel');
    }
  };

  const totalRecords = passRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отчет по студентам</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={passRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
            <span>Выгрузить в Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Фильтры поиска
        </h3>

        {/* Search Type Selector */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="fio"
              checked={searchType === 'fio'}
              onChange={() => setSearchType('fio')}
              className="w-4 h-4 accent-[#00aeef]"
            />
            <span className="text-sm text-gray-700">По ФИО</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="upn"
              checked={searchType === 'upn'}
              onChange={() => setSearchType('upn')}
              className="w-4 h-4 accent-[#00aeef]"
            />
            <span className="text-sm text-gray-700">По Логину или Почте</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ФИО or UPN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {searchType === 'fio' ? 'ФИО студента' : 'Логин или Почта'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
              placeholder={searchType === 'fio' ? 'Петрова Мария Сергеевна' : 'stud0123456789@study.utmn.ru'}
            />
          </div>

          {/* Date From + Time From Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата от
            </label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                selected={filters.dateFrom}
                onChange={(date) => setFilters({ ...filters, dateFrom: date })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                placeholderText="Выберите дату"
                locale="ru"
                dateFormat="dd.MM.yyyy"
              />
              <input
                type="time"
                value={filters.timeFrom}
                onChange={(e) => setFilters({ ...filters, timeFrom: e.target.value })}
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
                selected={filters.dateTo}
                onChange={(date) => setFilters({ ...filters, dateTo: date })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                placeholderText="Выберите дату"
                locale="ru"
                dateFormat="dd.MM.yyyy"
              />
              <input
                type="time"
                value={filters.timeTo}
                onChange={(e) => setFilters({ ...filters, timeTo: e.target.value })}
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

          {/* Quick Examples */}
          <div className="text-sm text-gray-500">
            <span className="font-medium">Примеры:</span>
            <button
              onClick={() => {
                setSearchQuery('Петрова Мария Сергеевна');
                setSearchType('fio');
              }}
              className="ml-2 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Петрова Мария Сергеевна
            </button>
            <button
              onClick={() => {
                setSearchQuery('stud0123456789@study.utmn.ru');
                setSearchType('upn');
              }}
              className="ml-2 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              stud0123456789@study.utmn.ru
            </button>
          </div>
        </div>
      </div>

      {/* Total Records */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Всего записей:</span>
          <span className="text-2xl font-bold" style={{ color: '#00aeef' }}>
            {totalRecords}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: '#00aeef' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Время</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">ФИО</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">UPN</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Номер карты</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Событие</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Точка прохода</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Направление</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Здание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {passRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {isLoading ? 'Загрузка...' : 'Нет данных. Выполните поиск.'}
                  </td>
                </tr>
              ) : (
                passRecords.map((record, index) => (
                  <tr 
                    key={record.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{record.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.upn || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.cardNumber || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.eventName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.checkpoint}</td>
                    <td className="px-6 py-4 text-sm">
                      {record.direction === 'in' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Вход
                        </span>
                      ) : record.direction === 'out' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Выход
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.building || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}