import Depense from '../models/Depense.model.js';

// @desc    Get all depenses
// @route   GET /api/depenses
// @access  Private
export const getDepenses = async (req, res) => {
  try {
    const { categorie, startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (categorie) query.categorie = categorie;
    if (startDate || endDate) {
      query.dateDepense = {};
      if (startDate) query.dateDepense.$gte = new Date(startDate);
      if (endDate) query.dateDepense.$lte = new Date(endDate);
    }

    const depenses = await Depense.find(query)
      .populate('createdBy', 'nom')
      .sort({ dateDepense: -1 });

    res.json({
      success: true,
      count: depenses.length,
      data: depenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dépenses',
      error: error.message
    });
  }
};

// @desc    Get single depense
// @route   GET /api/depenses/:id
// @access  Private
export const getDepense = async (req, res) => {
  try {
    const depense = await Depense.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('createdBy', 'nom');

    if (!depense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }

    res.json({
      success: true,
      data: depense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la dépense',
      error: error.message
    });
  }
};

// @desc    Create depense
// @route   POST /api/depenses
// @access  Private
export const createDepense = async (req, res) => {
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

    const depense = await Depense.create({
      ...req.body,
      createdBy: req.user._id,
      shop: shopId
    });

    const populatedDepense = await Depense.findById(depense._id)
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedDepense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la dépense',
      error: error.message
    });
  }
};

// @desc    Update depense
// @route   PUT /api/depenses/:id
// @access  Private
export const updateDepense = async (req, res) => {
  try {
    const depense = await Depense.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!depense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }

    const populatedDepense = await Depense.findById(depense._id)
      .populate('createdBy', 'nom');

    res.json({
      success: true,
      data: populatedDepense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la dépense',
      error: error.message
    });
  }
};

// @desc    Delete depense
// @route   DELETE /api/depenses/:id
// @access  Private
export const deleteDepense = async (req, res) => {
  try {
    const depense = await Depense.findOneAndDelete({ _id: req.params.id, ...req.shopFilter });

    if (!depense) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Dépense supprimée'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la dépense',
      error: error.message
    });
  }
};

// @desc    Get categories
// @route   GET /api/depenses/categories/list
// @access  Private
export const getDepenseCategories = async (req, res) => {
  try {
    const categories = await Depense.distinct('categorie', req.shopFilter);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
};

