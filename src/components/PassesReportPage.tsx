import { useState } from 'react';
import { Search, Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css';
import * as XLSX from 'xlsx';

registerLocale('ru', ru);

interface PassRecord {
  id: number;
  time: string;
  fullName: string;
  upn: string;
  cardNumber: string;
  checkpoint: string;
}

export function PassesReportPage() {
  const [filters, setFilters] = useState({
    fullName: '',
    upn: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });

  // Mock data removed. TODO: Implement API integration
  const [passRecords] = useState<PassRecord[]>([]);
/*
  const [passRecords] = useState<PassRecord[]>([
    ...
  ]);
*/

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    // Здесь будет логика поиска
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel');
    // Здесь будет логика экспорта в Excel
    const worksheet = XLSX.utils.json_to_sheet(passRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Passes');
    XLSX.writeFile(workbook, 'passes_report.xlsx');
  };

  const totalRecords = passRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отчет о проходах</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Фильтры поиска
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ФИО Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО
            </label>
            <input
              type="text"
              value={filters.fullName}
              onChange={(e) => setFilters({ ...filters, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
              placeholder="Иванов Иван"
            />
          </div>

          {/* UPN Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPN
            </label>
            <input
              type="text"
              value={filters.upn}
              onChange={(e) => setFilters({ ...filters, upn: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
              placeholder="user@utmn.ru"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата от
            </label>
            <div className="relative">
              <DatePicker
                selected={filters.dateFrom}
                onChange={(date) => setFilters({ ...filters, dateFrom: date })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                placeholderText="Выберите дату"
                locale="ru"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата до
            </label>
            <div className="relative">
              <DatePicker
                selected={filters.dateTo}
                onChange={(date) => setFilters({ ...filters, dateTo: date })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                placeholderText="Выберите дату"
                locale="ru"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors font-medium"
            style={{ backgroundColor: '#00aeef' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0098d1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00aeef'}
          >
            <Search size={20} />
            <span>Найти</span>
          </button>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Точка прохода</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {passRecords.map((record, index) => (
                <tr 
                  key={record.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{record.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.upn}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.cardNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.checkpoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}