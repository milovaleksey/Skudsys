/**
 * Контроллер для работы с данными СКУД
 * Обрабатывает запросы к базе данных СКУД для получения информации
 * о проходах, местоположении людей, студентах и сотрудниках
 */

const { getSkudPool } = require('../config/skudDatabase');

/**
 * Парсинг идентификатора карты в целое число
 * @param {string} input - Входная строка (например: "076,10849" или "4991585" или "0004991585" или "076.12345")
 * @returns {number|null} - Целое число для поиска
 */
function parseCardIdentifier(input) {
  const cleanInput = input.trim();
  
  // Формат с запятой: "076,10849" → преобразуем в hex → decimal
  if (cleanInput.includes(',')) {
    const parts = cleanInput.split(',');
    if (parts.length === 2) {
      const highByte = parseInt(parts[0].trim(), 10);
      const lowBytes = parseInt(parts[1].trim(), 10);
      
      if (!isNaN(highByte) && !isNaN(lowBytes)) {
        // Преобразуем в hex
        const highHex = highByte.toString(16).toUpperCase().padStart(2, '0');
        const lowHex = lowBytes.toString(16).toUpperCase().padStart(4, '0');
        const combinedHex = `0x${highHex}${lowHex}`;
        
        // Преобразуем в decimal
        const decimalValue = parseInt(combinedHex, 16);
        
        console.log(`[parseCardIdentifier] Input: "${cleanInput}" → High: ${highByte} (0x${highHex}), Low: ${lowBytes} (0x${lowHex}) → Combined: ${combinedHex} → Decimal: ${decimalValue}`);
        
        return decimalValue;
      }
    }
  }
  
  // Формат с точкой: "076.12345" → убираем точку и преобразуем
  if (cleanInput.includes('.')) {
    const withoutDot = cleanInput.replace(/\./g, '');
    const numericValue = parseInt(withoutDot, 10);
    
    if (!isNaN(numericValue)) {
      console.log(`[parseCardIdentifier] Input: "${cleanInput}" → Without dot: "${withoutDot}" → Numeric: ${numericValue}`);
      return numericValue;
    }
  }
  
  // Чистое число: "4991585" или "0004991585" или "76"
  const numericValue = parseInt(cleanInput, 10);
  if (!isNaN(numericValue)) {
    console.log(`[parseCardIdentifier] Input: "${cleanInput}" → Numeric: ${numericValue}`);
    return numericValue;
  }
  
  return null;
}

/**
 * Поиск по идентификатору карты
 * Использует хранимую процедуру sp_search_person_by_identifier
 * Поддерживает форматы:
 * - "076,10849" (старший байт, младшие байты) → преобразуется в целое число
 * - "4991585" (чистое число)
 * - "0004991585" (число с ведущими нулями) → преобразуется в целое число
 * - "076.12345" (старший байт, младшие байты через точку) → преобразуется в целое число
 * - "76" (число) → 76
 * @route GET /api/v1/skud/search
 */
const searchByIdentifier = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Не указан идентификатор карты'
      });
    }

    const searchQuery = query.trim();
    const pool = getSkudPool();

    // Парсим идентификатор в целое число
    const identifier = parseCardIdentifier(searchQuery);
    
    if (identifier === null) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Неверный формат идентификатора'
      });
    }

    console.log(`[searchByIdentifier] Calling sp_search_person_by_identifier(${identifier})`);

    try {
      // Вызываем хранимую процедуру sp_search_person_by_identifier
      const [rows] = await pool.execute('CALL sp_search_person_by_identifier(?)', [identifier]);
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[searchByIdentifier] Procedure returned ${results?.length || 0} results for identifier: ${identifier}`);
      
      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0,
          message: 'Ничего не найдено'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => {
        // Форматируем дату lastSeen
        let formattedLastSeen = null;
        if (result.lastSeen || result.last_seen) {
          const dateValue = result.lastSeen || result.last_seen;
          const date = new Date(dateValue);
          formattedLastSeen = date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
        
        return {
          id: result.id || result.person_id,
          identifier: result.identifier || result.card_number,
          identifierType: result.identifierType || result.identifier_type || result.person_type,
          fullName: result.fullName || result.full_name || result.person_name,
          email: result.email || result.upn,
          position: result.position || result.job_title,
          department: result.department || result.dept_name,
          cardNumber: result.cardNumber || result.card_number,
          lastSeen: formattedLastSeen,
          location: result.location || result.last_location,
          status: (result.status === 1 || result.status === 'active' || result.is_active === 1) ? 'active' : 'inactive'
        };
      });

      console.log(`[searchByIdentifier] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        count: formattedResults.length
      });

    } catch (procError) {
      console.error(`[searchByIdentifier] Error calling sp_search_person_by_identifier(${identifier}):`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_search_person_by_identifier не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_search_person_by_identifier в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[searchByIdentifier] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при поиске',
      error: {
        message: error.message,
        code: 'SEARCH_ERROR'
      }
    });
  }
};

