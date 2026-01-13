import StockMovement from '../models/StockMovement.model.js';
import Product from '../models/Product.model.js';

// @desc    Get all stock movements
// @route   GET /api/stock
// @access  Private
export const getStockMovements = async (req, res) => {
  try {
    const { product, type, startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (product) query.product = product;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('product', 'nom categorie')
      .populate('createdBy', 'nom')
      .populate('facture', 'numero')
      .populate('bonCommande', 'numero')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: movements.length,
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements',
      error: error.message
    });
  }
};

// @desc    Create stock entry
// @route   POST /api/stock/entree
// @access  Private
export const createStockEntry = async (req, res) => {
  try {
    const { product, quantite, prixUnitaire, motif, reference, bonCommande } = req.body;

    // Set shop from user's shop or from request
    const shopId = req.user.role === 'admin' 
      ? (req.body.shop || req.query.shopId)
      : (req.user.shop._id || req.user.shop);
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Get product
    const productDoc = await Product.findOne({ _id: product, shop: shopId });
    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé ou n\'appartient pas à cette boutique'
      });
    }

    // Calculate total
    const montantTotal = quantite * prixUnitaire;

    // Create movement
    const movement = await StockMovement.create({
      product,
      type: 'entree',
      quantite,
      prixUnitaire,
      montantTotal,
      motif,
      reference,
      bonCommande,
      createdBy: req.user._id,
      shop: shopId
    });

    // Update product stock
    productDoc.stockActuel += quantite;
    await productDoc.save();

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('product', 'nom categorie')
      .populate('createdBy', 'nom')
      .populate('bonCommande', 'numero');

    res.status(201).json({
      success: true,
      data: populatedMovement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de l\'entrée de stock',
      error: error.message
    });
  }
};

// @desc    Create stock exit
// @route   POST /api/stock/sortie
// @access  Private
export const createStockExit = async (req, res) => {
  try {
    const { product, quantite, prixUnitaire, motif, reference, facture } = req.body;

    // Set shop from user's shop or from request
    const shopId = req.user.role === 'admin' 
      ? (req.body.shop || req.query.shopId)
      : (req.user.shop._id || req.user.shop);
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Get product
    const productDoc = await Product.findOne({ _id: product, shop: shopId });
    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé ou n\'appartient pas à cette boutique'
      });
    }

    // Check stock availability
    if (productDoc.stockActuel < quantite) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Stock disponible: ${productDoc.stockActuel}`
      });
    }

    // Calculate total
    const montantTotal = quantite * prixUnitaire;

    // Create movement
    const movement = await StockMovement.create({
      product,
      type: 'sortie',
      quantite,
      prixUnitaire,
      montantTotal,
      motif,
      reference,
      facture,
      createdBy: req.user._id,
      shop: shopId
    });

    // Update product stock
    productDoc.stockActuel -= quantite;
    await productDoc.save();

    const populatedMovement = await StockMovement.findById(movement._id)
      .populate('product', 'nom categorie')
      .populate('createdBy', 'nom')
      .populate('facture', 'numero');

    res.status(201).json({
      success: true,
      data: populatedMovement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la sortie de stock',
      error: error.message
    });
  }
};

// @desc    Clear all stock (reset stockActuel to 0 for all products)
// @route   DELETE /api/stock/clear-stock
// @access  Private (Admin only)
export const clearStock = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Reset stockActuel to 0 for all products in the shop
    const result = await Product.updateMany(
      { shop: shopId },
      { $set: { stockActuel: 0 } }
    );

    res.json({
      success: true,
      message: `Stock réinitialisé pour ${result.modifiedCount} produit(s)`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du stock',
      error: error.message
    });
  }
};

// @desc    Clear all stock entries (entree)
// @route   DELETE /api/stock/clear-entries
// @access  Private (Admin only)
export const clearEntries = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Delete all entries (type: 'entree') for the shop
    const result = await StockMovement.deleteMany({
      shop: shopId,
      type: 'entree'
    });

    res.json({
      success: true,
      message: `${result.deletedCount} entrée(s) de stock supprimée(s)`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des entrées',
      error: error.message
    });
  }
};

// @desc    Clear all stock exits (sortie)
// @route   DELETE /api/stock/clear-exits
// @access  Private (Admin only)
export const clearExits = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Delete all exits (type: 'sortie') for the shop
    const result = await StockMovement.deleteMany({
      shop: shopId,
      type: 'sortie'
    });

    res.json({
      success: true,
      message: `${result.deletedCount} sortie(s) de stock supprimée(s)`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des sorties',
      error: error.message
    });
  }
};

// @desc    Clear all stock movements (both entries and exits)
// @route   DELETE /api/stock/clear-all
// @access  Private (Admin only)
export const clearAllMovements = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.body.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Boutique requise'
      });
    }

    // Delete all movements for the shop
    const result = await StockMovement.deleteMany({
      shop: shopId
    });

    res.json({
      success: true,
      message: `${result.deletedCount} mouvement(s) de stock supprimé(s)`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des mouvements',
      error: error.message
    });
  }
};

// @desc    Clear all stock for ALL shops
// @route   DELETE /api/stock/clear-stock-all
// @access  Private (Admin only)
export const clearStockAll = async (req, res) => {
  try {
    // Reset stockActuel to 0 for all products in all shops
    const result = await Product.updateMany(
      {},
      { $set: { stockActuel: 0 } }
    );

    res.json({
      success: true,
      message: `Stock réinitialisé pour ${result.modifiedCount} produit(s) dans toutes les boutiques`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du stock',
      error: error.message
    });
  }
};

// @desc    Clear all stock entries for ALL shops
// @route   DELETE /api/stock/clear-entries-all
// @access  Private (Admin only)
export const clearEntriesAll = async (req, res) => {
  try {
    // Delete all entries (type: 'entree') for all shops
    const result = await StockMovement.deleteMany({
      type: 'entree'
    });

    res.json({
      success: true,
      message: `${result.deletedCount} entrée(s) de stock supprimée(s) dans toutes les boutiques`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des entrées',
      error: error.message
    });
  }
};

// @desc    Clear all stock exits for ALL shops
// @route   DELETE /api/stock/clear-exits-all
// @access  Private (Admin only)
export const clearExitsAll = async (req, res) => {
  try {
    // Delete all exits (type: 'sortie') for all shops
    const result = await StockMovement.deleteMany({
      type: 'sortie'
    });

    res.json({
      success: true,
      message: `${result.deletedCount} sortie(s) de stock supprimée(s) dans toutes les boutiques`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des sorties',
      error: error.message
    });
  }
};

// @desc    Clear all stock movements for ALL shops
// @route   DELETE /api/stock/clear-all-shops
// @access  Private (Admin only)
export const clearAllMovementsAll = async (req, res) => {
  try {
    // Delete all movements for all shops
    const result = await StockMovement.deleteMany({});

    res.json({
      success: true,
      message: `${result.deletedCount} mouvement(s) de stock supprimé(s) dans toutes les boutiques`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des mouvements',
      error: error.message
    });
  }
};

