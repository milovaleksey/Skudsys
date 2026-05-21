const { getPool } = require('../config/database');
const Joi = require('joi');

// Схема валидации для создания роли
const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .pattern(/^[a-z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'Имя роли может содержать только строчные буквы, цифры, дефис и подчеркивание'
    }),
  displayName: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  permissions: Joi.array().items(Joi.string()).default([]),
  externalGroups: Joi.array().items(Joi.string()).optional(),
  isSystem: Joi.boolean().optional()
});

// Схема валидации для обновления роли
const updateRoleSchema = Joi.object({
  displayName: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow(''),
  permissions: Joi.array().items(Joi.string()),
  externalGroups: Joi.array().items(Joi.string()),
  isSystem: Joi.boolean().optional()
});

class RoleController {
  // Получить список всех ролей
  async getRoles(req, res, next) {
    try {
      const pool = getPool();

      const [roles] = await pool.query(
        `SELECT 
          id,
          name,
          display_name as displayName,
          description,
          permissions,
          is_system as isSystem,
          external_groups as externalGroups,
          created_at as createdAt,
          updated_at as updatedAt
         FROM roles
         ORDER BY 
           CASE 
             WHEN is_system = 1 THEN 0 
             ELSE 1 
           END,
           name`
      );

      // Парсинг JSON полей
      const parsedRoles = roles.map(role => ({
        ...role,
        id: String(role.id), // Преобразуем в строку для frontend
        permissions: typeof role.permissions === 'string' 
          ? JSON.parse(role.permissions) 
          : role.permissions || [],
        externalGroups: role.externalGroups 
          ? (typeof role.externalGroups === 'string' 
              ? JSON.parse(role.externalGroups) 
              : role.externalGroups)
          : [],
        isSystem: Boolean(role.isSystem)
      }));

      res.json({
        success: true,
        data: parsedRoles
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить роль по ID
  async getRoleById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = getPool();

      const [roles] = await pool.query(
        `SELECT 
          id,
          name,
          display_name as displayName,
          description,
          permissions,
          is_system as isSystem,
          external_groups as externalGroups,
          created_at as createdAt,
          updated_at as updatedAt
         FROM roles
         WHERE id = ?`,
        [id]
      );

      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Роль не найдена'
          }
        });
      }

      const role = roles[0];
      
