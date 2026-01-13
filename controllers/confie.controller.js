import Confie from '../models/Confie.model.js';
import Shop from '../models/Shop.model.js';
import Settings from '../models/Settings.model.js';
import { generateVersementPDF } from '../utils/pdfGenerator.js';
import archiver from 'archiver';

// @desc    Get all confie
// @route   GET /api/confie
// @access  Private
export const getConfies = async (req, res) => {
  try {
    const { statut, beneficiaire } = req.query;
    const query = { ...req.shopFilter };

    if (statut) query.statut = statut;
    if (beneficiaire) {
      query.$text = { $search: beneficiaire };
    }

    const confies = await Confie.find(query)
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: confies.length,
      data: confies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des confiés',
      error: error.message
    });
  }
};

// @desc    Get single confie
// @route   GET /api/confie/:id
// @access  Private
export const getConfie = async (req, res) => {
  try {
    const confie = await Confie.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('createdBy', 'nom');

    if (!confie) {
      return res.status(404).json({
        success: false,
        message: 'Confié non trouvé'
      });
    }

    res.json({
      success: true,
      data: confie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du confié',
      error: error.message
    });
  }
};

// @desc    Create confie
// @route   POST /api/confie
// @access  Private
export const createConfie = async (req, res) => {
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

    const confie = await Confie.create({
      ...req.body,
      createdBy: req.user._id,
      shop: shopId
    });

    const populatedConfie = await Confie.findById(confie._id)
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedConfie
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du confié',
      error: error.message
    });
  }
};

// @desc    Add versement
// @route   POST /api/confie/:id/versement
// @access  Private
export const addVersement = async (req, res) => {
  try {
    const { montant, notes } = req.body;

    const confie = await Confie.findOne({ _id: req.params.id, ...req.shopFilter });
    if (!confie) {
      return res.status(404).json({
        success: false,
        message: 'Confié non trouvé'
      });
    }

    if (confie.statut === 'rembourse') {
      return res.status(400).json({
        success: false,
        message: 'Ce confié est déjà remboursé'
      });
    }

    const totalVersements = confie.versements.reduce((sum, v) => sum + v.montant, 0);
    if (totalVersements + montant > confie.montantConfie) {
      return res.status(400).json({
        success: false,
        message: 'Le montant du versement dépasse le montant confié'
      });
    }

    confie.versements.push({
      montant,
      notes,
      dateVersement: new Date()
    });

    await confie.save();

    const updatedConfie = await Confie.findById(confie._id)
      .populate('createdBy', 'nom');

    res.json({
      success: true,
      data: updatedConfie
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'ajout du versement',
      error: error.message
    });
  }
};

// @desc    Update confie
// @route   PUT /api/confie/:id
// @access  Private
export const updateConfie = async (req, res) => {
  try {
    const confie = await Confie.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!confie) {
      return res.status(404).json({
        success: false,
        message: 'Confié non trouvé'
      });
    }

    const populatedConfie = await Confie.findById(confie._id)
      .populate('createdBy', 'nom');

    res.json({
      success: true,
      data: populatedConfie
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du confié',
      error: error.message
    });
  }
};

// @desc    Delete confie
// @route   DELETE /api/confie/:id
// @access  Private
export const deleteConfie = async (req, res) => {
  try {
    const confie = await Confie.findOneAndDelete({ _id: req.params.id, ...req.shopFilter });

    if (!confie) {
      return res.status(404).json({
        success: false,
        message: 'Confié non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Confié supprimé'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du confié',
      error: error.message
    });
  }
};

// @desc    Generate versement receipt PDF
// @route   GET /api/confie/:id/versement/:versementIndex/pdf
// @access  Private
export const generateVersementPDFRoute = async (req, res) => {
  try {
    const confie = await Confie.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('createdBy', 'nom')
      .populate('shop');

    if (!confie) {
      return res.status(404).json({
        success: false,
        message: 'Confié non trouvé'
      });
    }

    const versementIndex = parseInt(req.params.versementIndex);
    if (versementIndex < 0 || versementIndex >= confie.versements.length) {
      return res.status(404).json({
        success: false,
        message: 'Versement non trouvé'
      });
    }

    const versement = confie.versements[versementIndex];

    // Get settings and shop info
    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : null;
    const shop = await Shop.findById(confie.shop);

    const pdfBuffer = await generateVersementPDF(
      confie, 
      versement, 
      versementIndex, 
      confie.createdBy, 
      boutiqueName, 
      settings, 
      shop
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recu-versement-${confie._id.toString().slice(-6)}-${versementIndex + 1}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

// @desc    Generate all versement receipts for all shops (or specific shop)
// @route   GET /api/confie/versements/receipts/all
// @access  Private (Admin can see all, employees see only their shop)
export const generateAllVersementReceipts = async (req, res) => {
  try {
    // Use shopFilter which already handles admin vs employee logic
    const query = { ...req.shopFilter };

    // Get all confies with versements
    const confies = await Confie.find(query)
      .populate('createdBy', 'nom')
      .populate('shop')
      .sort({ createdAt: -1 });

    if (confies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun confié avec versements trouvé'
      });
    }

    // Get settings
    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : null;

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=recus-versements-${new Date().toISOString().split('T')[0]}.zip`);
    
    archive.pipe(res);

    // Generate PDF for each versement
    let count = 0;
    for (const confie of confies) {
      if (confie.versements && confie.versements.length > 0) {
        const shop = await Shop.findById(confie.shop);
        
        for (let i = 0; i < confie.versements.length; i++) {
          const versement = confie.versements[i];
          try {
            const pdfBuffer = await generateVersementPDF(
              confie,
              versement,
              i,
              confie.createdBy,
              boutiqueName,
              settings,
              shop
            );

            const shopName = shop?.nom || 'Boutique';
            const fileName = `recu-versement-${shopName.replace(/\s+/g, '-')}-${confie.beneficiaire.replace(/\s+/g, '-')}-${i + 1}.pdf`;
            archive.append(pdfBuffer, { name: fileName });
            count++;
          } catch (error) {
            console.error(`Erreur lors de la génération du PDF pour le versement ${i} du confié ${confie._id}:`, error);
          }
        }
      }
    }

    if (count === 0) {
      archive.abort();
      return res.status(404).json({
        success: false,
        message: 'Aucun versement trouvé pour générer les reçus'
      });
    }

    archive.finalize();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des reçus',
      error: error.message
    });
  }
};

