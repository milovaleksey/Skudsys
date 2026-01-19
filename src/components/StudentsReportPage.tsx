import { useState } from 'react';
import { Search, FileSpreadsheet, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale/ru';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/datepicker-custom.css';

registerLocale('ru', ru);

interface StudentRecord {
  id: number;
  time: string;
  fullName: string;
  upn: string;
  cardNumber: string;
  checkpoint: string;
  course: string;
  group: string;
}

export function StudentsReportPage() {
  const [filters, setFilters] = useState({
    fullName: '',
    upn: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });

  // Mock data for students
  const [studentRecords] = useState<StudentRecord[]>([
    {
      id: 1,
      time: '2026-01-19 08:22:15',
      fullName: 'Петрова Мария Сергеевна',
      upn: 'petrova@study.utmn.ru',
      cardNumber: '0987654321',
      checkpoint: 'Вход, корпус Б',
      course: '3 курс',
      group: 'ИСТ-31'
    },
    {
      id: 2,
      time: '2026-01-19 09:12:03',
      fullName: 'Смирнова Анна Дмитриевна',
      upn: 'smirnova@study.utmn.ru',
      cardNumber: '5544332211',
      checkpoint: 'Библиотека',
      course: '2 курс',
      group: 'МАТ-21'
    },
    {
      id: 3,
      time: '2026-01-19 11:45:18',
      fullName: 'Новикова Елена Ивановна',
      upn: 'novikova@study.utmn.ru',
      cardNumber: '6677889900',
      checkpoint: 'Общежитие №2',
      course: '1 курс',
      group: 'ФИЛ-11'
    },
    {
      id: 4,
      time: '2026-01-19 13:20:42',
      fullName: 'Васильева Ольга Николаевна',
      upn: 'vasilieva@study.utmn.ru',
      cardNumber: '7788990011',
      checkpoint: 'Спортивный комплекс',
      course: '4 курс',
      group: 'ЭКО-41'
    },
    {
      id: 5,
      time: '2026-01-19 14:15:33',
      fullName: 'Соколова Екатерина Павловна',
      upn: 'sokolova@study.utmn.ru',
      cardNumber: '3344556677',
      checkpoint: 'Главный вход, корпус А',
      course: '3 курс',
      group: 'ЮР-31'
    },
    {
      id: 6,
      time: '2026-01-19 15:22:11',
      fullName: 'Федоров Алексей Дмитриевич',
      upn: 'fedorov@study.utmn.ru',
      cardNumber: '2233445566',
      checkpoint: 'Библиотека',
      course: '2 курс',
      group: 'ИНФ-21'
    },
  ]);

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    // Здесь будет логика поиска
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel');
    // Здесь будет логика экспорта в Excel
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF');
    // Здесь будет логика экспорта в PDF
  };

  const totalRecords = studentRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Отчет по студентам</h2>
          <p className="text-gray-600 mt-1">Информация о проходах студентов через контрольные точки</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileText size={20} style={{ color: '#00aeef' }} />
            <span>PDF</span>
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
              ФИО студента
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
              placeholder="student@study.utmn.ru"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата от
            </label>
            <DatePicker
              selected={filters.dateFrom}
              onChange={(date) => setFilters({ ...filters, dateFrom: date })}
              locale="ru"
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              placeholderText="Выберите дату"
              isClearable
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата до
            </label>
            <DatePicker
              selected={filters.dateTo}
              onChange={(date) => setFilters({ ...filters, dateTo: date })}
              locale="ru"
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
              placeholderText="Выберите дату"
              isClearable
            />
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Курс</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Группа</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Точка прохода</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentRecords.map((record, index) => (
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
                  <td className="px-6 py-4 text-sm text-gray-600">{record.course}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.group}</td>
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
