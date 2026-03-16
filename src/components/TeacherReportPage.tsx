import { useState, useMemo } from 'react';
import { Download, Calendar, ChevronLeft, ChevronRight, User, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Типы данных
interface PassEvent {
  time: string; // ISO format
  location: string;
  locationType: 'building' | 'room' | 'uncontrolled';
  building?: string;
  room?: string;
}

interface ScheduleEvent {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  room: string;
  type: 'lecture' | 'practice' | 'lab';
}

interface DaySchedule {
  date: string; // YYYY-MM-DD
  passes: PassEvent[];
  schedule: ScheduleEvent[];
}

interface Teacher {
  id: string;
  name: string;
  department: string;
}

// Генерация mock данных
const generateMockTeachers = (): Teacher[] => [
  { id: '1', name: 'Иванов Иван Иванович', department: 'Институт математики и компьютерных наук' },
  { id: '2', name: 'Петрова Мария Сергеевна', department: 'Институт физики и технологий' },
  { id: '3', name: 'Сидоров Алексей Петрович', department: 'Институт химии' },
];

const generateMockSchedule = (date: string): ScheduleEvent[] => {
  const dayOfWeek = new Date(date).getDay();
  
  // Пн, Ср, Пт
  if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
    return [
      { startTime: '08:00', endTime: '09:30', title: 'Методика переработки ядерного топлива', room: 'К1-301', type: 'lecture' },
      { startTime: '09:45', endTime: '11:15', title: 'Квантовая механика', room: 'К1-Т351', type: 'lecture' },
      { startTime: '13:00', endTime: '14:30', title: 'Лабораторная работа', room: 'К2-105', type: 'lab' },
    ];
  }
  
  // Вт, Чт
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return [
      { startTime: '10:00', endTime: '11:30', title: 'Практическое занятие', room: 'К1-205', type: 'practice' },
      { startTime: '12:00', endTime: '13:30', title: 'Консультация', room: 'К1-301', type: 'lecture' },
    ];
  }
  
  return [];
};

const generateMockPasses = (date: string): PassEvent[] => {
  const baseTime = new Date(date);
  const passes: PassEvent[] = [];
  
  // Приход в университет
  passes.push({
    time: new Date(baseTime.setHours(6, 12, 0)).toISOString(),
    location: 'Вход в корпус К1',
    locationType: 'building',
    building: 'К1'
  });
  
  // Вход в аудиторию перед первой лекцией (может быть с опозданием)
  const isLate = Math.random() > 0.7; // 30% шанс опоздания
  const lateMinutes = isLate ? Math.floor(Math.random() * 15) + 3 : 0;
  passes.push({
    time: new Date(baseTime.setHours(7, 59 + lateMinutes, 0)).toISOString(),
    location: 'К1 Этаж 3 301',
    locationType: 'room',
    building: 'К1',
    room: '301'
  });
  
  // Выход из аудитории после первой лекции
  const leftEarly = Math.random() > 0.8; // 20% шанс уйти раньше
  const earlyMinutes = leftEarly ? Math.floor(Math.random() * 10) + 5 : 0;
  passes.push({
    time: new Date(baseTime.setHours(9, 30 - earlyMinutes, 0)).toISOString(),
    location: 'К1 Этаж 3',
    locationType: 'uncontrolled',
    building: 'К1'
  });
  
  // Вход в другую аудиторию
  passes.push({
    time: new Date(baseTime.setHours(9, 34, 0)).toISOString(),
    location: 'К1 Этаж Т 351',
    locationType: 'room',
    building: 'К1',
    room: '351'
  });
  
  // Обеденный перерыв - выход из корпуса
  passes.push({
    time: new Date(baseTime.setHours(11, 20, 0)).toISOString(),
    location: 'Выход из корпуса К1',
    locationType: 'uncontrolled',
  });
  
  passes.push({
    time: new Date(baseTime.setHours(12, 45, 0)).toISOString(),
    location: 'Вход в корпус К2',
    locationType: 'building',
    building: 'К2'
  });
  
  passes.push({
    time: new Date(baseTime.setHours(12, 58, 0)).toISOString(),
    location: 'К2 Этаж 1 105',
    locationType: 'room',
    building: 'К2',
    room: '105'
  });
  
  // Конец рабочего дня
  passes.push({
    time: new Date(baseTime.setHours(14, 35, 0)).toISOString(),
    location: 'Выход из корпуса К2',
    locationType: 'uncontrolled',
  });
  
  return passes;
};

