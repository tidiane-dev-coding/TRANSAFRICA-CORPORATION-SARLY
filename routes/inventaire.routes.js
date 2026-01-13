import express from 'express';
import {
  getInventaires,
  getInventaire,
  createInventaire,
  getCurrentStock
} from '../controllers/inventaire.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getInventaires);
router.get('/current-stock', protect, getCurrentStock);
router.get('/:id', protect, getInventaire);
router.post('/', protect, createInventaire);

export default router;

