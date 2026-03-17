import { useState, useMemo } from 'react';
import { Download, Calendar, ChevronLeft, ChevronRight, User, Clock, AlertTriangle, CheckCircle, LayoutGrid, LayoutList } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { DayTimeline } from './teacher-report/DayTimeline';
import { DayTimelineVertical } from './teacher-report/DayTimelineVertical';
import { generateMockTeachers, generateMockSchedule, generateMockPasses, Teacher } from './teacher-report/mockData';

export function TeacherReportPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const teachers = useMemo(() => generateMockTeachers(), []);
  
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.department.toLowerCase().includes(query)
    );
  }, [searchQuery, teachers]);
  
  const displayDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(currentDate);
    
    if (viewMode === 'week') {
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
    } else {
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
  
  const teacherData = useMemo(() => {
    if (!selectedTeacher) return [];
    
    return displayDates.map(date => ({
      date,
      passes: generateMockPasses(date),
      schedule: generateMockSchedule(date)
    }));
  }, [selectedTeacher, displayDates]);
  
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
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-2" style={{ color: '#00aeef' }} />
              Период
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'week' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={viewMode === 'week' ? { backgroundColor: '#00aeef' } : {}}
              >
                Неделя
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'month' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={viewMode === 'month' ? { backgroundColor: '#00aeef' } : {}}
              >
                Месяц
              </button>
            </div>
          </div>
        </div>
        
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
      
      {selectedTeacher && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Легенда</h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode('horizontal')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'horizontal' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={layoutMode === 'horizontal' ? { backgroundColor: '#00aeef' } : {}}
              >
                <LayoutList size={18} />
                <span className="text-sm">Горизонтальный</span>
              </button>
              <button
                onClick={() => setLayoutMode('vertical')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  layoutMode === 'vertical' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={layoutMode === 'vertical' ? { backgroundColor: '#00aeef' } : {}}
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
              <div className="flex gap-4">
                <div className="flex flex-col justify-between text-xs text-gray-500" style={{ height: '500px', paddingTop: '32px' }}>
                  <span>6:00</span>
                  <span>9:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                  <span>21:00</span>
                  <span>23:00</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex gap-3">
                    {teacherData.map(dayData => (
                      <div key={dayData.date} className="flex-1">
                        <DayTimelineVertical dayData={dayData} dateStr={dayData.date} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-4 pl-12">
                <div className="flex-1 flex gap-3">
                  {teacherData.map(dayData => {
                    const date = new Date(dayData.date);
                    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                    return (
                      <div key={dayData.date} className="flex-1 text-center p-2 bg-gray-50 rounded-lg">
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