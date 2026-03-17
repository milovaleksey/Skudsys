import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DaySchedule, PassEvent, ScheduleEvent } from './mockData';

export function DayTimeline({ dayData }: { dayData: DaySchedule }) {
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
  
  return (
    <div className="relative">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>6:00</span>
        <span>9:00</span>
        <span>12:00</span>
        <span>15:00</span>
        <span>18:00</span>
        <span>21:00</span>
        <span>23:00</span>
      </div>
      
      {violations.length > 0 && (
        <div className="relative h-8 mb-6">
          {violations.map((violation, idx) => {
            const startPos = timeToPixels(violation.event.startTime);
            const endPos = timeToPixels(violation.event.endTime);
            
            return (
              <div
                key={idx}
                className="absolute top-0 h-full flex items-center justify-center px-2"
                style={{ left: `${startPos}%`, width: `${endPos - startPos}%` }}
              >
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${
                  violation.type === 'late' ? 'bg-red-500' : 'bg-orange-500'
                }`}>
                  <AlertTriangle size={14} />
                  <span>
                    {violation.type === 'late' 
                      ? `Опоздание ${violation.minutes} мин`
                      : `Ушел на ${violation.minutes} мин раньше`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="relative" style={{ height: '60px' }}>
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
              {segment.end - segment.start > 8 && (
                <span className="text-sm font-semibold text-white truncate">
                  {segment.pass.location}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {dayData.schedule.map((schedEvent, idx) => {
          const startPos = timeToPixels(schedEvent.startTime);
          const endPos = timeToPixels(schedEvent.endTime);
          const violation = violations.find(v => v.event === schedEvent);
          
          return (
            <div
              key={idx}
              className="absolute cursor-pointer"
              style={{
                left: `${startPos}%`,
                width: `${endPos - startPos}%`,
                top: '-32px',
                height: '28px',
                zIndex: 15
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
              <div 
                className="w-full h-full rounded-lg border-2 border-dashed flex items-center justify-center px-2"
                style={{
                  backgroundColor: getScheduleColor(schedEvent.type),
                  borderColor: violation ? (violation.type === 'late' ? '#f44336' : '#ff9800') : 'rgba(0, 0, 0, 0.3)',
                }}
              >
                <span className="text-xs font-semibold text-gray-800 truncate text-center">
                  {schedEvent.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
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