/**
 * Получение списка точек доступа
 * @route GET /api/v1/skud/access-points
 */
const getAccessPoints = async (req, res) => {
  try {
    const pool = getSkudPool();

    const [rows] = await pool.execute(`
      SELECT 
        id,
        name,
        location,
        type,
        building,
        is_active as isActive
      FROM access_points
      WHERE is_active = 1
      ORDER BY building, name
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Ошибка получения точек доступа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Получение журнала проходов с фильтрацией (старый метод, использует прямые SQL запросы)
 * @route GET /api/v1/skud/passes
 */
const getPassesReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      personType, 
      accessPointId, 
      direction,
      limit = 100,
      offset = 0
    } = req.query;

    const pool = getSkudPool();

    let whereConditions = [];
    let params = [];

    if (startDate) {
      whereConditions.push('al.access_time >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('al.access_time <= ?');
      params.push(endDate);
    }

    if (personType) {
      whereConditions.push('al.person_type = ?');
      params.push(personType);
    }

    if (accessPointId) {
      whereConditions.push('al.access_point_id = ?');
      params.push(accessPointId);
    }

    if (direction) {
      whereConditions.push('al.direction = ?');
      params.push(direction);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [rows] = await pool.execute(`
      SELECT 
        al.id,
        al.person_type as personType,
        al.person_name as personName,
        al.card_number as cardNumber,
        al.direction,
        al.access_time as accessTime,
        ap.name as accessPointName,
        ap.location as accessPointLocation,
        ap.building
      FROM access_logs al
      LEFT JOIN access_points ap ON al.access_point_id = ap.id
      ${whereClause}
      ORDER BY al.access_time DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM access_logs al
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        accessTime: formatDateTime(row.accessTime)
      })),
      total: countResult[0].total
    });

  } catch (error) {
    console.error('Ошибка получения журнала проходов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Поиск местоположения человека (старый метод, использует прямые SQL запросы)
 * @route GET /api/v1/skud/location
 */
const getPersonLocation = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Не указан поисковый запрос (ФИО, номер карты и т.д.)'
      });
    }

    const searchQuery = query.trim();
    const pool = getSkudPool();

    // Ищем последний проход человека
    const [results] = await pool.execute(`
      SELECT 
        al.person_type as personType,
        al.person_name as personName,
        al.card_number as cardNumber,
        al.direction,
        al.access_time as lastAccessTime,
        ap.name as accessPointName,
        ap.location as accessPointLocation,
        ap.building,
        ap.type as accessPointType,
        CASE 
          WHEN al.direction = 'in' THEN 'Находится внутри'
          WHEN al.direction = 'out' THEN 'Покинул(а) здание'
          ELSE 'Неизвестно'
        END as currentStatus
      FROM access_logs al
      JOIN access_points ap ON al.access_point_id = ap.id
      WHERE 
        al.person_name LIKE ? OR
        al.card_number LIKE ?
      ORDER BY al.access_time DESC
      LIMIT 1
    `, [`%${searchQuery}%`, `%${searchQuery}%`]);

    if (results.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Данные о местоположении не найдены'
      });
    }

    res.json({
      success: true,
      data: {
        ...results[0],
        lastAccessTime: formatDateTime(results[0].lastAccessTime)
      }
    });

  } catch (error) {
    console.error('Ошибка поиска местоположения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка поиска',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Поиск последнего прохода человека по ФИО
 * Использует хранимую процедуру sp_get_last_entry_event
 * @route GET /api/v1/skud/location/by-fio
 */
const getLocationByFio = async (req, res) => {
  try {
    const { lastName, firstName, middleName } = req.query;

    // Проверка обязательных полей
    if (!lastName || !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать фамилию и имя'
      });
    }

    const pool = getSkudPool();

    console.log(`[getLocationByFio] Calling sp_get_last_entry_event('${lastName}', '${firstName}', '${middleName || ''}')`);

    try {
      // Вызываем хранимую процедуру sp_get_last_entry_event
      const [rows] = await pool.execute(
        'CALL sp_get_last_entry_event(?, ?, ?)', 
        [lastName.trim(), firstName.trim(), middleName?.trim() || '']
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getLocationByFio] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Человек не найден или нет записей о проходах'
        });
      }

      // Берем первую запись (последнее событие)
      const result = results[0];

      // Форматируем результат
      const formattedResult = {
        fullName: result.full_name || result.fullName || `${lastName} ${firstName} ${middleName || ''}`.trim(),
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        department: result.department || result.dept_name || null,
        type: result.person_type || result.type || (result.upn?.includes('@study.') ? 'student' : 'employee'),
        lastLocation: {
          checkpoint: result.checkpoint_name || result.location || result.access_point_name || 'Неизвестно',
          time: formatDateTime(result.event_time || result.access_time || result.lastSeen)
        }
      };

      console.log(`[getLocationByFio] Formatted result:`, formattedResult);

      return res.json({
        success: true,
        data: formattedResult
      });

    } catch (procError) {
      console.error(`[getLocationByFio] Error calling sp_get_last_entry_event:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_last_entry_event не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_last_entry_event в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getLocationByFio] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при поиске местоположения',
      error: {
        message: error.message,
        code: 'LOCATION_SEARCH_ERROR'
      }
    });
  }
};

/**
 * Поиск последнего прохода человека по UPN (email)
 * спользует хранимую процедуру sp_get_last_entry_by_upn
 * @route GET /api/v1/skud/location/by-upn
 */
const getLocationByUpn = async (req, res) => {
  try {
    const { upn } = req.query;

    if (!upn || upn.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать UPN (email)'
      });
    }

    const pool = getSkudPool();

    console.log(`[getLocationByUpn] Calling sp_get_last_entry_by_upn('${upn}')`);

    try {
      // Вызываем хранимую процедуру sp_get_last_entry_by_upn
      const [rows] = await pool.execute(
        'CALL sp_get_last_entry_by_upn(?)', 
        [upn.trim()]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getLocationByUpn] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results) || results.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Человек не найден или нет записей о проходах'
        });
      }

      // Берем первую запись (последнее событие)
      const result = results[0];

      // Форматируем результат
      const formattedResult = {
        fullName: result.full_name || result.fullName || result.person_name || 'Неизвестно',
        upn: result.upn || result.email || upn,
        cardNumber: result.card_number || result.cardNumber || null,
        department: result.department || result.dept_name || null,
        type: result.person_type || result.type || (upn.includes('@study.') ? 'student' : 'employee'),
        lastLocation: {
          checkpoint: result.checkpoint_name || result.location || result.access_point_name || 'Неизвестно',
          time: formatDateTime(result.event_time || result.access_time || result.lastSeen)
        }
      };

      console.log(`[getLocationByUpn] Formatted result:`, formattedResult);

      return res.json({
        success: true,
        data: formattedResult
      });

    } catch (procError) {
      console.error(`[getLocationByUpn] Error calling sp_get_last_entry_by_upn:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_last_entry_by_upn не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_last_entry_by_upn в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getLocationByUpn] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при поиске местоположения',
      error: {
        message: error.message,
        code: 'LOCATION_SEARCH_ERROR'
      }
    });
  }
};

