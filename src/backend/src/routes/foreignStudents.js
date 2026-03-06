const express = require('express');
const router = express.Router();
const foreignStudentsController = require('../controllers/foreignStudentsController');
const authMiddleware = require('../middleware/authMiddleware');

// Все роуты требуют авторизации
router.use(authMiddleware);

/**
 * Шаблон 1: Поиск проходов иностранных студентов
 * GET /api/foreign-students/search
 * Query params:
 *   - searchType: 'fio' | 'upn' | 'email'
 *   - searchValue: string
 *   - dateFrom: YYYY-MM-DD
 *   - dateTo: YYYY-MM-DD
 */
router.get('/search', foreignStudentsController.searchPasses);

/**
 * Шаблон 2: Отчет о пропавших студентах
 * GET /api/foreign-students/missing
 * Query params:
 *   - country: 'all' | country code
 *   - daysThreshold: number (по умолчанию 3)
 */
router.get('/missing', foreignStudentsController.getMissingStudents);

module.exports = router;
