const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const { validate } = require('../utils/validation');
const Joi = require('joi');

// Схема валидации для создания пользователя
const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(100).required(),
  fullName: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).when('authType', {
    is: 'local',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  role: Joi.string().required(),
  authType: Joi.string().valid('local', 'sso').required(),
  isActive: Joi.boolean().default(true)
});

// Схема валидации для обновления пользователя
const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(200),
  email: Joi.string().email(),
  role: Joi.string(),
  isActive: Joi.boolean()
});

class UserController {
  // Получить список пользователей
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        authType = '',
        isActive = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const pool = getPool();

      // Построение WHERE условий
      const conditions = [];
      const params = [];

      if (search) {
        conditions.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (role) {
        conditions.push('u.role_name = ?');
        params.push(role);
      }

      if (authType) {
        conditions.push('u.auth_type = ?');
        params.push(authType);
      }

      if (isActive !== '') {
        conditions.push('u.is_active = ?');
        params.push(isActive === 'true' ? 1 : 0);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Получить общее количество
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM users u ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // Получить пользователей
      const [users] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name as fullName,
          u.email,
          u.role_name as role,
          r.display_name as roleDisplayName,
          u.auth_type as authType,
          u.is_active as isActive,
          u.created_at as createdAt,
          u.last_login as lastLogin
         FROM users u
         INNER JOIN roles r ON u.role_name = r.name
         ${whereClause}
         ORDER BY u.${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        success: true,
        data: {
          users,
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

  // Получить пользователя по ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = getPool();

      const [users] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name as fullName,
          u.email,
          u.role_name as role,
          r.display_name as roleDisplayName,
          u.auth_type as authType,
          u.avatar_url as avatar,
          u.is_active as isActive,
          u.created_at as createdAt,
          u.updated_at as updatedAt,
          u.last_login as lastLogin
         FROM users u
         INNER JOIN roles r ON u.role_name = r.name
         WHERE u.id = ?`,
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Пользователь не найден'
          }
        });
      }

      res.json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Создать пользователя
  async createUser(req, res, next) {
    try {
      // Валидация
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: error.details.map(d => ({ field: d.path[0], message: d.message }))
          }
        });
      }

      const pool = getPool();

      // Проверка существования роли
      const [roles] = await pool.query('SELECT name FROM roles WHERE name = ?', [value.role]);
      if (roles.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Роль не существует'
          }
        });
      }

      // Хеширование пароля для локальных пользователей
      let passwordHash = null;
      if (value.authType === 'local' && value.password) {
        passwordHash = await bcrypt.hash(value.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      }

      // Создание пользователя
      const [result] = await pool.query(
        `INSERT INTO users (username, full_name, email, password_hash, role_name, auth_type, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          value.username,
          value.fullName,
          value.email,
          passwordHash,
          value.role,
          value.authType,
          value.isActive ? 1 : 0
        ]
      );

      // Получить созданного пользователя
      const [newUser] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name as fullName,
          u.email,
          u.role_name as role,
          u.auth_type as authType,
          u.is_active as isActive,
          u.created_at as createdAt
         FROM users u
         WHERE u.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        data: newUser[0],
        message: 'Пользователь успешно создан'
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновить пользователя
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      // Валидация
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: error.details.map(d => ({ field: d.path[0], message: d.message }))
          }
        });
      }

      const pool = getPool();

      // Проверка существования пользователя
      const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Пользователь не найден'
          }
        });
      }

      // Проверка роли если она обновляется
      if (value.role) {
        const [roles] = await pool.query('SELECT name FROM roles WHERE name = ?', [value.role]);
        if (roles.length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Роль не существует'
            }
          });
        }
      }

      // Построение UPDATE запроса
      const updateFields = [];
      const updateParams = [];

      if (value.fullName) {
        updateFields.push('full_name = ?');
        updateParams.push(value.fullName);
      }

      if (value.email) {
        updateFields.push('email = ?');
        updateParams.push(value.email);
      }

      if (value.role) {
        updateFields.push('role_name = ?');
        updateParams.push(value.role);
      }

      if (value.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateParams.push(value.isActive ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_UPDATES',
            message: 'Нет полей для обновления'
          }
        });
      }

      updateParams.push(id);

      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );

      // Получить обновленного пользователя
      const [updatedUser] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name as fullName,
          u.email,
          u.role_name as role,
          u.is_active as isActive,
          u.updated_at as updatedAt
         FROM users u
         WHERE u.id = ?`,
        [id]
      );

      res.json({
        success: true,
        data: updatedUser[0],
        message: 'Пользователь успешно обновлен'
      });
    } catch (error) {
      next(error);
    }
  }

  // Удалить пользователя
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // Запретить удаление самого себя
      if (parseInt(id) === req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Нельзя удалить самого себя'
          }
        });
      }

      const pool = getPool();

      // Проверка существования
      const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Пользователь не найден'
          }
        });
      }

      // Удаление
      await pool.query('DELETE FROM users WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Пользователь успешно удален'
      });
    } catch (error) {
      next(error);
    }
  }

  // Статистика пользователей
  async getUserStatistics(req, res, next) {
    try {
      const pool = getPool();

      // Общая статистика
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN auth_type = 'local' THEN 1 ELSE 0 END) as local,
          SUM(CASE WHEN auth_type = 'sso' THEN 1 ELSE 0 END) as sso
        FROM users
      `);

      // По ролям
      const [byRole] = await pool.query(`
        SELECT 
          r.name as role,
          r.display_name as roleDisplayName,
          COUNT(u.id) as count
        FROM roles r
        LEFT JOIN users u ON u.role_name = r.name
        GROUP BY r.name, r.display_name
        ORDER BY count DESC
      `);

      // Последние входы
      const [recentLogins] = await pool.query(`
        SELECT 
          id as userId,
          username,
          full_name as fullName,
          last_login as lastLogin
        FROM users
        WHERE last_login IS NOT NULL
        ORDER BY last_login DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          total: stats[0].total,
          active: stats[0].active,
          inactive: stats[0].inactive,
          byAuthType: {
            local: stats[0].local,
            sso: stats[0].sso
          },
          byRole,
          recentLogins
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
