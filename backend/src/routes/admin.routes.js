/**
 * Admin Routes — Queue governance
 * All routes protected by authenticate + requireRole('admin')
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getAllQueues, activateQueue, deactivateQueue } = require('../controllers/admin.controller');

// GET  /api/admin/queues              → view all queues (all statuses)
// POST /api/admin/queues/:id/activate → set status = active
// POST /api/admin/queues/:id/deactivate → set status = inactive
router.get('/queues', authenticate, requireRole('admin'), getAllQueues);
router.post('/queues/:id/activate', authenticate, requireRole('admin'), activateQueue);
router.post('/queues/:id/deactivate', authenticate, requireRole('admin'), deactivateQueue);

module.exports = router;
