import { useState, useMemo } from 'react';
import { Download, Calendar, ChevronLeft, ChevronRight, User, Clock, AlertTriangle, CheckCircle, LayoutGrid, LayoutList } from 'lucide-react';
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
      case 'building': return '#4CAF50'; // Светло-зеленый - вход в корпус
      case 'room': return '#2E7D32'; // Темно-зеленый - помещение в корпусе
      case 'uncontrolled': return '#9E9E9E'; // Серый - не контролируемая территория
      default: return '#9E9E9E';
    }
  };
  
  const getScheduleColor = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'lecture': return 'rgba(156, 39, 176, 0.4)'; // Фиолетовый
      case 'practice': return 'rgba(33, 150, 243, 0.4)'; // Синий
      case 'lab': return 'rgba(255, 152, 0, 0.4)'; // Оранжевый
      default: return 'rgba(158, 158, 158, 0.4)';
    }
  };
  
  const getLocationLabel = (type: PassEvent['locationType']) => {
    switch (type) {
      case 'building': return 'Корпус';
      case 'room': return 'Аудитория';
      case 'uncontrolled': return 'Вне террито��ии';
      default: return '';
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
      
      {/* Нарушения над треком */}
      {violations.length > 0 && (
        <div className="relative h-8 mb-2">
          {violations.map((violation, idx) => {
            const startPos = timeToPixels(violation.event.startTime);
            const endPos = timeToPixels(violation.event.endTime);
            const width = endPos - startPos;
            
            return (
              <div
                key={idx}
                className="absolute top-0 h-full flex items-center justify-center px-2"
                style={{
                  left: `${startPos}%`,
                  width: `${width}%`,
                }}
              >
                <div 
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${
                    violation.type === 'late' ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                >
                  <AlertTriangle size={14} />
                  <span>
                    {violation.type === 'late' 
                      ? `Опоздание ${violation.minutes} мин`
                      : `Ушел на ${violation.minutes} мин раньше`
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Основной трек с обволакивающими мероприятиями */}
      <div className="relative" style={{ height: '60px' }}>
        {/* Расписание занятий (обволакивающие блоки) */}
        {dayData.schedule.map((schedEvent, idx) => {
          const startPos = timeToPixels(schedEvent.startTime);
          const endPos = timeToPixels(schedEvent.endTime);
          const violation = violations.find(v => v.event === schedEvent);
          
          return (
            <div
              key={idx}
              className="absolute cursor-pointer border-2 border-dashed rounded-lg"
              style={{
                left: `${startPos}%`,
                width: `${endPos - startPos}%`,
                top: '-8px',
                height: '76px',
                backgroundColor: getScheduleColor(schedEvent.type),
                borderColor: violation 
                  ? (violation.type === 'late' ? '#f44336' : '#ff9800')
                  : 'rgba(0, 0, 0, 0.2)',
                zIndex: 5
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
              {/* Название мероприятия внутри блока */}
              <div className="absolute inset-0 flex items-center justify-center px-2">
                <span className="text-sm font-semibold text-gray-800 truncate text-center">
                  {schedEvent.title}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Сегменты проходов (основной трек) */}
        <div className="absolute bg-gray-200 rounded-lg overflow-hidden" style={{ top: '12px', left: 0, right: 0, height: '48px', zIndex: 10 }}>
          {passSegments.map((segment, idx) => (
            <div
              key={idx}
              className="absolute top-0 h-full cursor-pointer transition-opacity hover:opacity-80 flex items-center px-3"
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
            >
              {/* Текст внутри сегмента - полное название зоны */}
              {segment.end - segment.start > 8 && ( // По��азываем текст только если сегмент достаточно широкий
                <span className="text-sm font-semibold text-white truncate">
                  {segment.pass.location}
                </span>
              )}
            </div>
          ))}
        </div>
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

// Вертикальный компонент временной шкалы для одного дня
function DayTimelineVertical({ dayData, dateStr }: { dayData: DaySchedule, dateStr: string }) {
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
      case 'building': return '#4CAF50';
      case 'room': return '#2E7D32';
      case 'uncontrolled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };
  
  const getScheduleColor = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'lecture': return 'rgba(156, 39, 176, 0.4)';
      case 'practice': return 'rgba(33, 150, 243, 0.4)';
      case 'lab': return 'rgba(255, 152, 0, 0.4)';
      default: return 'rgba(158, 158, 158, 0.4)';
    }
  };
  
  const violations = useMemo(() => {
    const result: { type: 'late' | 'early', event: ScheduleEvent, minutes: number }[] = [];
    
    dayData.schedule.forEach(schedEvent => {
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
      
      if (entryMinutes > startMinutes + 3) {
        result.push({
          type: 'late',
          event: schedEvent,
          minutes: entryMinutes - startMinutes
        });
      }
      
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
  
  const passSegments = useMemo(() => {
    const segments: { start: number, end: number, color: string, pass: PassEvent }[] = [];
    
    for (let i = 0; i < dayData.passes.length; i++) {
      const currentPass = dayData.passes[i];
      const nextPass = dayData.passes[i + 1];
      
      const startPos = timeToPixels(getTimeFromDate(currentPass.time));
      const endPos = nextPass 
        ? timeToPixels(getTimeFromDate(nextPass.time))
        : 100;
      
      segments.push({
        start: startPos,
        end: endPos,
        color: getLocationColor(currentPass.locationType),
        pass: currentPass
      });
    }
    
    return segments;
  }, [dayData.passes]);
  
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  };
  
  return (
    <div className="flex flex-col items-center">
      {/* Заголовок дня */}
      <div className="font-medium text-sm text-gray-900 mb-2 text-center">
        {formatShortDate(dateStr)}
      </div>
      
      {/* Вертикальный трек */}
      <div className="relative flex" style={{ height: '500px', width: '100px' }}>
        {/* Нарушения слева от трека */}
        {violations.length > 0 && (
          <div className="relative mr-2" style={{ width: '30px' }}>
            {violations.map((violation, idx) => {
              const startPos = timeToPixels(violation.event.startTime);
              const endPos = timeToPixels(violation.event.endTime);
              const height = endPos - startPos;
              
              return (
                <div
                  key={idx}
                  className="absolute left-0 w-full flex items-center justify-center"
                  style={{
                    top: `${startPos}%`,
                    height: `${height}%`,
                  }}
                >
                  <div 
                    className={`rounded-full p-1 shadow-lg ${
                      violation.type === 'late' ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    title={violation.type === 'late' 
                      ? `Опоздание ${violation.minutes} мин`
                      : `Ушел на ${violation.minutes} мин раньше`}
                  >
                    <AlertTriangle size={16} className="text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Основной трек */}
        <div className="relative" style={{ width: '60px' }}>
          {/* Расписание (обволакивающие блоки) */}
          {dayData.schedule.map((schedEvent, idx) => {
            const startPos = timeToPixels(schedEvent.startTime);
            const endPos = timeToPixels(schedEvent.endTime);
            const violation = violations.find(v => v.event === schedEvent);
            
            return (
              <div
                key={idx}
                className="absolute cursor-pointer border-2 border-dashed rounded-lg"
                style={{
                  top: `${startPos}%`,
                  height: `${endPos - startPos}%`,
                  left: '-8px',
                  width: '76px',
                  backgroundColor: getScheduleColor(schedEvent.type),
                  borderColor: violation 
                    ? (violation.type === 'late' ? '#f44336' : '#ff9800')
                    : 'rgba(0, 0, 0, 0.2)',
                  zIndex: 5
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredEvent({
                    type: 'schedule',
                    data: { ...schedEvent, violation },
                    x: rect.right + 10,
                    y: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredEvent(null)}
              />
            );
          })}
          
          {/* Сегменты проходов */}
          <div className="absolute bg-gray-200 rounded-lg overflow-hidden" style={{ top: 0, bottom: 0, left: '12px', width: '48px', zIndex: 10 }}>
            {passSegments.map((segment, idx) => (
              <div
                key={idx}
                className="absolute left-0 w-full cursor-pointer transition-opacity hover:opacity-80 flex items-center justify-center px-1"
                style={{
                  top: `${segment.start}%`,
                  height: `${segment.end - segment.start}%`,
                  backgroundColor: segment.color,
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed'
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredEvent({
                    type: 'pass',
                    data: segment.pass,
                    x: rect.right + 10,
                    y: rect.top + rect.height / 2
                  });
                }}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {segment.end - segment.start > 8 && (
                  <span className="text-xs font-semibold text-white transform rotate-180">
                    {segment.pass.location}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-white border-2 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none"
          style={{
            left: hoveredEvent.x,
            top: hoveredEvent.y,
            transform: 'translateY(-50%)',
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
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const teachers = useMemo(() => generateMockTeachers(), []);
  
  // Фильтрация преподавателей по поисковому запросу
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.department.toLowerCase().includes(query)
    );
  }, [searchQuery, teachers]);
  
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
      XLSX.utils.book_append_sheet(wb, ws, 'Отчет по препода��ателю');
      
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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#00aeef' } as any}
                placeholder="Поиск..."
              />
              {showDropdown && filteredTeachers.length > 0 && (
                <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-b-lg shadow-md z-10 max-h-40 overflow-y-auto">
                  {filteredTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setSearchQuery(teacher.name);
                        setShowDropdown(false);
                      }}
                    >
                      {teacher.name} ({teacher.department})
                    </div>
                  ))}
                </div>
              )}
            </div>
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
      
      {/* Легенда и переключатель вида */}
      {selectedTeacher && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Легенда</h3>
            
            {/* Переключатель вида */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode('horizontal')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'horizontal'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={layoutMode === 'horizontal' ? { backgroundColor: '#00aeef' } : {}}
                title="Горизонтальный вид"
              >
                <LayoutList size={18} />
                <span className="text-sm">Горизонтальный</span>
              </button>
              <button
                onClick={() => setLayoutMode('vertical')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'vertical'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={layoutMode === 'vertical' ? { backgroundColor: '#00aeef' } : {}}
                title="Вертикальный вид"
              >
                <LayoutGrid size={18} />
                <span className="text-sm">Вертикальный</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
              <span className="text-sm text-gray-700">Вход в корпус</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#2E7D32' }}></div>
              <span className="text-sm text-gray-700">Помещение</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: '#9E9E9E' }}></div>
              <span className="text-sm text-gray-700">Вне территории</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-dashed border-purple-500" style={{ backgroundColor: 'rgba(156, 39, 176, 0.3)' }}></div>
              <span className="text-sm text-gray-700">Расписание</span>
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
          
          {layoutMode === 'horizontal' ? (
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
          ) : (
            <div>
              {/* Временная шкала слева */}
              <div className="flex gap-4">
                {/* Временные метки */}
                <div className="flex flex-col justify-between text-xs text-gray-500" style={{ height: '500px', paddingTop: '32px' }}>
                  <span>6:00</span>
                  <span>9:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                  <span>21:00</span>
                  <span>23:00</span>
                </div>
                
                {/* Дни в виде колонок */}
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {teacherData.map(dayData => (
                    <DayTimelineVertical key={dayData.date} dayData={dayData} dateStr={dayData.date} />
                  ))}
                </div>
              </div>
              
              {/* Статистика снизу */}
              <div className="mt-6 grid grid-cols-3 md:grid-cols-7 gap-3">
                {teacherData.map(dayData => {
                  const date = new Date(dayData.date);
                  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                  return (
                    <div key={dayData.date} className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs font-semibold text-gray-700 mb-1">
                        {days[date.getDay()]} {date.getDate()}
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-gray-600">
                        <span>{dayData.schedule.length} занятий</span>
                        <span>{dayData.passes.length} проходов</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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