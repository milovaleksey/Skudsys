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
  const passes: PassEvent[] = [];
  
  passes.push({
    time: new Date(baseTime.setHours(6, 12, 0)).toISOString(),
    location: 'Вход в корпус К1',
    locationType: 'building',
    building: 'К1'
  });
  
  const isLate = Math.random() > 0.7;
  const lateMinutes = isLate ? Math.floor(Math.random() * 15) + 3 : 0;
  passes.push({
    time: new Date(baseTime.setHours(7, 59 + lateMinutes, 0)).toISOString(),
    location: 'К1 Этаж 3 301',
    locationType: 'room',
    building: 'К1',
    room: '301'
  });
  
  const leftEarly = Math.random() > 0.8;
  const earlyMinutes = leftEarly ? Math.floor(Math.random() * 10) + 5 : 0;
  passes.push({
    time: new Date(baseTime.setHours(9, 30 - earlyMinutes, 0)).toISOString(),
    location: 'К1 Этаж 3',
    locationType: 'uncontrolled',
    building: 'К1'
  });
  
  passes.push({
    time: new Date(baseTime.setHours(9, 34, 0)).toISOString(),
    location: 'К1 Этаж Т 351',
    locationType: 'room',
    building: 'К1',
    room: '351'
  });
  
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
  
  passes.push({
    time: new Date(baseTime.setHours(14, 35, 0)).toISOString(),
    location: 'Выход из корпуса К2',
    locationType: 'uncontrolled',
  });
  
  return passes;
};
