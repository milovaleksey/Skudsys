/**
 * Контроллер для работы с данными СКУД
 * Обрабатывает запросы к базе данных СКУД для получения информации
 * о проходах, местоположении людей, студентах и сотрудниках
 */

const { getSkudPool } = require('../config/skudDatabase');

/**
 * Парсинг идентификатора карты из различных форматов
 * @param {string} input - Входная строка (например: "076,10849" или "4991585" или "0004991585")
 * @returns {string[]} - Массив возможных вариантов для поиска
 */
function parseCardIdentifier(input) {
  const cleanInput = input.trim();
  const results = [];

  // Формат с запятой: "076,10849" → преобразуем в hex
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
        
        results.push(decimalValue.toString());
        // Также добавим с ведущими нулями
        results.push(decimalValue.toString().padStart(10, '0'));
      }
    }
  } else {
    // Чистое число: "4991585" или "0004991585"
    const numericValue = parseInt(cleanInput, 10);
    if (!isNaN(numericValue)) {
      console.log(`[parseCardIdentifier] Input: "${cleanInput}" → Numeric: ${numericValue}`);
      
      // Добавляем оригинал
      results.push(cleanInput);
      // Добавляем без ведущих нулей
      results.push(numericValue.toString());
      // Добавляем с ведущими нулями (10 цифр)
      results.push(numericValue.toString().padStart(10, '0'));
    }
  }

  return [...new Set(results)]; // Убираем дубликаты
}

/**
 * Поиск по идентификатору карты
 * Использует хранимую процедуру search_card
 * Поддерживает форматы:
 * - "076,10849" (старший байт, младшие байты)
 * - "4991585" (чистое число)
 * - "0004991585" (число с ведущими нулями)
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

    // Парсим идентификатор
    const identifiers = parseCardIdentifier(searchQuery);
    
    if (identifiers.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Неверный формат идентификатора'
      });
    }

    console.log(`[searchByIdentifier] Search identifiers:`, identifiers);

    // Собираем все результаты из процедуры для каждого варианта идентификатора
    const allResults = [];
    const seenIds = new Set(); // Для избежания дубликатов

    for (const identifier of identifiers) {
      try {
        console.log(`[searchByIdentifier] Calling search_card('${identifier}')`);
        
        // Вызываем хранимую процедуру
        const [rows] = await pool.execute('CALL search_card(?)', [identifier]);
        
        // CALL возвращает массив массивов, первый элемент - это результат SELECT
        const results = rows[0];
        
        console.log(`[searchByIdentifier] Procedure returned ${results?.length || 0} results for identifier: ${identifier}`);
        
        if (results && Array.isArray(results)) {
          // Добавляем только уникальные результаты (по id)
          results.forEach(result => {
            const uniqueKey = `${result.identifierType}-${result.id}`;
            if (!seenIds.has(uniqueKey)) {
              seenIds.add(uniqueKey);
              
              // Форматируем дату lastSeen
              let formattedLastSeen = null;
              if (result.lastSeen) {
                const date = new Date(result.lastSeen);
                formattedLastSeen = date.toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
              }
              
              allResults.push({
                id: result.id,
                identifier: result.identifier,
                identifierType: result.identifierType,
                fullName: result.fullName,
                email: result.email,
                position: result.position,
                department: result.department,
                cardNumber: result.cardNumber,
                lastSeen: formattedLastSeen,
                location: result.location,
                status: result.status ? 'active' : 'inactive'
              });
            }
          });
        }
      } catch (procError) {
        console.error(`[searchByIdentifier] Error calling search_card('${identifier}'):`, procError.message);
        // Продолжаем с другими идентификаторами
      }
    }

    console.log(`[searchByIdentifier] Total unique results: ${allResults.length}`);

    return res.json({
      success: true,
      data: allResults,
      count: allResults.length
    });

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