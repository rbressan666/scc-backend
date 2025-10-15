import express from 'express';
import { dispatchNow, enqueueTest } from '../controllers/notificationsController.js';

const router = express.Router();

// Endpoint protegido por chave em header/query: x-cron-key ou ?key=
router.post('/dispatch', dispatchNow);
router.post('/_test/enqueue', enqueueTest);

export default router;
