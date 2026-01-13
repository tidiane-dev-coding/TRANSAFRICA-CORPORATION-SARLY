import express from 'express';
import {
  getConfies,
  getConfie,
  createConfie,
  addVersement,
  updateConfie,
  deleteConfie,
  generateVersementPDFRoute,
  generateAllVersementReceipts
} from '../controllers/confie.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getConfies);
router.get('/versements/receipts/all', protect, generateAllVersementReceipts);
router.get('/:id', protect, getConfie);
router.get('/:id/versement/:versementIndex/pdf', protect, generateVersementPDFRoute);
router.post('/', protect, createConfie);
router.post('/:id/versement', protect, addVersement);
router.put('/:id', protect, updateConfie);
router.delete('/:id', protect, deleteConfie);

export default router;

