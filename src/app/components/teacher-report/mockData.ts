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
  
  // Понедельник, среда, пятница - 3 занятия
  if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
    return [
      { startTime: '08:00', endTime: '09:30', title: 'Методика переработки ядерного топлива', room: 'К1-301', type: 'lecture' },
      { startTime: '09:45', endTime: '11:15', title: 'Квантовая механика', room: 'К1-Т351', type: 'lecture' },
      { startTime: '13:00', endTime: '14:30', title: 'Лабораторная работа', room: 'К2-105', type: 'lab' },
    ];
  }
  
  // Вторник, четверг - 2 занятия
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return [
      { startTime: '10:00', endTime: '11:30', title: 'Практическое занятие', room: 'К1-205', type: 'practice' },
      { startTime: '12:00', endTime: '13:30', title: 'Консультация', room: 'К1-301', type: 'lecture' },
    ];
  }
  
  // Суббота - 1 занятие
  if (dayOfWeek === 6) {
    return [
      { startTime: '09:00', endTime: '10:30', title: 'Дополнительное занятие', room: 'К1-401', type: 'practice' },
    ];
  }
  
  return [];
};

export const generateMockPasses = (date: string): PassEvent[] => {
  const baseTime = new Date(date);
  const dayOfWeek = baseTime.getDay();
  const passes: PassEvent[] = [];
  
  // Получаем день месяца для выбора сценария
  const dayOfMonth = baseTime.getDate();
  // Комбинируем день недели и день месяца для большего разнообразия
  const scenario = (dayOfWeek * 10 + dayOfMonth) % 12;
  
  switch (scenario) {
    case 0: // ВСЕ ОТЛИЧНО - пришел вовремя на все занятия
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(7, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(7, 58, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 45, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(9, 45, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 58, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(11, 58, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 1: // ОПОЗДАНИЕ 5 МИНУТ на первое занятие
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(8, 0, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 5, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 55, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(10, 0, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 5, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 2: // ОПОЗДАНИЕ 15 МИНУТ на второе занятие
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(7, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(7, 58, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Кори��ор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 0, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(9, 50, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 58, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 ��таж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 15, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 3: // ОПОЗДАНИЕ 30 МИНУТ (треть 90-минутного занятия)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(8, 25, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 30, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(10, 25, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 30, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 4: // ОПОЗДАНИЕ 50 МИНУТ (больше половины) - должно показать "Не явился"
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(8, 45, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 50, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(10, 45, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 50, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 5: // РАННИЙ УХОД на 20 минут
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(7, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(7, 58, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 10, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(9, 40, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(9, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 58, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 10, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(11, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 6: // НЕ ЯВИЛСЯ на первое занятие
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(9, 40, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(11, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 7: // ПЕРЕШЕЛ В ДРУГУЮ АУДИТОРИЮ (ушел раньше)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(7, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(7, 58, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 0, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(9, 40, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(9, 55, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 58, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 8: // ОПОЗДАНИЕ + РАННИЙ УХОД (комбо нарушений)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(8, 15, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 20, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 15, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(10, 0, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 5, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 0, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролир��емая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(10, 20, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 25, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 15, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 10, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 15, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 15, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 9: // НЕ ЯВИЛСЯ на все занятия (но есть проходы в здание)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(10, 0, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 15, 0)).toISOString(), location: 'К1 Этаж 1 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(11, 0, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(11, 15, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(13, 0, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 10: // ОПОЗДАНИЕ ровно на ПОЛОВИНУ занятия (граничный случай - 45 мин)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
        passes.push({ time: new Date(baseTime.setHours(8, 40, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 45, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(9, 35, 0)).toISOString(), location: 'К1 Этаж 3 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(9, 43, 0)).toISOString(), location: 'К1 Этаж Т 351', locationType: 'room', building: 'К1', room: '351' });
        passes.push({ time: new Date(baseTime.setHours(11, 20, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
        passes.push({ time: new Date(baseTime.setHours(12, 58, 0)).toISOString(), location: 'Вход в корпус К2', locationType: 'building', building: 'К2' });
        passes.push({ time: new Date(baseTime.setHours(13, 1, 0)).toISOString(), location: 'К2 Этаж 1 105', locationType: 'room', building: 'К2', room: '105' });
        passes.push({ time: new Date(baseTime.setHours(14, 35, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      } else if (dayOfWeek === 2 || dayOfWeek === 4) {
        passes.push({ time: new Date(baseTime.setHours(10, 40, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(10, 45, 0)).toISOString(), location: 'К1 Этаж 2 205', locationType: 'room', building: 'К1', room: '205' });
        passes.push({ time: new Date(baseTime.setHours(11, 32, 0)).toISOString(), location: 'К1 Этаж 2 Коридор', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(12, 0, 0)).toISOString(), location: 'К1 Этаж 3 301', locationType: 'room', building: 'К1', room: '301' });
        passes.push({ time: new Date(baseTime.setHours(13, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
      
    case 11: // Суббота - дополнительное занятие
      if (dayOfWeek === 6) {
        passes.push({ time: new Date(baseTime.setHours(8, 50, 0)).toISOString(), location: 'Вход в корпус К1', locationType: 'building', building: 'К1' });
        passes.push({ time: new Date(baseTime.setHours(8, 58, 0)).toISOString(), location: 'К1 Этаж 4 401', locationType: 'room', building: 'К1', room: '401' });
        passes.push({ time: new Date(baseTime.setHours(10, 32, 0)).toISOString(), location: 'Неконтролируемая территория', locationType: 'uncontrolled' });
      }
      break;
  }
  
  return passes;
};