import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientHistory,
  recalculateClientBalance
} from '../controllers/client.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getClients);
router.get('/:id', protect, getClient);
router.get('/:id/history', protect, getClientHistory);
router.put('/:id/recalculate-balance', protect, recalculateClientBalance);
router.post('/', protect, createClient);
router.put('/:id', protect, updateClient);
router.delete('/:id', protect, deleteClient);

export default router;

