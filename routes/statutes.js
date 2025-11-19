import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
	listPending,
	acknowledge,
	listAll,
	createStatute,
	updateStatute,
	deleteStatute,
	createItem,
	updateItem,
	deleteItem,
	listAcknowledgements,
	userAcknowledgements
} from '../controllers/statutesController.js';

const router = express.Router();

router.use(authenticateToken);

// Pendências e reconhecimento
router.get('/pending', listPending);
router.post('/ack', acknowledge);

// Estatutos (listagem completa)
router.get('/', listAll);
router.post('/', createStatute);
router.put('/:id', updateStatute);
router.delete('/:id', deleteStatute);

// Itens de estatuto
router.post('/:id/items', createItem); // id do estatuto
router.put('/items/:itemId', updateItem);
router.delete('/items/:itemId', deleteItem);

// Ciência (acks)
router.get('/acks', listAcknowledgements);
router.get('/acks/:userId', userAcknowledgements);

export default router;