/**
 * Получение журнала проходов по ФИО с диапазоном дат
 * Использует хранимую процедуру sp_get_passes_by_fio
 * @route GET /api/v1/skud/passes/by-fio
 */
const getPassesByFio = async (req, res) => {
  try {
    const { lastName, firstName, middleName, dateFrom, dateTo } = req.query;

    // Проверка обязательных полей
    if (!lastName || !firstName || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать фамилию, имя и диапазон дат'
      });
    }

    const pool = getSkudPool();

    console.log(`[getPassesByFio] Calling sp_get_passes_by_fio('${lastName}', '${firstName}', '${middleName || ''}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_passes_by_fio
      const [rows] = await pool.execute(
        'CALL sp_get_passes_by_fio(?, ?, ?, ?, ?)', 
        [
          lastName.trim(), 
          firstName.trim(), 
          middleName?.trim() || '',
          dateFrom,
          dateTo
        ]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getPassesByFio] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getPassesByFio] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getPassesByFio] Error calling sp_get_passes_by_fio:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_passes_by_fio не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_passes_by_fio в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getPassesByFio] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов',
      error: {
        message: error.message,
        code: 'PASSES_SEARCH_ERROR'
      }
    });
  }
};

/**
 * Получение журнала проходов по UPN с диапазоном дат
 * Использует хранимую процедуру sp_get_passes_by_upn
 * @route GET /api/v1/skud/passes/by-upn
 */
const getPassesByUpn = async (req, res) => {
  try {
    const { upn, dateFrom, dateTo } = req.query;

    if (!upn || upn.trim() === '' || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать UPN (email) и диапазон дат'
      });
    }

    const pool = getSkudPool();

    console.log(`[getPassesByUpn] Calling sp_get_passes_by_upn('${upn}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_passes_by_upn
      const [rows] = await pool.execute(
        'CALL sp_get_passes_by_upn(?, ?, ?)', 
        [upn.trim(), dateFrom, dateTo]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getPassesByUpn] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || upn,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getPassesByUpn] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getPassesByUpn] Error calling sp_get_passes_by_upn:`, procError.message);
      
      // Если процедура не суествует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_passes_by_upn не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_passes_by_upn в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getPassesByUpn] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов',
      error: {
        message: error.message,
        code: 'PASSES_SEARCH_ERROR'
      }
    });
  }
};

// Вспомогательная функция форматирования даты
function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Получение журнала проходов СТУДЕНТОВ по ФИО с диапазоном дат
 * Использует хранимую процедуру sp_get_students_passes_by_fio
 * @route GET /api/v1/skud/students-passes/by-fio
 */
const getStudentsPassesByFio = async (req, res) => {
  try {
    const { lastName, firstName, middleName, dateFrom, dateTo } = req.query;

    // Проверка обязательных полей
    if (!lastName || !firstName || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать lastName, firstName, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getStudentsPassesByFio] Calling sp_get_students_passes_by_fio('${lastName}', '${firstName}', '${middleName || ''}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_students_passes_by_fio
      const [rows] = await pool.execute(
        'CALL sp_get_students_passes_by_fio(?, ?, ?, ?, ?)', 
        [
          lastName,
          firstName,
          middleName || '',
          dateFrom,
          dateTo
        ]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getStudentsPassesByFio] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах студентов за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getStudentsPassesByFio] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getStudentsPassesByFio] Error calling sp_get_students_passes_by_fio:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_students_passes_by_fio не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_students_passes_by_fio в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getStudentsPassesByFio] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов студентов',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * Получение журнала проходов СТУДЕНТОВ по UPN с диапазоном дат
 * Использует хранимую процедуру sp_get_students_passes_by_upn
 * @route GET /api/v1/skud/students-passes/by-upn
 */
const getStudentsPassesByUpn = async (req, res) => {
  try {
    const { upn, dateFrom, dateTo } = req.query;

    if (!upn || upn.trim() === '' || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать upn, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getStudentsPassesByUpn] Calling sp_get_students_passes_by_upn('${upn}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_students_passes_by_upn
      const [rows] = await pool.execute(
        'CALL sp_get_students_passes_by_upn(?, ?, ?)', 
        [upn, dateFrom, dateTo]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getStudentsPassesByUpn] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах студента за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getStudentsPassesByUpn] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getStudentsPassesByUpn] Error calling sp_get_students_passes_by_upn:`, procError.message);
      
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_students_passes_by_upn не найдена в базе данных',
          error: {
            message: 'Необходимо создат процедуру sp_get_students_passes_by_upn в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getStudentsPassesByUpn] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов студента',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * Получение журнала проходов СОТРУДНИКОВ по ФИО с диапазоном дат
 * Использует хранимую процедуру sp_get_employees_passes_by_fio
 * @route GET /api/v1/skud/employees-passes/by-fio
 */
const getEmployeesPassesByFio = async (req, res) => {
  try {
    const { lastName, firstName, middleName, dateFrom, dateTo } = req.query;

    // Проверка обязательных полей
    if (!lastName || !firstName || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать lastName, firstName, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getEmployeesPassesByFio] Calling sp_get_employees_passes_by_fio('${lastName}', '${firstName}', '${middleName || ''}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_employees_passes_by_fio
      const [rows] = await pool.execute(
        'CALL sp_get_employees_passes_by_fio(?, ?, ?, ?, ?)', 
        [
          lastName,
          firstName,
          middleName || '',
          dateFrom,
          dateTo
        ]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getEmployeesPassesByFio] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах сотрудников за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getEmployeesPassesByFio] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getEmployeesPassesByFio] Error calling sp_get_employees_passes_by_fio:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_employees_passes_by_fio не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_employees_passes_by_fio в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getEmployeesPassesByFio] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов сотрудников',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * Получение журнала проходов СОТРУДНИКОВ по UPN с диапазоном дат
 * Использует хранимую процедуру sp_get_employees_passes_by_upn
 * @route GET /api/v1/skud/employees-passes/by-upn
 */
const getEmployeesPassesByUpn = async (req, res) => {
  try {
    const { upn, dateFrom, dateTo } = req.query;

    if (!upn || upn.trim() === '' || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать upn, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getEmployeesPassesByUpn] Calling sp_get_employees_passes_by_upn('${upn}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_employees_passes_by_upn
      const [rows] = await pool.execute(
        'CALL sp_get_employees_passes_by_upn(?, ?, ?)', 
        [upn, dateFrom, dateTo]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getEmployeesPassesByUpn] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах сотрудника за указанный период'
        });
      }

      // Форматируем результаты
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getEmployeesPassesByUpn] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getEmployeesPassesByUpn] Error calling sp_get_employees_passes_by_upn:`, procError.message);
      
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_employees_passes_by_upn не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_employees_passes_by_upn в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getEmployeesPassesByUpn] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов сотрудника',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * Получение журнала проходов ИНОСТРАННЫХ СТУДЕНТОВ по ФИО с диапазоном дат
 * Использует хранимую процедуру sp_get_foreign_students_passes_by_fio
 * @route GET /api/v1/skud/foreign-students-passes/by-fio
 */
const getForeignStudentsPassesByFio = async (req, res) => {
  try {
    const { lastName, firstName, middleName, dateFrom, dateTo } = req.query;

    // Проверка обязательных полей
    if (!lastName || !firstName || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать lastName, firstName, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getForeignStudentsPassesByFio] Calling sp_get_foreign_students_passes_by_fio('${lastName}', '${firstName}', '${middleName || ''}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_foreign_students_passes_by_fio
      const [rows] = await pool.execute(
        'CALL sp_get_foreign_students_passes_by_fio(?, ?, ?, ?, ?)', 
        [
          lastName,
          firstName,
          middleName || '',
          dateFrom,
          dateTo
        ]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getForeignStudentsPassesByFio] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах иностранных студентов за указанный период'
        });
      }

      // Форматируем результаты (добавляем поле country)
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        country: result.country || result.citizenship || null,
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getForeignStudentsPassesByFio] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getForeignStudentsPassesByFio] Error calling sp_get_foreign_students_passes_by_fio:`, procError.message);
      
      // Если процедура не существует, возвращаем дружественное сообщение
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_foreign_students_passes_by_fio не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_foreign_students_passes_by_fio в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getForeignStudentsPassesByFio] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов иностранных студентов',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * Получение журнала проходов ИНОСТРАННЫХ СТУДЕНТОВ по UPN с диапазоном дат
 * Использует хранимую процедуру sp_get_foreign_students_passes_by_upn
 * @route GET /api/v1/skud/foreign-students-passes/by-upn
 */
