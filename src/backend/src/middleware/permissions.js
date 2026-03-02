/**
 * Middleware для проверки прав доступа на основе ролей
 * Определяет, какие роли имеют доступ к каким страницам/функциям
 */

/**
 * Карта разрешений: страница -> разрешенные роли
 */
const PERMISSIONS_MAP = {
  // Страница "Поиск по идентификатору"
  'identifier-search': ['admin', 'security', 'teacher'],
  
  // Страница "Журнал проходов"
  'passes': ['admin', 'security'],
  
  // Страница "Где находится человек"
  'location': ['admin', 'security', 'teacher'],
  
  // Страница "Отчет по иностранным студентам"
  'foreign-students': ['admin', 'security'],
  
  // Страница "Отчет по сотрудникам"
  'employees': ['admin', 'security'],
  
  // Страница "Парковка"
  'parking': ['admin', 'security', 'teacher', 'student', 'guest'],
  
  // Управление пользователями
  'users': ['admin'],
  
  // Управление ролями
  'roles': ['admin'],
  
  // Журнал аудита
  'audit': ['admin', 'security'],
  
  // MQTT настройки
  'mqtt': ['admin'],
  
  // Дашборд (доступен всем авторизованным)
  'dashboard': ['admin', 'security', 'teacher', 'student', 'guest']
};

/**
 * Middleware для проверки прав доступа
 * @param {string} permission - Название разрешения из PERMISSIONS_MAP
 * @returns {Function} Express middleware
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      // Пользователь должен быть аутентифицирован (проверяется middleware authenticate)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Требуется аутентификация',
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const userRole = req.user.role;
      const allowedRoles = PERMISSIONS_MAP[permission];

      // Если разрешение не найдено, запрещаем доступ
      if (!allowedRoles) {
        console.warn(`[Permissions] Unknown permission: ${permission}`);
        return res.status(403).json({
          success: false,
          message: 'Доступ запрещен',
          error: {
            code: 'FORBIDDEN',
            message: `Unknown permission: ${permission}`
          }
        });
      }

      // Проверяем, есть ли роль пользователя в списке разрешенных
      if (!allowedRoles.includes(userRole)) {
        console.warn(`[Permissions] Access denied for user ${req.user.username} (${userRole}) to permission: ${permission}`);
        return res.status(403).json({
          success: false,
          message: 'У вас нет прав для доступа к этому ресурсу',
          error: {
            code: 'FORBIDDEN',
            message: `Role '${userRole}' is not allowed for permission '${permission}'`
          }
        });
      }

      // Доступ разрешен
      console.log(`[Permissions] Access granted for user ${req.user.username} (${userRole}) to permission: ${permission}`);
      next();

    } catch (error) {
      console.error('[Permissions] Error checking permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при проверке прав доступа',
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: error.message
        }
      });
    }
  };
};

/**
 * Проверка, имеет ли роль доступ к разрешению
 * @param {string} role - Роль пользователя
 * @param {string} permission - Название разрешения
 * @returns {boolean} true если доступ разрешен
 */
const hasPermission = (role, permission) => {
  const allowedRoles = PERMISSIONS_MAP[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

/**
 * Получить все разрешения для роли
 * @param {string} role - Роль пользователя
 * @returns {string[]} Массив разрешений
 */
const getPermissionsForRole = (role) => {
  const permissions = [];
  for (const [permission, roles] of Object.entries(PERMISSIONS_MAP)) {
    if (roles.includes(role)) {
      permissions.push(permission);
    }
  }
  return permissions;
};

module.exports = {
  checkPermission,
  hasPermission,
  getPermissionsForRole,
  PERMISSIONS_MAP
};
