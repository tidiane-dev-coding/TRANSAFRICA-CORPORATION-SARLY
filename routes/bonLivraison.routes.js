import express from 'express';
import {
  getBonsLivraison,
  getBonLivraison,
  createBonLivraison,
  generateBonLivraisonPDFRoute
} from '../controllers/bonLivraison.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getBonsLivraison);
router.get('/:id', protect, getBonLivraison);
router.get('/:id/pdf', protect, generateBonLivraisonPDFRoute);
router.post('/', protect, createBonLivraison);

export default router;

