import express from 'express';
import multer from 'multer';
import {
  getShops,
  getShop,
  createShop,
  updateShop,
  deleteShop
} from '../controllers/shop.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { uploadLogo } from '../middleware/upload.middleware.js';

const router = express.Router();

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux (max 5MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'upload du fichier',
      error: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur lors de l\'upload du fichier'
    });
  }
  next();
};

router.route('/')
  .get(protect, getShops)
  .post(protect, adminOnly, uploadLogo, handleUploadError, createShop);

router.route('/:id')
  .get(protect, getShop)
  .put(protect, adminOnly, uploadLogo, handleUploadError, updateShop)
  .delete(protect, adminOnly, deleteShop);

export default router;

