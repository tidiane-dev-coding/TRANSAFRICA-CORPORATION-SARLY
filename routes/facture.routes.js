import express from 'express';
import {
  getFactures,
  getFacture,
  createFacture,
  updateFacturePayment,
  generateFacturePDFRoute
  , updateFacture,
  deleteFacture
} from '../controllers/facture.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getFactures);
router.get('/:id', protect, getFacture);
router.get('/:id/pdf', protect, generateFacturePDFRoute);
router.post('/', protect, createFacture);
router.put('/:id/payment', protect, updateFacturePayment);
router.put('/:id', protect, updateFacture);
router.delete('/:id', protect, deleteFacture);

export default router;

