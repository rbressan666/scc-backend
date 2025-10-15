import express from 'express';
import { dispatchNow, enqueueTest, listPending, dumpRecent, listStats } from '../controllers/notificationsController.js';

const router = express.Router();

// Endpoint protegido por chave em header/query: x-cron-key ou ?key=
router.post('/dispatch', dispatchNow);
router.post('/_test/enqueue', enqueueTest);
router.get('/_test/pending', listPending);
router.get('/_test/recent', dumpRecent);
router.get('/_test/stats', listStats);

export default router;
