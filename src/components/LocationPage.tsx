import { useState } from 'react';
import { Search, MapPin, User, CreditCard, Building2, Users, Clock } from 'lucide-react';

interface PersonInfo {
  fullName: string;
  upn: string;
  cardNumber: string;
  department: string;
  type: 'student' | 'employee';
  lastLocation: {
    checkpoint: string;
    time: string;
  };
}

export function LocationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'fio' | 'upn'>('fio');
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockData: { [key: string]: PersonInfo } = {
    'Иванов Иван Иванович': {
      fullName: 'Иванов Иван Иванович',
      upn: 'ivanov@utmn.ru',
      cardNumber: '1234567890',
      department: 'Институт математики и компьютерных наук',
      type: 'employee',
      lastLocation: {
        checkpoint: 'Главный вход, корпус А',
        time: '2026-01-19 14:35:22'
      }
    },
    'ivanov@utmn.ru': {
      fullName: 'Иванов Иван Иванович',
      upn: 'ivanov@utmn.ru',
      cardNumber: '1234567890',
      department: 'Институт математики и компьютерных наук',
      type: 'employee',
      lastLocation: {
        checkpoint: 'Главный вход, корпус А',
        time: '2026-01-19 14:35:22'
      }
    },
    'Петрова Мария Сергеевна': {
      fullName: 'Петрова Мария Сергеевна',
      upn: 'petrova@study.utmn.ru',
      cardNumber: '0987654321',
      department: 'Институт социально-гуманитарных наук, 3 курс',
      type: 'student',
      lastLocation: {
        checkpoint: 'Библиотека',
        time: '2026-01-19 13:20:45'
      }
    },
    'petrova@study.utmn.ru': {
      fullName: 'Петрова Мария Сергеевна',
      upn: 'petrova@study.utmn.ru',
      cardNumber: '0987654321',
      department: 'Институт социально-гуманитарных наук, 3 курс',
      type: 'student',
      lastLocation: {
        checkpoint: 'Библиотека',
        time: '2026-01-19 13:20:45'
      }
    },
  };

  const handleSearch = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const result = mockData[searchQuery];
      setPersonInfo(result || null);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Где находится человек</h2>
        <p className="text-gray-600 mt-2">Поиск местонахождения сотрудников и студентов</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#00aeef' }}>
          Поиск
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
            <span className="text-sm text-gray-700">По UPN</span>
          </label>
        </div>

        {/* Search Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
            style={{ '--tw-ring-color': '#00aeef' } as React.CSSProperties}
            placeholder={searchType === 'fio' ? 'Введите ФИО' : 'Введите UPN (example@utmn.ru)'}
          />
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
        </div>

        {/* Quick Search Examples */}
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-medium">Примеры:</span>
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSearchQuery('Иванов Иван Иванович');
                setSearchType('fio');
              }}
              className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Иванов Иван Иванович
            </button>
            <button
              onClick={() => {
                setSearchQuery('petrova@study.utmn.ru');
                setSearchType('upn');
              }}
              className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              petrova@study.utmn.ru
            </button>
          </div>
        </div>
      </div>

      {/* No Results */}
      {!personInfo && !isLoading && searchQuery && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800">Человек не найден. Проверьте правильность введенных данных.</p>
        </div>
      )}

      {/* Person Info Card */}
      {personInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#00aeef' }}
              >
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Информация о человеке</h3>
                <span 
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    personInfo.type === 'employee' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {personInfo.type === 'employee' ? 'Сотрудник' : 'Студент'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">ФИО</div>
                  <div className="text-gray-900 font-medium">{personInfo.fullName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Номер карты</div>
                  <div className="text-gray-900 font-medium">{personInfo.cardNumber}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    {personInfo.type === 'employee' ? 'Отдел' : 'Институт/Курс'}
                  </div>
                  <div className="text-gray-900 font-medium">{personInfo.department}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600">UPN</div>
                  <div className="text-gray-900 font-medium">{personInfo.upn}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Location */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#00aeef' }}
              >
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Текущее местоположение</h3>
                <p className="text-sm text-gray-600">Последняя зафиксированная точка</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-[#00aeef]">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin size={24} style={{ color: '#00aeef' }} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Точка прохода</div>
                    <div className="text-xl font-bold text-gray-900">
                      {personInfo.lastLocation.checkpoint}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span className="text-sm">{personInfo.lastLocation.time}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Примечание:</span> Данные обновляются в реальном времени при каждом проходе через контрольные точки.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