const getForeignStudentsPassesByUpn = async (req, res) => {
  try {
    const { upn, dateFrom, dateTo } = req.query;

    // Проверка обязательных полей
    if (!upn || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать upn, dateFrom и dateTo',
      });
    }

    const pool = getSkudPool();

    console.log(`[getForeignStudentsPassesByUpn] Calling sp_get_foreign_students_passes_by_upn('${upn}', '${dateFrom}', '${dateTo}')`);

    try {
      // Вызываем хранимую процедуру sp_get_foreign_students_passes_by_upn
      const [rows] = await pool.execute(
        'CALL sp_get_foreign_students_passes_by_upn(?, ?, ?)', 
        [upn, dateFrom, dateTo]
      );
      
      // CALL возвращает массив массивов, первый элемент - это результат SELECT
      const results = rows[0];
      
      console.log(`[getForeignStudentsPassesByUpn] Procedure returned ${results?.length || 0} results`);
      
      if (!results || !Array.isArray(results)) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Нет данных о проходах иностранного студента за указанный период'
        });
      }

      // Форматируем результаты (добавляем поле country)
      const formattedResults = results.map(result => ({
        id: result.id || result.pass_id,
        time: formatDateTime(result.event_time || result.access_time || result.time),
        fullName: result.full_name || result.fullName || result.person_name,
        upn: result.upn || result.email || null,
        cardNumber: result.card_number || result.cardNumber || null,
        checkpoint: result.checkpoint_name || result.checkpoint || result.access_point_name || 'Неизвестно',
        country: result.country || result.citizenship || null,
        eventName: result.event_name || result.eventName || result.event_type || null,
        direction: result.direction || null,
        building: result.building || null
      }));

      console.log(`[getForeignStudentsPassesByUpn] Formatted ${formattedResults.length} results`);

      return res.json({
        success: true,
        data: formattedResults,
        total: formattedResults.length
      });

    } catch (procError) {
      console.error(`[getForeignStudentsPassesByUpn] Error calling sp_get_foreign_students_passes_by_upn:`, procError.message);
      
      if (procError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'Хранимая процедура sp_get_foreign_students_passes_by_upn не найдена в базе данных',
          error: {
            message: 'Необходимо создать процедуру sp_get_foreign_students_passes_by_upn в базе данных СКУД',
            code: 'PROCEDURE_NOT_FOUND'
          }
        });
      }
      
      throw procError;
    }

  } catch (error) {
    console.error('[getForeignStudentsPassesByUpn] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении журнала проходов иностранного студента',
      error: {
        message: error.message,
        code: error.code
      }
    });
  }
};

