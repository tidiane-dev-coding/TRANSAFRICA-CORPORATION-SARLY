import express from 'express';
import {
  getBonsCommande,
  getBonCommande,
  createBonCommande,
  updateBonCommandeStatus,
  generateBonCommandePDFRoute
} from '../controllers/bonCommande.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getBonsCommande);
router.get('/:id', protect, getBonCommande);
router.get('/:id/pdf', protect, generateBonCommandePDFRoute);
router.post('/', protect, createBonCommande);
router.put('/:id/status', protect, updateBonCommandeStatus);

export default router;

