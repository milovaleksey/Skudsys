// Mock данные для отчета по преподавателям

export interface Teacher {
  id: string;
  name: string;
  department: string;
}

export interface PassEvent {
  time: string;
  location: string;
  locationType: 'building' | 'room' | 'uncontrolled';
  building?: string;
  room?: string;
}

export interface ScheduleEvent {
  startTime: string;
  endTime: string;
  title: string;
  room: string;
  type: 'lecture' | 'practice' | 'lab';
}

export interface DaySchedule {
  date: string;
  passes: PassEvent[];
  schedule: ScheduleEvent[];
}

export const generateMockTeachers = (): Teacher[] => [
  { id: '1', name: 'Иванов Иван Иванович', department: 'Институт математики и компьютерных наук' },
  { id: '2', name: 'Петрова Мария Сергеевна', department: 'Институт физики и технологий' },
  { id: '3', name: 'Сидоров Алексей Петрович', department: 'Институт химии' },
];

export const generateMockSchedule = (date: string): ScheduleEvent[] => {
  const dayOfWeek = new Date(date).getDay();
  
  if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
    return [
      { startTime: '08:00', endTime: '09:30', title: 'Методика переработки ядерного топлива', room: 'К1-301', type: 'lecture' },
      { startTime: '09:45', endTime: '11:15', title: 'Квантовая механика', room: 'К1-Т351', type: 'lecture' },
      { startTime: '13:00', endTime: '14:30', title: 'Лабораторная работа', room: 'К2-105', type: 'lab' },
    ];
  }
  
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return [
      { startTime: '10:00', endTime: '11:30', title: 'Практическое занятие', room: 'К1-205', type: 'practice' },
      { startTime: '12:00', endTime: '13:30', title: 'Консультация', room: 'К1-301', type: 'lecture' },
    ];
  }
  
  return [];
};

export const generateMockPasses = (date: string): PassEvent[] => {
  const baseTime = new Date(date);
  const dayOfWeek = baseTime.getDay();
  const passes: PassEvent[] = [];
  
  // Генерируем разные сценарии в зависимости от дня недели
  const scenario = dayOfWeek % 5;
  
  switch (scenario) {
    case 0: // Понедельник - ВСЕ ХОРОШО (пришел вовремя, был на всех занятиях)
      passes.push({
        time: new Date(baseTime.setHours(6, 30, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(7, 58, 0)).toISOString(),
        location: 'К1 Этаж 3 301',
        locationType: 'room',
        building: 'К1',
        room: '301'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 35, 0)).toISOString(),
        location: 'К1 Этаж 3 Коридор',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 43, 0)).toISOString(),
        location: 'К1 Этаж Т 351',
        locationType: 'room',
        building: 'К1',
        room: '351'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(11, 20, 0)).toISOString(),
        location: 'Неконтролируемая территория',
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
      
      passes.push({
        time: new Date(baseTime.setHours(14, 35, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      break;
      
    case 1: // Вторник - ОПОЗДАЛ НА 10 МИНУТ (но остался до конца)
      passes.push({
        time: new Date(baseTime.setHours(9, 30, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(10, 10, 0)).toISOString(),
        location: 'К1 Этаж 2 205',
        locationType: 'room',
        building: 'К1',
        room: '205'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(11, 32, 0)).toISOString(),
        location: 'К1 Этаж 2 Коридор',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(12, 0, 0)).toISOString(),
        location: 'К1 Этаж 3 301',
        locationType: 'room',
        building: 'К1',
        room: '301'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(13, 35, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      break;
      
    case 2: // Среда - ПРИШЕЛ ВОВРЕМЯ, НО УШЕЛ РАНШЕ (вышел из здания)
      passes.push({
        time: new Date(baseTime.setHours(7, 15, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(7, 59, 0)).toISOString(),
        location: 'К1 Этаж 3 301',
        locationType: 'room',
        building: 'К1',
        room: '301'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 10, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 40, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 44, 0)).toISOString(),
        location: 'К1 Этаж Т 351',
        locationType: 'room',
        building: 'К1',
        room: '351'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(11, 17, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      
      passes.push({
        time: new Date(baseTime.setHours(12, 50, 0)).toISOString(),
        location: 'Вход в корпус К2',
        locationType: 'building',
        building: 'К2'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(12, 57, 0)).toISOString(),
        location: 'К2 Этаж 1 105',
        locationType: 'room',
        building: 'К2',
        room: '105'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(14, 32, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      break;
      
    case 3: // Четверг - НЕ ЯВИЛСЯ НА ПЕРВОЕ ЗАНЯТИЕ
      passes.push({
        time: new Date(baseTime.setHours(11, 45, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(11, 59, 0)).toISOString(),
        location: 'К1 Этаж 3 301',
        locationType: 'room',
        building: 'К1',
        room: '301'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(13, 32, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      break;
      
    case 4: // ятница - ПЕРЕШЕЛ В ДРУГУЮ АУДИТОРИЮ (ушел раньше)
      passes.push({
        time: new Date(baseTime.setHours(7, 20, 0)).toISOString(),
        location: 'Вход в корпус К1',
        locationType: 'building',
        building: 'К1'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(8, 1, 0)).toISOString(),
        location: 'К1 Этаж 3 301',
        locationType: 'room',
        building: 'К1',
        room: '301'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 5, 0)).toISOString(),
        location: 'К1 Этаж 2 205',
        locationType: 'room',
        building: 'К1',
        room: '205'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(9, 42, 0)).toISOString(),
        location: 'К1 Этаж Т 351',
        locationType: 'room',
        building: 'К1',
        room: '351'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(11, 16, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      
      passes.push({
        time: new Date(baseTime.setHours(12, 55, 0)).toISOString(),
        location: 'Вход в корпус К2',
        locationType: 'building',
        building: 'К2'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(13, 2, 0)).toISOString(),
        location: 'К2 Этаж 1 105',
        locationType: 'room',
        building: 'К2',
        room: '105'
      });
      
      passes.push({
        time: new Date(baseTime.setHours(14, 31, 0)).toISOString(),
        location: 'Неконтролируемая территория',
        locationType: 'uncontrolled',
      });
      break;
  }
  
  return passes;
};