/**
 * ===== АНАЛИТИКА =====
 */

/**
 * Получить временные ряды проходов (по дням)
 * @route GET /api/v1/skud/analytics/time-series
 */
const getPassesTimeSeries = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    // SQL запрос для получения проходов по дням
    const query = `
      SELECT 
        DATE(Time) as date,
        COUNT(*) as count
      FROM AcessEvent
      WHERE Time BETWEEN ? AND ?
      GROUP BY DATE(Time)
      ORDER BY date ASC
    `;

    const [rows] = await pool.query(query, [dateFrom, dateTo]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getPassesTimeSeries] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения временных рядов',
      error: error.message
    });
  }
};

/**
 * Получить распределение проходов по часам
 * @route GET /api/v1/skud/analytics/hourly
 */
const getPassesHourly = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    // SQL запрос для получения проходов по часам
    const query = `
      SELECT 
        HOUR(Time) as date,
        COUNT(*) as count
      FROM AcessEvent
      WHERE Time BETWEEN ? AND ?
      GROUP BY HOUR(Time)
      ORDER BY date ASC
    `;

    const [rows] = await pool.query(query, [dateFrom, dateTo]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getPassesHourly] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения распределения по часам',
      error: error.message
    });
  }
};

/**
 * Получить топ локаций по активности
 * @route GET /api/v1/skud/analytics/top-locations
 */
