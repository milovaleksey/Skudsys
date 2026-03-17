import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DaySchedule, PassEvent, ScheduleEvent } from './mockData';

export function DayTimelineVertical({ dayData, dateStr }: { dayData: DaySchedule, dateStr: string }) {
  const [hoveredEvent, setHoveredEvent] = useState<{ type: 'pass' | 'schedule', data: any, x: number, y: number } | null>(null);
  
  const timeToPixels = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60;
    const endMinutes = 23 * 60;
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
  
  const getLocationLabel = (pass: PassEvent) => {
    if (pass.locationType === 'uncontrolled') {
      return 'Неконтролируемая территория';
    }
    return pass.location;
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
    const result: { type: 'late' | 'early', event: ScheduleEvent, minutes?: number }[] = [];
    
    dayData.schedule.forEach(schedEvent => {
      const [startH, startM] = schedEvent.startTime.split(':').map(Number);
      const [endH, endM] = schedEvent.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      // Находим все проходы в нужную аудиторию
      const roomPasses = dayData.passes.filter(p => {
        if (p.locationType !== 'room' || !p.room) return false;
        if (!schedEvent.room.includes(p.room)) return false;
        
        // Проход должен быть в окне времени занятия (за 30 мин до начала и до конца)
        const passTime = getTimeFromDate(p.time);
        const [passH, passM] = passTime.split(':').map(Number);
        const passMinutes = passH * 60 + passM;
        
        // Допускаем приход за 30 минут до начала занятия
        const windowStart = startMinutes - 30;
        const windowEnd = endMinutes;
        
        return passMinutes >= windowStart && passMinutes <= windowEnd;
      });
      
      // Если нет проходов в аудиторию - не явился
      if (roomPasses.length === 0) {
        result.push({ type: 'late', event: schedEvent, minutes: 0 });
        return;
      }
      
      // Проверяем опоздание - первый вход в аудиторию
      const firstEntry = roomPasses[0];
      const entryTime = getTimeFromDate(firstEntry.time);
      const [entryH, entryM] = entryTime.split(':').map(Number);
      const entryMinutes = entryH * 60 + entryM;
      
      // Длительность занятия
      const lessonDuration = endMinutes - startMinutes;
      const lateMinutes = entryMinutes - startMinutes;
      
      // Опоздал более чем на 3 минуты
      if (entryMinutes > startMinutes + 3) {
        // Если опоздание больше половины занятия - считаем как "Не явился"
        if (lateMinutes > lessonDuration / 2) {
          result.push({ type: 'late', event: schedEvent, minutes: 0 });
        } else {
          result.push({ type: 'late', event: schedEvent, minutes: lateMinutes });
        }
      }
      
      // Проверяем ранний уход - вышел из здания или перешел в другое помещение
      const firstEntryIndex = dayData.passes.indexOf(firstEntry);
      const earlyExitPasses = dayData.passes.filter((p, idx) => {
        // Должен быть после входа в аудиторию
        if (idx <= firstEntryIndex) return false;
        
        const passTime = getTimeFromDate(p.time);
        const [h, m] = passTime.split(':').map(Number);
        const minutes = h * 60 + m;
        
        // Должен быть до окончания занятия
        if (minutes >= endMinutes) return false;
        
        // Вышел из здания (неконтролируемая территория)
        if (p.locationType === 'uncontrolled') return true;
        
        // Перешел в другое помещение (не та аудитория)
        if (p.locationType === 'room' && p.room && !schedEvent.room.includes(p.room)) return true;
        
        return false;
      });
      
      if (earlyExitPasses.length > 0) {
        const firstExit = earlyExitPasses[0];
        const exitTime = getTimeFromDate(firstExit.time);
        const [exitH, exitM] = exitTime.split(':').map(Number);
        const exitMinutes = exitH * 60 + exitM;
        
        result.push({ type: 'early', event: schedEvent, minutes: endMinutes - exitMinutes });
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
      const endPos = nextPass ? timeToPixels(getTimeFromDate(nextPass.time)) : 100;
      
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
      <div className="font-medium text-sm text-gray-900 mb-2 text-center">
        {formatShortDate(dateStr)}
      </div>
      
      <div className="relative flex" style={{ height: '500px', width: '100%' }}>
        <div className="relative" style={{ width: '40px', flexShrink: 0 }}>
          {violations.map((violation, idx) => {
            const startPos = timeToPixels(violation.event.startTime);
            const endPos = timeToPixels(violation.event.endTime);
            
            return (
              <div
                key={idx}
                className="absolute left-0 w-full flex items-center justify-center"
                style={{ top: `${startPos}%`, height: `${endPos - startPos}%` }}
              >
                <div 
                  className={`rounded-full p-1 shadow-lg ${
                    violation.type === 'early' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  title={violation.type === 'early' 
                    ? `Ушел на ${violation.minutes} мин раньше`
                    : violation.minutes ? `Опоздание ${violation.minutes} мин` : 'Не явился'}
                >
                  <AlertTriangle size={16} className="text-white" />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="relative flex-1">
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
                  right: '-8px',
                  backgroundColor: getScheduleColor(schedEvent.type),
                  borderColor: violation ? (violation.type === 'late' ? '#f44336' : '#ff9800') : 'rgba(0, 0, 0, 0.2)',
                  zIndex: 15
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
          
          <div className="absolute bg-gray-200 rounded-lg overflow-hidden" style={{ top: 0, bottom: 0, left: '12px', right: '12px', zIndex: 10 }}>
            {passSegments.map((segment, idx) => (
              <div
                key={idx}
                className="absolute left-0 w-full cursor-pointer transition-opacity hover:opacity-80 flex items-center justify-center px-2"
                style={{
                  top: `${segment.start}%`,
                  height: `${segment.end - segment.start}%`,
                  backgroundColor: segment.color
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
                {segment.end - segment.start > 5 && (
                  <span className="text-xs font-semibold text-white text-center leading-tight">
                    {getLocationLabel(segment.pass)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
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
              <div className="font-semibold text-sm mb-1">{getLocationLabel(hoveredEvent.data)}</div>
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
                    ? hoveredEvent.data.violation.minutes 
                      ? `⚠️ Опоздание на ${hoveredEvent.data.violation.minutes} мин`
                      : `⚠️ Не явился`
                    : `⚠️ Ушел раньше на ${hoveredEvent.data.violation.minutes} мин`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}