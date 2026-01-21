import { useState } from 'react';
import { Car, Clock, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface ParkingRecord {
  id: number;
  entryTime: string;
  fullName: string;
  upn: string;
  carBrand: string;
  licensePlate: string;
}

interface ParkingLot {
  name: string;
  currentCount: number;
  totalCapacity: number;
  records: ParkingRecord[];
}

export function ParkingPage() {
  const [searchK1, setSearchK1] = useState('');
  const [searchK5, setSearchK5] = useState('');
  const [isK1Expanded, setIsK1Expanded] = useState(false);
  const [isK5Expanded, setIsK5Expanded] = useState(false);

  // Mock data for Parking K1
  const parkingK1: ParkingLot = {
    name: 'Парковка К1',
    currentCount: 8,
    totalCapacity: 50,
    records: [
      {
        id: 1,
        entryTime: '2026-01-19 08:15:32',
        fullName: 'Иванов Иван Иванович',
        upn: 'ivanov@utmn.ru',
        carBrand: 'Toyota Camry',
        licensePlate: 'А123АА72'
      },
      {
        id: 2,
        entryTime: '2026-01-19 09:22:45',
        fullName: 'Петров Сергей Дмитриевич',
        upn: 'petrov@utmn.ru',
        carBrand: 'Volkswagen Polo',
        licensePlate: 'В456ВВ72'
      },
      {
        id: 3,
        entryTime: '2026-01-19 10:05:18',
        fullName: 'Сидорова Мария Александровна',
        upn: 'sidorova@utmn.ru',
        carBrand: 'Kia Rio',
        licensePlate: 'С789СС72'
      },
      {
        id: 4,
        entryTime: '2026-01-19 11:30:12',
        fullName: 'Козлов Андрей Викторович',
        upn: 'kozlov@utmn.ru',
        carBrand: 'Hyundai Solaris',
        licensePlate: 'Е012ЕЕ72'
      },
      {
        id: 5,
        entryTime: '2026-01-19 12:15:55',
        fullName: 'Новиков Дмитрий Петрович',
        upn: 'novikov@utmn.ru',
        carBrand: 'Škoda Octavia',
        licensePlate: 'К345КК72'
      },
      {
        id: 6,
        entryTime: '2026-01-19 13:40:33',
        fullName: 'Морозова Елена Ивановна',
        upn: 'morozova@utmn.ru',
        carBrand: 'Mazda 6',
        licensePlate: 'М678ММ72'
      },
      {
        id: 7,
        entryTime: '2026-01-19 14:10:21',
        fullName: 'Волков Алексей Николаевич',
        upn: 'volkov@utmn.ru',
        carBrand: 'Nissan Qashqai',
        licensePlate: 'Н901НН72'
      },
      {
        id: 8,
        entryTime: '2026-01-19 14:55:47',
        fullName: 'Соколова Ольга Сергеевна',
        upn: 'sokolova@utmn.ru',
        carBrand: 'Renault Duster',
        licensePlate: 'О234ОО72'
      },
    ]
  };

  // Mock data for Parking K5
  const parkingK5: ParkingLot = {
    name: 'Парковка К5',
    currentCount: 6,
    totalCapacity: 40,
    records: [
      {
        id: 1,
        entryTime: '2026-01-19 08:30:15',
        fullName: 'Федоров Павел Анатольевич',
        upn: 'fedorov@utmn.ru',
        carBrand: 'BMW 3 Series',
        licensePlate: 'Р567РР72'
      },
      {
        id: 2,
        entryTime: '2026-01-19 09:45:28',
        fullName: 'Лебедев Игорь Владимирович',
        upn: 'lebedev@utmn.ru',
        carBrand: 'Audi A4',
        licensePlate: 'Т890ТТ72'
      },
      {
        id: 3,
        entryTime: '2026-01-19 11:20:42',
        fullName: 'Васильева Анна Дмитриевна',
        upn: 'vasilieva@utmn.ru',
        carBrand: 'Mercedes-Benz C-Class',
        licensePlate: 'У123УУ72'
      },
      {
        id: 4,
        entryTime: '2026-01-19 12:35:19',
        fullName: 'Михайлов Владимир Сергеевич',
        upn: 'mikhailov@utmn.ru',
        carBrand: 'Ford Focus',
        licensePlate: 'Х456ХХ72'
      },
      {
        id: 5,
        entryTime: '2026-01-19 13:15:37',
        fullName: 'Павлова Светлана Николаевна',
        upn: 'pavlova@utmn.ru',
        carBrand: 'Chevrolet Cruze',
        licensePlate: 'Ц789ЦЦ72'
      },
      {
        id: 6,
        entryTime: '2026-01-19 14:40:53',
        fullName: 'Егоров Максим Александрович',
        upn: 'egorov@utmn.ru',
        carBrand: 'Opel Astra',
        licensePlate: 'Ч012ЧЧ72'
      },
    ]
  };

  // Функция фильтрации
  const filterRecords = (records: ParkingRecord[], searchQuery: string) => {
    if (!searchQuery.trim()) return records;
    
    const query = searchQuery.toLowerCase();
    return records.filter(record => 
      record.fullName.toLowerCase().includes(query) ||
      record.licensePlate.toLowerCase().includes(query)
    );
  };

  const renderParkingBlock = (
    parking: ParkingLot, 
    searchQuery: string, 
    setSearchQuery: (value: string) => void,
    isExpanded: boolean,
    setIsExpanded: (value: boolean) => void
  ) => {
    const occupancyPercentage = (parking.currentCount / parking.totalCapacity) * 100;
    const isCrowded = occupancyPercentage > 80;
    const isModerate = occupancyPercentage > 50 && occupancyPercentage <= 80;
    
    const filteredRecords = filterRecords(parking.records, searchQuery);

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div 
          className="p-6"
          style={{ backgroundColor: '#00aeef' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Car size={24} style={{ color: '#00aeef' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{parking.name}</h3>
                <p className="text-blue-100 text-sm">Текущая загрузка парковки</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {parking.currentCount} / {parking.totalCapacity}
              </div>
              <div className="text-blue-100 text-sm">занято мест</div>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isCrowded 
                    ? 'bg-red-400' 
                    : isModerate 
                    ? 'bg-yellow-400' 
                    : 'bg-green-400'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-blue-100">
              <span>Свободно: {parking.totalCapacity - parking.currentCount}</span>
              <span>{occupancyPercentage.toFixed(1)}% загрузка</span>
            </div>
          </div>
        </div>

        {/* Панель управления */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Поиск */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО или ГРЗ..."
                className="pl-10"
              />
            </div>
            
            {/* Кнопка разворачивания */}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Свернуть таблицу
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Развернуть таблицу ({parking.records.length})
                </>
              )}
            </Button>
          </div>
          
          {/* Счетчик результатов поиска */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Найдено: <span className="font-semibold text-gray-900">{filteredRecords.length}</span> из {parking.records.length}
            </div>
          )}
        </div>

        {/* Table */}
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>Время заезда</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ФИО</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">UPN</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Марка автомобиля</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ГРЗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr 
                      key={record.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {record.entryTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.upn}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.carBrand}</td>
                      <td className="px-6 py-4 text-sm">
                        <span 
                          className="inline-block px-3 py-1 rounded font-mono font-semibold text-white"
                          style={{ backgroundColor: '#00aeef' }}
                        >
                          {record.licensePlate}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchQuery ? 'По вашему запросу ничего не найдено' : 'Нет припаркованных автомобилей'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Парковочная система</h2>
        <p className="text-gray-600 mt-2">Мониторинг загрузки и управление парковками университета</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#00aeef' }}
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Всего парковок</div>
              <div className="text-2xl font-bold text-gray-900">2</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500"
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Всего мест</div>
              <div className="text-2xl font-bold text-gray-900">
                {parkingK1.totalCapacity + parkingK5.totalCapacity}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500"
            >
              <Car size={24} className="text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Занято мест</div>
              <div className="text-2xl font-bold text-gray-900">
                {parkingK1.currentCount + parkingK5.currentCount} / {parkingK1.totalCapacity + parkingK5.totalCapacity}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parking K1 */}
      {renderParkingBlock(parkingK1, searchK1, setSearchK1, isK1Expanded, setIsK1Expanded)}

      {/* Parking K5 */}
      {renderParkingBlock(parkingK5, searchK5, setSearchK5, isK5Expanded, setIsK5Expanded)}
    </div>
  );
}
