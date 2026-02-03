const { getPool } = require('../config/database');

class AuditController {
  // Получить журнал аудита
  async getLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        action = '',
        entityType = '',
        entityId = '',
        userId = '',
        startDate = '',
        endDate = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const pool = getPool();

      // Построение WHERE условий
      const conditions = [];
      const params = [];

      if (action) {
        conditions.push('a.action = ?');
        params.push(action);
      }

      if (entityType) {
        conditions.push('a.entity_type = ?');
        params.push(entityType);
      }

      if (entityId) {
        conditions.push('a.entity_id = ?');
        params.push(entityId);
      }

      if (userId) {
        conditions.push('a.user_id = ?');
        params.push(userId);
      }

      if (startDate) {
        conditions.push('a.created_at >= ?');
        params.push(startDate);
      }

      if (endDate) {
        conditions.push('a.created_at <= ?');
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Получить общее количество
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM audit_log a ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Получить логи
      // Используем LEFT JOIN с пользователями для получения информации об авторе действия
      const [logs] = await pool.query(
        `SELECT 
          a.id,
          a.user_id as userId,
          u.username as actorUsername,
          u.full_name as actorFullName,
          a.action,
          a.entity_type as entityType,
          a.entity_id as entityId,
          a.changes,
          a.old_values as oldValues,
          a.new_values as newValues,
          a.ip_address as ipAddress,
          a.user_agent as userAgent,
          a.created_at as createdAt
         FROM audit_log a
         LEFT JOIN users u ON a.user_id = u.id
         ${whereClause}
         ORDER BY a.${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить типы действий и сущностей для фильтров
  async getFilterOptions(req, res, next) {
    try {
      const pool = getPool();

      const [actions] = await pool.query('SELECT DISTINCT action FROM audit_log ORDER BY action');
      const [entityTypes] = await pool.query('SELECT DISTINCT entity_type as entityType FROM audit_log ORDER BY entity_type');

      res.json({
        success: true,
        data: {
          actions: actions.map(r => r.action),
          entityTypes: entityTypes.map(r => r.entityType)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
