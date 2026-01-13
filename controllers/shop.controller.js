import Shop from '../models/Shop.model.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all shops
// @route   GET /api/shops
// @access  Private (Admin only)
export const getShops = async (req, res) => {
  try {
    // Get all shops, including inactive ones for admin
    const shops = await Shop.find().sort({ nom: 1 });
    
    res.json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des boutiques',
      error: error.message
    });
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Private
export const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la boutique',
      error: error.message
    });
  }
};

// @desc    Create shop
// @route   POST /api/shops
// @access  Private (Admin only)
export const createShop = async (req, res) => {
  try {
    const shopData = { ...req.body };
    
    // Handle logo upload
    if (req.file) {
      shopData.logo = req.file.filename;
    }
    
    const shop = await Shop.create(shopData);
    
    res.status(201).json({
      success: true,
      data: shop
    });
  } catch (error) {
    // Delete uploaded file if shop creation fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/logos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la boutique',
      error: error.message
    });
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (Admin only)
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      // Delete uploaded file if shop not found
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/logos', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    const updateData = { ...req.body };
    
    // Handle logo upload
    if (req.file) {
      // Delete old logo if exists
      if (shop.logo) {
        const oldLogoPath = path.join(__dirname, '../uploads/logos', shop.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      updateData.logo = req.file.filename;
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedShop
    });
  } catch (error) {
    // Delete uploaded file if update fails
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/logos', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la boutique',
      error: error.message
    });
  }
};

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (Admin only)
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Boutique désactivée',
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la boutique',
      error: error.message
    });
  }
};

