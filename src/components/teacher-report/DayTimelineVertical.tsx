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
    const result: { type: 'late' | 'early' | 'warning', event: ScheduleEvent, minutes?: number }[] = [];
    
    dayData.schedule.forEach(schedEvent => {
      const [startH, startM] = schedEvent.startTime.split(':').map(Number);
      const [endH, endM] = schedEvent.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      const roomPasses = dayData.passes.filter(p => 
        p.locationType === 'room' && p.room && schedEvent.room.includes(p.room)
      );
      
      // Проверяем, был ли человек в корпусе во время мероприятия
      const buildingPasses = dayData.passes.filter(p => {
        const passTime = getTimeFromDate(p.time);
        const [h, m] = passTime.split(':').map(Number);
        const minutes = h * 60 + m;
        return (p.locationType === 'building' || p.locationType === 'room') && 
               minutes >= startMinutes && minutes <= endMinutes;
      });
      
      // Если нет проходов в аудиторию
      if (roomPasses.length === 0) {
        // Если не было вообще нигде (ни в корпусе, ни в аудитории) - это опоздание/не явка
        if (buildingPasses.length === 0) {
          const lateMinutes = 0; // Можно вычислить по первому появлению после начала
          result.push({ type: 'late', event: schedEvent, minutes: lateMinutes });
        } else {
          // Был в корпусе, но не зафиксирован вход в аудиторию - предупреждение
          result.push({ type: 'warning', event: schedEvent });
        }
        return;
      }
      
      const firstEntry = roomPasses[0];
      const entryTime = getTimeFromDate(firstEntry.time);
      const [entryH, entryM] = entryTime.split(':').map(Number);
      
      const entryMinutes = entryH * 60 + entryM;
      
      // Опоздание - зашел в аудиторию позже чем за 3 минуты после начала
      if (entryMinutes > startMinutes + 3) {
        result.push({ type: 'late', event: schedEvent, minutes: entryMinutes - startMinutes });
      }
      
      // Проверка на ранний уход - вышел на неконтролируемую территорию
      const exitPasses = dayData.passes.filter((p, idx) => {
        const passTime = getTimeFromDate(p.time);
        const [h, m] = passTime.split(':').map(Number);
        const minutes = h * 60 + m;
        return minutes > startMinutes && minutes < endMinutes && 
               p.locationType === 'uncontrolled' && 
               idx > dayData.passes.indexOf(firstEntry);
      });
      
      if (exitPasses.length > 0) {
        const lastExit = exitPasses[exitPasses.length - 1];
        const exitTime = getTimeFromDate(lastExit.time);
        const [exitH, exitM] = exitTime.split(':').map(Number);
        const exitMinutes = exitH * 60 + exitM;
        
        if (exitMinutes < endMinutes - 5) {
          result.push({ type: 'early', event: schedEvent, minutes: endMinutes - exitMinutes });
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
                  className={`rounded-full p-1 shadow-lg ${\n                    violation.type === 'early' ? 'bg-red-500' : \n                    violation.type === 'late' ? 'bg-yellow-500' : 'bg-blue-500'\n                  }`}\n                  title={violation.type === 'early' \n                    ? `Ушел на ${violation.minutes} мин раньше`\n                    : violation.type === 'late' \n                      ? violation.minutes ? `Опоздание ${violation.minutes} мин` : 'Не явился'\n                      : 'Не был в аудитории'}
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
                  hoveredEvent.data.violation.type === 'late' ? 'text-red-600' : 
                  hoveredEvent.data.violation.type === 'early' ? 'text-orange-600' : 'text-yellow-600'
                }`}>
                  {hoveredEvent.data.violation.type === 'late' 
                    ? `⚠️ Опоздание на ${hoveredEvent.data.violation.minutes} мин`
                    : hoveredEvent.data.violation.type === 'early' 
                      ? `⚠️ Ушел раньше на ${hoveredEvent.data.violation.minutes} мин`
                      : '⚠️ Не был в аудитории'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}