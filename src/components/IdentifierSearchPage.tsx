import { useState } from 'react';
import { Search, FileSpreadsheet, User, CreditCard, Building2, Clock, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
import { skudApi } from '../lib/api';
import { toast } from 'sonner';

interface SearchResult {
  id: number;
  identifier: string;
  identifierType: 'card' | 'employee' | 'student';
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
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setError(null);

    const query = searchQuery.trim();
    
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const response = await skudApi.searchByIdentifier(query);
      
      if (response.success && response.data) {
        setSearchResults(response.data as SearchResult[]);
        if (response.data.length === 0) {
          toast.info('Карта не найдена. Проверьте правильность ввода идентификатора.');
        } else {
          toast.success(`Найдено записей: ${response.data.length}`);
        }
      } else {
        setError(response.error?.message || 'Ошибка поиска');
        toast.error(response.error?.message || 'Ошибка поиска');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Не удалось выполнить поиск');
      toast.error('Не удалось выполнить поиск');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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
      'Тип': result.identifierType === 'employee' ? 'Сотрудник' : 'Студент',
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
    toast.success('Файл экспортирован!');
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
              Идентификатор карты
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors text-lg"
                style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
                placeholder="076,10849 или 4991585 или 0004991585"
              />
              <Search 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" 
                size={20} 
              />
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Поддерживаемые форматы идентификатора карты:
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <CreditCard size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <div><strong>076,10849</strong> - формат "старший байт, младшие байты"</div>
                  <div className="text-xs text-blue-600 mt-0.5">Преобразуется в: 76 (0x4C) + 10849 (0x2A61) = 0x4C2A61 = 4991585</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <div><strong>4991585</strong> - прямой числовой идентификатор</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <div><strong>0004991585</strong> - числовой идентификатор с ведущими нулями</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
              💡 <strong>Совет:</strong> Введите идентификатор в любом из этих форматов для поиска владельца карты
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
                            {result.identifierType === 'employee' ? 'Сотрудник' : 'Студент'}
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
                        <div className="flex items-start gap-2 text-sm">
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
