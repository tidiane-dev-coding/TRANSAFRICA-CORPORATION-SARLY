import Fournisseur from '../models/Fournisseur.model.js';
import BonCommande from '../models/BonCommande.model.js';
import PaiementFournisseur from '../models/PaiementFournisseur.model.js';

// @desc    Get all fournisseurs
// @route   GET /api/fournisseurs
// @access  Private
export const getFournisseurs = async (req, res) => {
  try {
    const { search, hasDebt } = req.query;
    const query = { isActive: true, ...req.shopFilter };

    if (search) {
      query.$text = { $search: search };
    }
    if (hasDebt === 'true') {
      query.dette = { $gt: 0 };
    }

    const fournisseurs = await Fournisseur.find(query).sort({ nom: 1 });
    
    res.json({
      success: true,
      count: fournisseurs.length,
      data: fournisseurs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fournisseurs',
      error: error.message
    });
  }
};

// @desc    Get single fournisseur
// @route   GET /api/fournisseurs/:id
// @access  Private
export const getFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findOne({ _id: req.params.id, ...req.shopFilter });
    
    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    res.json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fournisseur',
      error: error.message
    });
  }
};

// @desc    Create fournisseur
// @route   POST /api/fournisseurs
// @access  Private
export const createFournisseur = async (req, res) => {
  try {
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
    
    const fournisseur = await Fournisseur.create({ ...req.body, shop: shopId });
    
    res.status(201).json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du fournisseur',
      error: error.message
    });
  }
};

// @desc    Update fournisseur
// @route   PUT /api/fournisseurs/:id
// @access  Private
export const updateFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    res.json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du fournisseur',
      error: error.message
    });
  }
};

// @desc    Delete fournisseur
// @route   DELETE /api/fournisseurs/:id
// @access  Private
export const deleteFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      { isActive: false },
      { new: true }
    );

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Fournisseur supprimé',
      data: fournisseur
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fournisseur',
      error: error.message
    });
  }
};

// @desc    Get fournisseur history
// @route   GET /api/fournisseurs/:id/history
// @access  Private
export const getFournisseurHistory = async (req, res) => {
  try {
    const fournisseurId = req.params.id;

    const bonsCommande = await BonCommande.find({ fournisseur: fournisseurId, ...req.shopFilter })
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    const paiements = await PaiementFournisseur.find({ fournisseur: fournisseurId, ...req.shopFilter })
      .populate('bonCommande', 'numero')
      .populate('createdBy', 'nom')
      .sort({ datePaiement: -1 });

    res.json({
      success: true,
      data: {
        bonsCommande,
        paiements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

