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
 * Получение журнала проходов с фильтрацией
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
 * Поиск местоположения человека
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

module.exports = {
  searchByIdentifier,
  getPassesReport,
  getPersonLocation,
  getAccessPoints
};