import express from 'express';
import { dispatchNow, enqueueTest, listPending, dumpRecent, listStats, adminListStats, adminDumpRecent, adminListPending, adminDumpRecentDetails, adminListByOccurrence } from '../controllers/notificationsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Endpoint protegido por chave em header/query: x-cron-key ou ?key=
// Aceita POST (preferencial) e GET (compatibilidade com alguns agendadores)
router.post('/dispatch', dispatchNow);
router.get('/dispatch', dispatchNow);
router.post('/_test/enqueue', enqueueTest);
router.get('/_test/pending', listPending);
router.get('/_test/recent', dumpRecent);
router.get('/_test/stats', listStats);

// Admin diagnostics (requires auth + admin)
router.get('/admin/stats', authenticateToken, requireAdmin, adminListStats);
router.get('/admin/recent', authenticateToken, requireAdmin, adminDumpRecent);
router.get('/admin/recent-details', authenticateToken, requireAdmin, adminDumpRecentDetails);
router.get('/admin/by-occurrence/:id', authenticateToken, requireAdmin, adminListByOccurrence);
router.get('/admin/pending', authenticateToken, requireAdmin, adminListPending);

export default router;
