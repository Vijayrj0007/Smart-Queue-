/**
 * Analytics Routes
 */
const express = require('express');
const router = express.Router();
const { getDashboardStats, getDailyStats, getWaitTimeStats, getHourlyStats } = require('../controllers/analytics.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireRole('admin'), getDashboardStats);
router.get('/daily', authenticate, requireRole('admin'), getDailyStats);
router.get('/wait-times', authenticate, requireRole('admin'), getWaitTimeStats);
router.get('/hourly', authenticate, requireRole('admin'), getHourlyStats);

module.exports = router;
