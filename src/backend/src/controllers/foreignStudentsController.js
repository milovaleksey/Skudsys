const db2 = require('../config/db2'); // База СКУД

class ForeignStudentsController {
  /**
   * Шаблон 1: Поиск проходов иностранных студентов
   * GET /api/foreign-students/search
   */
  async searchPasses(req, res) {
    try {
      const { searchType, searchValue, dateFrom, dateTo } = req.query;

      if (!searchType || !searchValue || !dateFrom || !dateTo) {
        return res.status(400).json({
          success: false,
          message: 'Все поля обязательны для заполнения'
        });
      }

      // Вызов хранимой процедуры для поиска проходов иностранных студентов
      const [results] = await db2.query(
        'CALL sp_foreign_students_search(?, ?, ?, ?)',
        [searchType, searchValue, dateFrom, dateTo]
      );

      // Результаты из первого набора данных
      const records = results[0] || [];

      res.json({
        success: true,
        results: records.map(row => ({
          id: row.id,
          fio: row.fio,
          upn: row.upn,
          email: row.email || row.upn, // fallback
          country: row.country,
          lastSeen: row.pass_time,
          location: row.location,
          direction: row.direction
        })),
        total: records.length
      });
    } catch (error) {
      console.error('[Foreign Students] Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске данных'
      });
    }
  }

  /**
   * Шаблон 2: Отчет о пропавших студентах (>N дней)
   * GET /api/foreign-students/missing
   */
  async getMissingStudents(req, res) {
    try {
      const { country = 'all', daysThreshold = '3' } = req.query;
      const days = parseInt(daysThreshold);

      if (isNaN(days) || days < 1) {
        return res.status(400).json({
          success: false,
          message: 'Неверное значение порога дней'
        });
      }

      // Вызов хранимой процедуры для поиска пропавших студентов
      const [results] = await db2.query(
        'CALL sp_foreign_students_missing(?, ?)',
        [country, days]
      );

      // Результаты из первого набора данных
      const records = results[0] || [];

      res.json({
        success: true,
        results: records.map(row => ({
          id: row.id,
          fio: row.fio,
          upn: row.upn,
          email: row.email || row.upn, // fallback
          country: row.country,
          lastSeen: row.last_seen,
          lastLocation: row.last_location,
          daysMissing: row.days_missing
        })),
        total: records.length
      });
    } catch (error) {
      console.error('[Foreign Students] Missing report error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при формировании отчета'
      });
    }
  }
}

module.exports = new ForeignStudentsController();
