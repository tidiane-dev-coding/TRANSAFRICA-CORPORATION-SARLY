import Inventaire from '../models/Inventaire.model.js';
import Product from '../models/Product.model.js';

// @desc    Get all inventaires
// @route   GET /api/inventaire
// @access  Private
export const getInventaires = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (startDate || endDate) {
      query.dateInventaire = {};
      if (startDate) query.dateInventaire.$gte = new Date(startDate);
      if (endDate) query.dateInventaire.$lte = new Date(endDate);
    }

    const inventaires = await Inventaire.find(query)
      .populate('produits.product', 'nom categorie prixAchat')
      .populate('createdBy', 'nom')
      .sort({ dateInventaire: -1 });

    res.json({
      success: true,
      count: inventaires.length,
      data: inventaires
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des inventaires',
      error: error.message
    });
  }
};

// @desc    Get single inventaire
// @route   GET /api/inventaire/:id
// @access  Private
export const getInventaire = async (req, res) => {
  try {
    const inventaire = await Inventaire.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('produits.product', 'nom categorie prixAchat')
      .populate('createdBy', 'nom');

    if (!inventaire) {
      return res.status(404).json({
        success: false,
        message: 'Inventaire non trouvé'
      });
    }

    res.json({
      success: true,
      data: inventaire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'inventaire',
      error: error.message
    });
  }
};

// @desc    Create inventaire
// @route   POST /api/inventaire
// @access  Private
export const createInventaire = async (req, res) => {
  try {
    const { produits, dateInventaire, notes } = req.body;

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

    const produitsData = [];
    let valeurTotale = 0;

    for (const item of produits) {
      const product = await Product.findOne({ _id: item.product, shop: shopId });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit ${item.product} non trouvé ou n'appartient pas à cette boutique`
        });
      }

      const ecart = item.stockReel - item.stockTheorique;
      const valeurStock = item.stockReel * product.prixAchat;
      valeurTotale += valeurStock;

      produitsData.push({
        product: item.product,
        stockTheorique: item.stockTheorique,
        stockReel: item.stockReel,
        ecart,
        valeurStock
      });
    }

    const inventaire = await Inventaire.create({
      produits: produitsData,
      valeurTotale,
      dateInventaire: dateInventaire || new Date(),
      notes,
      createdBy: req.user._id,
      shop: shopId
    });

    // Update product stocks with real stock
    for (const item of produitsData) {
      const product = await Product.findById(item.product);
      product.stockActuel = item.stockReel;
      await product.save();
    }

    const populatedInventaire = await Inventaire.findById(inventaire._id)
      .populate('produits.product', 'nom categorie prixAchat')
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedInventaire
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de l\'inventaire',
      error: error.message
    });
  }
};

// @desc    Get current stock for inventaire
// @route   GET /api/inventaire/current-stock
// @access  Private
export const getCurrentStock = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, ...req.shopFilter })
      .select('nom categorie stockActuel prixAchat')
      .sort({ nom: 1 });

    const stockData = products.map(product => ({
      product: {
        _id: product._id,
        nom: product.nom,
        categorie: product.categorie,
        prixAchat: product.prixAchat
      },
      stockTheorique: product.stockActuel,
      stockReel: product.stockActuel
    }));

    res.json({
      success: true,
      data: stockData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du stock actuel',
      error: error.message
    });
  }
};

