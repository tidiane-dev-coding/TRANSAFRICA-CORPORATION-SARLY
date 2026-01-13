import express from 'express';
import {
  getFournisseurs,
  getFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  getFournisseurHistory
} from '../controllers/fournisseur.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getFournisseurs);
router.get('/:id', protect, getFournisseur);
router.get('/:id/history', protect, getFournisseurHistory);
router.post('/', protect, createFournisseur);
router.put('/:id', protect, updateFournisseur);
router.delete('/:id', protect, deleteFournisseur);

export default router;

