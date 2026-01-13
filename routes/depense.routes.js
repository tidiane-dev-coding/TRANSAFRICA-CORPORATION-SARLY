import express from 'express';
import {
  getDepenses,
  getDepense,
  createDepense,
  updateDepense,
  deleteDepense,
  getDepenseCategories
} from '../controllers/depense.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getDepenses);
router.get('/categories/list', protect, getDepenseCategories);
router.get('/:id', protect, getDepense);
router.post('/', protect, createDepense);
router.put('/:id', protect, updateDepense);
router.delete('/:id', protect, deleteDepense);

export default router;

