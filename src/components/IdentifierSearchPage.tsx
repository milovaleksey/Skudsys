import { useState } from 'react';
import { Search, Download, FileSpreadsheet, User, CreditCard, Building2, Clock, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SearchResult {
  id: number;
  identifier: string;
  identifierType: 'card' | 'employee';
  fullName: string;
  email: string;
  position?: string;
  department?: string;
  cardNumber?: string;
  lastSeen?: string;
  location?: string;
  status: 'active' | 'inactive';
}

export function IdentifierSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock data for demonstration
  const mockData: SearchResult[] = [
    {
      id: 1,
      identifier: '123.456789',
      identifierType: 'employee',
      fullName: 'Иванов Иван Иванович',
      email: 'ivanov@utmn.ru',
      position: 'Доцент кафедры информатики',
      department: 'Институт математики и компьютерных наук',
      cardNumber: '1234567890123',
      lastSeen: '2026-01-23 14:30:15',
      location: 'Главный вход, корпус А',
      status: 'active'
    },
    {
      id: 2,
      identifier: '1234567890123',
      identifierType: 'card',
      fullName: 'Петрова Мария Сергеевна',
      email: 'petrova@study.utmn.ru',
      position: 'Студент 3 курса',
      department: 'Институт социально-гуманитарных наук',
      cardNumber: '1234567890123',
      lastSeen: '2026-01-23 09:15:42',
      location: 'Библиотека',
      status: 'active'
    },
    {
      id: 3,
      identifier: '987.654321',
      identifierType: 'employee',
      fullName: 'Сидоров Петр Александрович',
      email: 'sidorov@utmn.ru',
      position: 'Заведующий кафедрой',
      department: 'Институт физики и технологий',
      cardNumber: '9876543210987',
      lastSeen: '2026-01-22 18:45:00',
      location: 'Вход, корпус Б',
      status: 'active'
    }
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setHasSearched(true);

    // Simulate API call
    setTimeout(() => {
      // Validate format and search
      const query = searchQuery.trim();
      
      if (!query) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Search in mock data
      const results = mockData.filter(item => 
        item.identifier.includes(query) ||
        item.cardNumber?.includes(query) ||
        item.fullName.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExportExcel = () => {
    if (searchResults.length === 0) return;

    const exportData = searchResults.map(result => ({
      'Идентификатор': result.identifier,
      'Тип': 'Номер карты',
      'ФИО': result.fullName,
      'Email': result.email,
      'Должность': result.position || '-',
      'Подразделение': result.department || '-',
      'Номер карты': result.cardNumber || '-',
      'Последняя активность': result.lastSeen || '-',
      'Местоположение': result.location || '-',
      'Статус': result.status === 'active' ? 'Активен' : 'Неактивен'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Поиск');
    XLSX.writeFile(workbook, `identifier_search_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const validateFormat = (value: string): { valid: boolean; format?: string } => {
    // Format XXX.XXXXXX (e.g., 123.456789)
    const employeeFormat = /^\d{3}\.\d{6}$/;
    // Format XXXXXXXXXXXXX (13 digits)
    const cardFormat = /^\d{13}$/;

    if (employeeFormat.test(value)) {
      return { valid: true, format: 'employee' };
    }
    if (cardFormat.test(value)) {
      return { valid: true, format: 'card' };
    }
    return { valid: false };
  };

  const getFormatHint = () => {
    const validation = validateFormat(searchQuery);
    if (!searchQuery) return null;

    if (validation.valid) {
      return (
        <div className="text-xs text-green-600 mt-1">
          ✓ Формат: {validation.format === 'employee' ? 'Номер карты (XXX.XXXXXX)' : 'Номер карты (13 цифр)'}
        </div>
      );
    } else {
      return (
        <div className="text-xs text-amber-600 mt-1">
          Введите полный идентификатор или часть для поиска
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Поиск по идентификатору</h2>
          <p className="text-gray-600 mt-1">
            Поиск сотрудников и студентов по номеру карты
          </p>
        </div>
        {searchResults.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileSpreadsheet size={20} style={{ color: '#00aeef' }} />
            <span>Excel</span>
          </button>
        )}
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Поиск
        </h3>

        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Идентификатор
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg"
                style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                placeholder="123.456789 или 1234567890123"
              />
              <Search 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" 
                size={20} 
              />
            </div>
            {getFormatHint()}
          </div>

          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Поддерживаемые форматы:
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span><strong>XXX.XXXXXX</strong> - номер карты (например: 123.456789)</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span><strong>XXXXXXXXXXXXX</strong> - номер карты (13 цифр, например: 1234567890123)</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              Также доступен поиск по частичному совпадению ФИО или email
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00aeef' }}
          >
            <Search size={20} />
            <span>{isSearching ? 'Поиск...' : 'Найти'}</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: '#00aeef' }}>
              Результаты поиска
            </h3>
            <div className="text-sm text-gray-600">
              Найдено: <span className="font-semibold">{searchResults.length}</span>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Ничего не найдено по вашему запросу' : 'Введите идентификатор для поиска'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#00aeef20' }}
                      >
                        <User size={24} style={{ color: '#00aeef' }} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {result.fullName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status === 'active' ? 'Активен' : 'Неактивен'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.identifierType === 'employee'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {result.identifierType === 'employee' ? 'Сотрудник' : 'Карта доступа'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard size={16} className="text-gray-400" />
                        <span className="text-gray-600">Идентификатор:</span>
                        <span className="font-semibold text-gray-900">{result.identifier}</span>
                      </div>
                      
                      {result.cardNumber && result.identifier !== result.cardNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={16} className="text-gray-400" />
                          <span className="text-gray-600">Номер карты:</span>
                          <span className="font-semibold text-gray-900">{result.cardNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{result.email}</span>
                      </div>

                      {result.position && (
                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-600">Должность:</span>
                          <span className="font-medium text-gray-900">{result.position}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {result.department && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-gray-600">Подразделение:</span>
                          <span className="font-medium text-gray-900">{result.department}</span>
                        </div>
                      )}

                      {result.lastSeen && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-gray-600">Последняя активность:</span>
                          <span className="font-medium text-gray-900">{result.lastSeen}</span>
                        </div>
                      )}

                      {result.location && (
                        <div className="flex start gap-2 text-sm">
                          <Building2 size={16} className="text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-600">Местоположение:</span>
                            <div className="font-medium text-gray-900">{result.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}