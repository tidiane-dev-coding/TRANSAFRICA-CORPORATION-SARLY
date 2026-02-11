import express from 'express';
import {
  getInventaires,
  getInventaire,
  createInventaire,
  updateInventaire,
  deleteInventaire,
  getCurrentStock
} from '../controllers/inventaire.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getInventaires);
router.post('/', protect, createInventaire);
router.get('/current-stock', protect, getCurrentStock);
router.get('/:id', protect, getInventaire);
router.put('/:id', protect, adminOnly, updateInventaire);
router.delete('/:id', protect, adminOnly, deleteInventaire);

export default router;

