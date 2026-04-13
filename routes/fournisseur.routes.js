import express from 'express';
import {
  getFournisseurs,
  getFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  getFournisseurHistory,
  createFournitureFournisseur,
  getFournituresFournisseur,
  generateFournitureFournisseurPDFRoute,
  createPaiementFournisseur
} from '../controllers/fournisseur.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getFournisseurs);
router.get('/fournitures/:id/pdf', protect, generateFournitureFournisseurPDFRoute);
router.get('/:id', protect, getFournisseur);
router.get('/:id/history', protect, getFournisseurHistory);
router.get('/:id/fournitures', protect, getFournituresFournisseur);
router.post('/', protect, createFournisseur);
router.post('/:id/fournitures', protect, createFournitureFournisseur);
router.post('/:id/paiements', protect, createPaiementFournisseur);
router.put('/:id', protect, updateFournisseur);
router.delete('/:id', protect, deleteFournisseur);

export default router;

