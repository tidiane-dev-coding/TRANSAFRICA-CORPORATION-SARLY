import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, adminOnly, updateSettings);

export default router;

