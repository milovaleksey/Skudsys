const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');
const Joi = require('joi');

// Схема валидации для локального входа
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

class AuthController {
  // Локальная авторизация
  async login(req, res, next) {
    try {
      // Валидация
      const { error, value } = loginSchema.validate(req.body);
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

      // Найти пользователя
      const [users] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name,
          u.email,
          u.password_hash,
          u.role_name,
          u.auth_type,
          u.is_active,
          u.created_at,
          r.display_name as role_display_name,
          r.permissions
         FROM users u
         INNER JOIN roles r ON u.role_name = r.name
         WHERE u.username = ? AND u.auth_type = 'local'`,
        [value.username]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Неверный логин или пароль'
          }
        });
      }

      const user = users[0];

      // Проверка активности
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Пользователь неактивен'
          }
        });
      }

      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(value.password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Неверный логин или пароль'
          }
        });
      }

      // Обновить время последнего входа
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      // Создать JWT токен
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Записать в audit_log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (?, 'LOGIN', 'session', ?, ?, ?)`,
        [user.id, user.id, req.ip, req.headers['user-agent']]
      );

      res.json({
        success: true,
        data: {
          token,
          expiresIn: 86400, // 24 часа в секундах
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            role: user.role_name,
            roleDisplayName: user.role_display_name,
            authType: 'local',
            isActive: user.is_active,
            createdAt: user.created_at,
            lastLogin: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // SSO авторизация
  async ssoLogin(req, res, next) {
    try {
      const { email, ssoToken } = req.body;

      if (!email || !ssoToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email и SSO токен обязательны'
          }
        });
      }

      // TODO: Проверить SSO токен с системой университета
      // Здесь должна быть интеграция с SSO системой ТюмГУ
      // const isSsoValid = await validateSsoToken(ssoToken);

      const pool = getPool();

      // Найти пользователя по email
      const [users] = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.full_name,
          u.email,
          u.role_name,
          u.auth_type,
          u.is_active,
          u.created_at,
          r.display_name as role_display_name,
          r.permissions
         FROM users u
         INNER JOIN roles r ON u.role_name = r.name
         WHERE u.email = ? AND u.auth_type = 'sso'`,
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Пользователь не найден в системе'
          }
        });
      }

      const user = users[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Пользователь неактивен'
          }
        });
      }

      // Обновить время последнего входа
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

      // Создать JWT токен
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (?, 'LOGIN', 'session', ?, ?, ?)`,
        [user.id, user.id, req.ip, req.headers['user-agent']]
      );

      res.json({
        success: true,
        data: {
          token,
          expiresIn: 86400,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            role: user.role_name,
            roleDisplayName: user.role_display_name,
            authType: 'sso',
            isActive: user.is_active,
            createdAt: user.created_at,
            lastLogin: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Выход
  async logout(req, res, next) {
    try {
      const pool = getPool();

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (?, 'LOGOUT', 'session', ?, ?, ?)`,
        [req.user.id, req.user.id, req.ip, req.headers['user-agent']]
      );

      res.json({
        success: true,
        message: 'Успешный выход из системы'
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить информацию о текущем пользователе
  async me(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