      // Парсинг JSON полей
      role.id = String(role.id); // Преобразуем в строку для frontend
      role.permissions = typeof role.permissions === 'string' 
        ? JSON.parse(role.permissions) 
        : role.permissions || [];
      role.externalGroups = role.externalGroups 
        ? (typeof role.externalGroups === 'string' 
            ? JSON.parse(role.externalGroups) 
            : role.externalGroups)
        : [];
      role.isSystem = Boolean(role.isSystem);

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  // Создать новую роль
  async createRole(req, res, next) {
    try {
      // Валидация
      const { error, value } = createRoleSchema.validate(req.body);
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

      // Проверить уникальность имени роли
      const [existing] = await pool.query(
        'SELECT id FROM roles WHERE name = ?',
        [value.name]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: 'Роль с таким именем уже существует'
          }
        });
      }

      // Создать роль
      const [result] = await pool.query(
        `INSERT INTO roles (name, display_name, description, permissions, external_groups, is_system)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          value.name,
          value.displayName,
          value.description || '',
          JSON.stringify(value.permissions || []),
          value.externalGroups ? JSON.stringify(value.externalGroups) : null,
          0 // Новые роли всегда не системные
        ]
      );

      // Получить созданную роль
      const [newRoles] = await pool.query(
        `SELECT 
          id,
          name,
          display_name as displayName,
          description,
          permissions,
          is_system as isSystem,
          external_groups as externalGroups,
          created_at as createdAt
         FROM roles
         WHERE id = ?`,
        [result.insertId]
      );

      const newRole = newRoles[0];
      newRole.id = String(newRole.id);
      newRole.permissions = typeof newRole.permissions === 'string' 
        ? JSON.parse(newRole.permissions) 
        : newRole.permissions || [];
      newRole.externalGroups = newRole.externalGroups 
        ? (typeof newRole.externalGroups === 'string' 
            ? JSON.parse(newRole.externalGroups) 
            : newRole.externalGroups)
        : [];
      newRole.isSystem = Boolean(newRole.isSystem);

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
         VALUES (?, 'CREATE', 'role', ?, ?, ?, ?)`,
        [
          req.user.id,
          result.insertId,
          JSON.stringify({ name: value.name, displayName: value.displayName }),
          req.ip,
          req.headers['user-agent']
        ]
      );

      res.status(201).json({
        success: true,
        data: newRole
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновить роль
  async updateRole(req, res, next) {
    try {
      const { id } = req.params;

      // Валидация
      const { error, value } = updateRoleSchema.validate(req.body);
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

      // Проверить существование роли
      const [existing] = await pool.query(
        'SELECT id, name, is_system FROM roles WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Роль не найдена'
          }
        });
      }

      // Системные роли можно обновлять только частично
      if (existing[0].is_system && value.permissions === undefined) {
        // Разрешаем обновлять только permissions для системных ролей
        return res.status(403).json({
          success: false,
          error: {
            code: 'SYSTEM_ROLE_PROTECTED',
            message: 'Системную роль нельзя полностью изменить'
          }
        });
      }

      // Построение UPDATE запроса
      const updates = [];
      const params = [];

      if (value.displayName !== undefined) {
        updates.push('display_name = ?');
        params.push(value.displayName);
      }

      if (value.description !== undefined) {
        updates.push('description = ?');
        params.push(value.description);
      }

      if (value.permissions !== undefined) {
        updates.push('permissions = ?');
        params.push(JSON.stringify(value.permissions));
      }

      if (value.externalGroups !== undefined) {
        updates.push('external_groups = ?');
        params.push(value.externalGroups ? JSON.stringify(value.externalGroups) : null);
      }

      updates.push('updated_at = NOW()');

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_UPDATES',
            message: 'Нет данных для обновления'
          }
        });
      }

      // Обновить роль
      params.push(id);
      await pool.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Получить обновленную роль
      const [updatedRoles] = await pool.query(
        `SELECT 
          id,
          name,
          display_name as displayName,
          description,
          permissions,
          is_system as isSystem,
          external_groups as externalGroups,
          created_at as createdAt,
          updated_at as updatedAt
         FROM roles
         WHERE id = ?`,
        [id]
      );

      const updatedRole = updatedRoles[0];
      updatedRole.id = String(updatedRole.id);
      updatedRole.permissions = typeof updatedRole.permissions === 'string'
        ? JSON.parse(updatedRole.permissions)
        : updatedRole.permissions || [];
      updatedRole.externalGroups = updatedRole.externalGroups
        ? (typeof updatedRole.externalGroups === 'string'
            ? JSON.parse(updatedRole.externalGroups)
            : updatedRole.externalGroups)
        : [];
      updatedRole.isSystem = Boolean(updatedRole.isSystem);

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
         VALUES (?, 'UPDATE', 'role', ?, ?, ?, ?)`,
        [
          req.user.id,
          id,
          JSON.stringify(value),
          req.ip,
          req.headers['user-agent']
        ]
      );

      res.json({
        success: true,
        data: updatedRole
      });
    } catch (error) {
      next(error);
    }
  }

  // Удалить роль
  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      const pool = getPool();

      // Проверить существование роли
      const [existing] = await pool.query(
        'SELECT id, name, is_system FROM roles WHERE id = ?',
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Роль не найдена'
          }
        });
      }

      // Нельзя удалить системную роль
      if (existing[0].is_system) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SYSTEM_ROLE_PROTECTED',
            message: 'Системную роль нельзя удалить'
          }
        });
      }

      // Проверить есть ли пользователи с этой ролью
      const [users] = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role_name = ?',
        [existing[0].name]
      );

      if (users[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROLE_IN_USE',
            message: `Роль используется ${users[0].count} пользователями. Сначала измените роль этих пользователей.`
          }
        });
      }

      // Удалить роль
      await pool.query('DELETE FROM roles WHERE id = ?', [id]);

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
         VALUES (?, 'DELETE', 'role', ?, ?, ?, ?)`,
        [
          req.user.id,
          id,
          JSON.stringify({ name: existing[0].name }),
          req.ip,
          req.headers['user-agent']
        ]
      );

      res.json({
        success: true,
        message: 'Роль успешно удалена'
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить список всех прав (permissions)
  async getPermissions(req, res, next) {
    try {
      // Список всех доступных прав
      const permissions = [
        { id: 'dashboard', name: 'Главная панель', category: 'Основные' },
        { id: 'dashboard-builder', name: 'Конструктор дашборда', category: 'Администрирование' },
        { id: 'passes', name: 'Отчет о проходах', category: 'Безопасность' },
        { id: 'identifier-search', name: 'Поиск по идентификатору', category: 'Безопасность' },
        { id: 'location', name: 'Местонахождение людей', category: 'Безопасность' },
        { id: 'analytics', name: 'Аналитика', category: 'Отчеты' },
        { id: 'parking', name: 'Парковочная система', category: 'Инфраструктура' },
        { id: 'storage', name: 'Система хранения вещей', category: 'Инфраструктура' },
        { id: 'foreign-students', name: 'Отчет по иностранным студентам', category: 'Отчеты' },
        { id: 'students', name: 'Отчет по студентам', category: 'Отчеты' },
        { id: 'employees', name: 'Отчет по сотрудникам', category: 'Отчеты' },
        { id: 'users-settings', name: 'Управление пользователями', category: 'Администрирование' },
        { id: 'roles-settings', name: 'Управление ролями', category: 'Администрирование' },
        { id: 'user-logs', name: 'Логи действий пользователей', category: 'Администрирование' },
      ];

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();