const getTopLocations = async (req, res) => {
  try {
    const { dateFrom, dateTo, limit = 10 } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    const query = `
      SELECT 
        PointFullName AS name,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / (
          SELECT COUNT(*) 
          FROM AcessEvent 
          WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
        ), 2) AS percentage
      FROM AcessEvent
      WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
        AND PointFullName IS NOT NULL
      GROUP BY PointFullName
      ORDER BY count DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [dateFrom, dateTo, parseInt(limit)]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getTopLocations] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения топ локаций',
      error: error.message
    });
  }
};

/**
 * Получить общую статистику по проходам
 * @route GET /api/v1/skud/analytics/statistics
 */
const getAnalyticsStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    // Общее количество проходов
    const [totalPasses] = await pool.query(
      `SELECT COUNT(*) AS total FROM AcessEvent WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?`,
      [dateFrom, dateTo]
    );

    // Количество уникальных людей
    const [uniquePeople] = await pool.query(
      `SELECT COUNT(DISTINCT DisplayName) AS total FROM AcessEvent WHERE CAST(EventTime AS DATE) BETWEEN ? AND ? AND DisplayName IS NOT NULL`,
      [dateFrom, dateTo]
    );

    // Количество уникальных локаций
    const [uniqueLocations] = await pool.query(
      `SELECT COUNT(DISTINCT PointFullName) AS total FROM AcessEvent WHERE CAST(EventTime AS DATE) BETWEEN ? AND ? AND PointFullName IS NOT NULL`,
      [dateFrom, dateTo]
    );

    // Средняя активность в день
    const [avgDaily] = await pool.query(
      `
      SELECT 
        ROUND(AVG(daily_count), 0) AS average
      FROM (
        SELECT CAST(EventTime AS DATE) AS date, COUNT(*) AS daily_count
        FROM AcessEvent
        WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
        GROUP BY CAST(EventTime AS DATE)
      ) AS daily_stats
      `,
      [dateFrom, dateTo]
    );

    res.json({
      success: true,
      data: {
        totalPasses: totalPasses[0].total,
        uniquePeople: uniquePeople[0].total,
        uniqueLocations: uniqueLocations[0].total,
        avgDailyPasses: avgDaily[0].average || 0,
        dateRange: {
          from: dateFrom,
          to: dateTo
        }
      }
    });
  } catch (error) {
    console.error('[getAnalyticsStatistics] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики',
      error: error.message
    });
  }
};

/**
 * Получить распределение по дням недели
 * @route GET /api/v1/skud/analytics/weekday-pattern
 */
const getWeekdayPattern = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    const query = `
      SELECT 
        CASE DAYOFWEEK(EventTime)
          WHEN 1 THEN 'Вс'
          WHEN 2 THEN 'Пн'
          WHEN 3 THEN 'Вт'
          WHEN 4 THEN 'Ср'
          WHEN 5 THEN 'Чт'
          WHEN 6 THEN 'Пт'
          WHEN 7 THEN 'Сб'
        END AS day,
        DAYOFWEEK(EventTime) AS dayIndex,
        COUNT(*) AS count
      FROM AcessEvent
      WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
      GROUP BY dayIndex, day
      ORDER BY dayIndex
    `;

    const [rows] = await pool.query(query, [dateFrom, dateTo]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[getWeekdayPattern] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения паттерна по дням недели',
      error: error.message
    });
  }
};

/**
 * Получить сравнение нескольких локаций по дням
 * @route GET /api/v1/skud/analytics/locations-comparison
 */
const getLocationsComparison = async (req, res) => {
  try {
    const { dateFrom, dateTo, limit = 5 } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать dateFrom и dateTo'
      });
    }

    const pool = getSkudPool();

    // Сначала получим топ локаций за период
    const [topLocations] = await pool.query(
      `
      SELECT PointFullName
      FROM AcessEvent
      WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
        AND PointFullName IS NOT NULL
      GROUP BY PointFullName
      ORDER BY COUNT(*) DESC
      LIMIT ?
      `,
      [dateFrom, dateTo, parseInt(limit)]
    );

    if (topLocations.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const locationNames = topLocations.map(loc => loc.PointFullName);

    // Теперь получим данные по дням для этих локаций
    const placeholders = locationNames.map(() => '?').join(',');
    const query = `
      SELECT 
        CAST(EventTime AS DATE) AS date,
        PointFullName AS location,
        COUNT(*) AS count
      FROM AcessEvent
      WHERE CAST(EventTime AS DATE) BETWEEN ? AND ?
        AND PointFullName IN (${placeholders})
      GROUP BY date, location
      ORDER BY date ASC
    `;

    const [rows] = await pool.query(query, [dateFrom, dateTo, ...locationNames]);

    // Преобразуем в формат для Recharts
    const dateMap = {};
    rows.forEach(row => {
      if (!dateMap[row.date]) {
        dateMap[row.date] = { date: row.date };
      }
      dateMap[row.date][row.location] = row.count;
    });

    const result = Object.values(dateMap);

    res.json({
      success: true,
      data: result,
      locations: locationNames
    });
  } catch (error) {
    console.error('[getLocationsComparison] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения сравнения локаций',
      error: error.message
    });
  }
};

module.exports = {
  searchByIdentifier,
  getPersonLocation,
  getLocationByFio,
  getLocationByUpn,
  getPassesReport,
  getAccessPoints,
  getPassesByFio,
  getPassesByUpn,
  getStudentsPassesByFio,
  getStudentsPassesByUpn,
  getEmployeesPassesByFio,
  getEmployeesPassesByUpn,
  getForeignStudentsPassesByFio,
  getForeignStudentsPassesByUpn,
  // Аналитика
  getPassesTimeSeries,
  getPassesHourly,
  getTopLocations,
  getAnalyticsStatistics,
  getWeekdayPattern,
  getLocationsComparison
};