// Компонент временной шкалы для одного дня
function DayTimeline({ dayData }: { dayData: DaySchedule }) {
  const [hoveredEvent, setHoveredEvent] = useState<{ type: 'pass' | 'schedule', data: any, x: number, y: number } | null>(null);
  
  const timeToPixels = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    // 6:00 = 0px, 23:00 = 100%
    const startMinutes = 6 * 60; // 6:00
    const endMinutes = 23 * 60; // 23:00
    const rangeMinutes = endMinutes - startMinutes;
    return ((totalMinutes - startMinutes) / rangeMinutes) * 100;
  };
  
  const getTimeFromDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const getLocationColor = (type: PassEvent['locationType']) => {
    switch (type) {
      case 'building': return '#4CAF50'; // Зеленый - вход в корпус
      case 'room': return '#FF5722'; // Красно-оранжевый - аудитория
      case 'uncontrolled': return '#9E9E9E'; // Серый - не контролируемая территория
      default: return '#9E9E9E';
    }
  };
  
  const getScheduleColor = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'lecture': return 'rgba(156, 39, 176, 0.3)'; // Фиолетовый
      case 'practice': return 'rgba(33, 150, 243, 0.3)'; // Синий
      case 'lab': return 'rgba(255, 152, 0, 0.3)'; // Оранжевый
      default: return 'rgba(158, 158, 158, 0.3)';
    }
  };
  
  // Определение нарушений расписания
  const violations = useMemo(() => {
    const result: { type: 'late' | 'early', event: ScheduleEvent, minutes: number }[] = [];
    
    dayData.schedule.forEach(schedEvent => {
      // Находим проходы в нужную аудиторию
      const roomPasses = dayData.passes.filter(p => 
        p.locationType === 'room' && p.room && schedEvent.room.includes(p.room)
      );
      
      if (roomPasses.length === 0) return;
      
      const firstEntry = roomPasses[0];
      const entryTime = getTimeFromDate(firstEntry.time);
      const [entryH, entryM] = entryTime.split(':').map(Number);
      const [startH, startM] = schedEvent.startTime.split(':').map(Number);
      const [endH, endM] = schedEvent.endTime.split(':').map(Number);
      
      const entryMinutes = entryH * 60 + entryM;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      // Опоздание (пришел позже чем на 3 минуты после начала)
      if (entryMinutes > startMinutes + 3) {
        result.push({
          type: 'late',
          event: schedEvent,
          minutes: entryMinutes - startMinutes
        });
      }
      
      // Ранний уход (ушел раньше чем за 5 минут до конца)
      const exitPasses = dayData.passes.filter((p, idx) => {
        const passTime = getTimeFromDate(p.time);
        const [h, m] = passTime.split(':').map(Number);
        const minutes = h * 60 + m;
        return minutes > startMinutes && minutes < endMinutes && 
               p.locationType !== 'room' && 
               idx > dayData.passes.indexOf(firstEntry);
      });
      
      if (exitPasses.length > 0) {
        const lastExit = exitPasses[exitPasses.length - 1];
        const exitTime = getTimeFromDate(lastExit.time);
        const [exitH, exitM] = exitTime.split(':').map(Number);
        const exitMinutes = exitH * 60 + exitM;
        
        if (exitMinutes < endMinutes - 5) {
          result.push({
            type: 'early',
            event: schedEvent,
            minutes: endMinutes - exitMinutes
          });
        }
      }
    });
    
    return result;
  }, [dayData]);
  
  // Создание визуальных сегментов для проходов
  const passSegments = useMemo(() => {
    const segments: { start: number, end: number, color: string, pass: PassEvent }[] = [];
    
    for (let i = 0; i < dayData.passes.length; i++) {
      const currentPass = dayData.passes[i];
      const nextPass = dayData.passes[i + 1];
      
      const startPos = timeToPixels(getTimeFromDate(currentPass.time));
      const endPos = nextPass 
        ? timeToPixels(getTimeFromDate(nextPass.time))
        : 100; // До конца дня
      
      segments.push({
        start: startPos,
        end: endPos,
        color: getLocationColor(currentPass.locationType),
        pass: currentPass
      });
    }
    
    return segments;
  }, [dayData.passes]);
  
  return (
    <div className="relative">
      {/* Временная ось */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>6:00</span>
        <span>9:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
        <span>21:00</span>
        <span>23:00</span>
      </div>
      
      {/* Основной трек */}
      <div className="relative h-16 bg-gray-200 rounded-lg overflow-hidden">
        {/* Сегменты проходов */}
        {passSegments.map((segment, idx) => (
          <div
            key={idx}
            className="absolute top-0 h-full cursor-pointer transition-opacity hover:opacity-80"
            style={{
              left: `${segment.start}%`,
              width: `${segment.end - segment.start}%`,
              backgroundColor: segment.color
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredEvent({
                type: 'pass',
                data: segment.pass,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }}
            onMouseLeave={() => setHoveredEvent(null)}
          />
        ))}
        
        {/* Расписание занятий (полупрозрачное наложение) */}
        {dayData.schedule.map((schedEvent, idx) => {
          const startPos = timeToPixels(schedEvent.startTime);
          const endPos = timeToPixels(schedEvent.endTime);
          const violation = violations.find(v => v.event === schedEvent);
          
          return (
            <div
              key={idx}
              className="absolute top-0 h-full cursor-pointer border-2 border-dashed"
              style={{
                left: `${startPos}%`,
                width: `${endPos - startPos}%`,
                backgroundColor: getScheduleColor(schedEvent.type),
                borderColor: violation 
                  ? (violation.type === 'late' ? '#f44336' : '#ff9800')
                  : 'transparent',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredEvent({
                  type: 'schedule',
                  data: { ...schedEvent, violation },
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              {/* Индикатор нарушения */}
              {violation && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <AlertTriangle size={12} className="text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-white border-2 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
          style={{
            left: hoveredEvent.x,
            top: hoveredEvent.y - 10,
            transform: 'translate(-50%, -100%)',
            borderColor: '#00aeef'
          }}
        >
          {hoveredEvent.type === 'pass' ? (
            <div>
              <div className="font-semibold text-sm mb-1">{hoveredEvent.data.location}</div>
              <div className="text-xs text-gray-600">
                Время: {getTimeFromDate(hoveredEvent.data.time)}
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#9c27b0' }}>
                {hoveredEvent.data.title}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {hoveredEvent.data.startTime} - {hoveredEvent.data.endTime}
              </div>
              <div className="text-xs text-gray-600">
                Аудитория: {hoveredEvent.data.room}
              </div>
              {hoveredEvent.data.violation && (
                <div className={`text-xs font-semibold mt-2 ${
                  hoveredEvent.data.violation.type === 'late' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {hoveredEvent.data.violation.type === 'late' 
                    ? `⚠️ Опоздание на ${hoveredEvent.data.violation.minutes} мин`
                    : `⚠️ Ушел раньше на ${hoveredEvent.data.violation.minutes} мин`
                  }
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TeacherReportPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const teachers = useMemo(() => generateMockTeachers(), []);
  
  // Получение дат для отображения
  const displayDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(currentDate);
    
    if (viewMode === 'week') {
      // Начало недели (понедельник)
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else {
      // Месяц
      const year = start.getFullYear();
      const month = start.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  }, [currentDate, viewMode]);
  
  // Генерация данных для выбранного преподавателя
  const teacherData = useMemo(() => {
    if (!selectedTeacher) return [];
    
    return displayDates.map(date => ({
      date,
      passes: generateMockPasses(date),
      schedule: generateMockSchedule(date)
    }));
  }, [selectedTeacher, displayDates]);
  
  // Навигация
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Экспорт в Excel
  const handleExportExcel = () => {
    if (!selectedTeacher || teacherData.length === 0) {
      toast.error('Нет данных для экспорта');
      return;
    }
    
    try {
      const exportData: any[] = [];
      
      teacherData.forEach(day => {
        day.passes.forEach(pass => {
          exportData.push({
            'Дата': day.date,
            'Время': new Date(pass.time).toLocaleTimeString('ru-RU'),
            'Местоположение': pass.location,
            'Тип': pass.locationType === 'building' ? 'Корпус' :
                   pass.locationType === 'room' ? 'Аудитория' : 'Вне территории'
          });
        });
        
        day.schedule.forEach(sched => {
          exportData.push({
            'Дата': day.date,
            'Время': `${sched.startTime} - ${sched.endTime}`,
            'Мероприятие': sched.title,
            'Аудитория': sched.room,
            'Тип': sched.type === 'lecture' ? 'Лекция' :
                   sched.type === 'practice' ? 'Практика' : 'Лаб. работа'
          });
        });
      });
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Отчет по преподавателю');
      
      const filename = `Отчет_${selectedTeacher.name}_${currentDate.toLocaleDateString('ru-RU')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success('Отчет успешно выгружен');
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      toast.error('Ошибка при экспорте');
    }
  };
  
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' });
    return `${dayName}, ${day} ${month}`;
  };
  
  const getPeriodTitle = () => {
    if (viewMode === 'week') {
      const start = new Date(displayDates[0]);
      const end = new Date(displayDates[displayDates.length - 1]);
      return `${start.toLocaleDateString('ru-RU')} - ${end.toLocaleDateString('ru-RU')}`;
    } else {
      return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Отчет по преподавателям</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            disabled={!selectedTeacher}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00aeef' }}
          >
            <Download size={18} />
            <span>Экспорт в Excel</span>
          </button>
        </div>
      </div>
      
      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Выбор преподавателя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" style={{ color: '#00aeef' }} />
              Выберите преподавателя
            </label>
            <select
              value={selectedTeacher?.id || ''}
              onChange={(e) => {
                const teacher = teachers.find(t => t.id === e.target.value);
                setSelectedTeacher(teacher || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#00aeef' } as any}
            >
              <option value="">-- Выберите преподавателя --</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.department})
                </option>
              ))}
            </select>
          </div>
          
          {/* Режим просмотра */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-2" style={{ color: '#00aeef' }} />
              Период
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={viewMode === 'week' ? { backgroundColor: '#00aeef' } : {}}
              >
                Неделя
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={viewMode === 'month' ? { backgroundColor: '#00aeef' } : {}}
              >
                Месяц
              </button>
            </div>
          </div>
        </div>
        
        {/* Навигация по датам */}
        {selectedTeacher && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
              Предыдущий
            </button>
            
            <div className="text-lg font-semibold text-gray-900">
              {getPeriodTitle()}
            </div>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Следующий
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      
      {/* Легенда */}
      {selectedTeacher && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Легенда</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
              <span className="text-sm text-gray-700">Вход в корпус</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#FF5722' }}></div>
              <span className="text-sm text-gray-700">Аудитория</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#9E9E9E' }}></div>
              <span className="text-sm text-gray-700">Вне территории</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-dashed border-purple-500" style={{ backgroundColor: 'rgba(156, 39, 176, 0.3)' }}></div>
              <span className="text-sm text-gray-700">Расписание (лекция)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-red-500">
                <AlertTriangle size={14} className="text-white" />
              </div>
              <span className="text-sm text-gray-700">Нарушение</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Треки проходов */}
      {selectedTeacher ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            График активности: {selectedTeacher.name}
          </h3>
          
          <div className="space-y-6">
            {teacherData.map(dayData => (
              <div key={dayData.date} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {formatDateHeader(dayData.date)}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {dayData.schedule.length} занятий
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      {dayData.passes.length} проходов
                    </span>
                  </div>
                </div>
                <DayTimeline dayData={dayData} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <User size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Выберите преподавателя для просмотра отчета</p>
        </div>
      )}
    </div>
  );
}