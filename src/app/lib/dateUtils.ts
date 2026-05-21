/**
 * Утилиты для работы с датой и временем
 * Часовой пояс Тюмени: Asia/Yekaterinburg (UTC+5)
 */

const TYUMEN_TIMEZONE = 'Asia/Yekaterinburg'; // UTC+5

/**
 * Форматирует дату в тюменском часовом поясе
 * @param date - ISO строка или Date объект
 * @param options - Опции форматирования
 * @returns Отформатированная строка
 */
export function formatDateTyumen(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TYUMEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat('ru-RU', defaultOptions).format(dateObj);
}

/**
 * Форматирует время в тюменском часовом поясе
 * @param date - ISO строка или Date объект
 * @param options - Опции форматирования
 * @returns Отформатированная строка времени
 */
export function formatTimeTyumen(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TYUMEN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat('ru-RU', defaultOptions).format(dateObj);
}

/**
 * Форматирует дату и время в тюменском часовом поясе
 * @param date - ISO строка или Date объект
 * @param includeSeconds - Включать ли секунды (по умолчанию true)
 * @returns Отформатированная строка "ДД.ММ.ГГГГ ЧЧ:ММ:СС"
 */
export function formatDateTimeTyumen(
  date: string | Date,
  includeSeconds: boolean = true
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: TYUMEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: TYUMEN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };

  const datePart = new Intl.DateTimeFormat('ru-RU', dateOptions).format(dateObj);
  const timePart = new Intl.DateTimeFormat('ru-RU', timeOptions).format(dateObj);

  return `${datePart} ${timePart}`;
}

/**
 * Форматирует дату и время для экспорта в Excel
 * @param date - ISO строка или Date объект
 * @returns Отформатированная строка "ДД.ММ.ГГГГ ЧЧ:ММ:СС (UTC+5)"
 */
export function formatDateTimeForExport(date: string | Date): string {
  const formatted = formatDateTimeTyumen(date, true);
  return `${formatted} (UTC+5)`;
}

/**
 * Проверяет, соответствует ли дата сегодняшнему дню в тюменском часовом поясе
 * @param date - ISO строка или Date объект
 * @returns true если дата сегодняшняя
 */
export function isTodayTyumen(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Получаем текущую дату в тюменском часовом поясе
  const now = new Date();
  const nowInTyumen = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TYUMEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Получаем проверяемую дату в тюменском часовом поясе
  const dateInTyumen = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TYUMEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);

  return nowInTyumen === dateInTyumen;
}

/**
 * Конвертирует UTC дату в объект Date в тюменском часовом поясе
 * @param utcDate - ISO строка в UTC
 * @returns Date объект
 */
export function utcToTyumenDate(utcDate: string): Date {
  // Парсим UTC дату
  const utc = new Date(utcDate);
  
  // Создаём строку в формате ISO для тюменского часового пояса
  const tyumenString = new Intl.DateTimeFormat('en-CA', {
    timeZone: TYUMEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(utc);

  return new Date(tyumenString.replace(',', ''));
}

/**
 * Форматирует относительное время (например, "5 минут назад")
 * @param date - ISO строка или Date объект
 * @returns Относительная строка времени
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec} сек назад`;
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffHour < 24) return `${diffHour} ч назад`;
  if (diffDay < 7) return `${diffDay} дн назад`;

  // Если больше недели, показываем полную дату
  return formatDateTyumen(dateObj);
}
