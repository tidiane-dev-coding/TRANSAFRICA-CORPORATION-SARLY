import express from 'express';
import {
  getStockMovements,
  createStockEntry,
  createStockExit,
  clearStock,
  clearEntries,
  clearExits,
  clearAllMovements,
  clearStockAll,
  clearEntriesAll,
  clearExitsAll,
  clearAllMovementsAll
} from '../controllers/stock.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getStockMovements);
router.post('/entree', protect, createStockEntry);
router.post('/sortie', protect, createStockExit);

// Admin only routes for clearing data (single shop)
router.delete('/clear-stock', protect, adminOnly, clearStock);
router.delete('/clear-entries', protect, adminOnly, clearEntries);
router.delete('/clear-exits', protect, adminOnly, clearExits);
router.delete('/clear-all', protect, adminOnly, clearAllMovements);

// Admin only routes for clearing data (all shops)
router.delete('/clear-stock-all', protect, adminOnly, clearStockAll);
router.delete('/clear-entries-all', protect, adminOnly, clearEntriesAll);
router.delete('/clear-exits-all', protect, adminOnly, clearExitsAll);
router.delete('/clear-all-shops', protect, adminOnly, clearAllMovementsAll);

export default router;

