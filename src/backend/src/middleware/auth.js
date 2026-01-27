const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Токен авторизации не предоставлен'
        }
      });
    }

    const token = authHeader.substring(7);

    try {
      // Подробное логирование токена перед верификацией
      // console.log(`[Auth] Verifying token: ${token.substring(0, 20)}...`); 
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // console.log(`[Auth] Token verified for userId: ${decoded.userId}`);

      // Получить пользователя из БД
      const pool = getPool();
      const [users] = await pool.query(
        `SELECT u.*, r.permissions, r.display_name as role_display_name
         FROM users u
         INNER JOIN roles r ON u.role_name = r.name
         WHERE u.id = ? AND u.is_active = TRUE`,
        [decoded.userId]
      );

      if (users.length === 0) {
        console.warn(`[Auth] User not found or inactive for ID: ${decoded.userId}`);
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пользователь не найден или неактивен'
          }
        });
      }

      const user = users[0];
      
      // Парсинг JSON прав
      try {
        user.permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : (user.permissions || []);
      } catch (e) {
        console.error(`[Auth] Failed to parse permissions for user ${user.id}:`, e);
        user.permissions = [];
      }

      // Добавляем пользователя в request
      req.user = {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
        roleDisplayName: user.role_display_name,
        permissions: user.permissions,
        authType: user.auth_type
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Токен истёк'
          }
        });
      }

      console.error('[Auth] Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Недействительный токен'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware для проверки прав доступа
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Требуется авторизация'
        }
      });
    }

    const hasPermission = requiredPermissions.some(permission =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Недостаточно прав доступа',
          required: requiredPermissions
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};