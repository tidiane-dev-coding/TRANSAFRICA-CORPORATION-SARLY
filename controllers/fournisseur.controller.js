import Fournisseur from '../models/Fournisseur.model.js';
import BonCommande from '../models/BonCommande.model.js';
import PaiementFournisseur from '../models/PaiementFournisseur.model.js';
import FournitureFournisseur from '../models/FournitureFournisseur.model.js';
import Settings from '../models/Settings.model.js';
import { generateFournitureFournisseurPDF } from '../utils/pdfGenerator.js';

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

// @desc    Enregistrer un paiement fournisseur (affiché uniquement côté fournisseur / historique)
// @route   POST /api/fournisseurs/:id/paiements
// @access  Private
export const createPaiementFournisseur = async (req, res) => {
  try {
    const fournisseurId = req.params.id;
    const fournisseur = await Fournisseur.findOne({ _id: fournisseurId, ...req.shopFilter });
    if (!fournisseur) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    const { montant, modePaiement, notes, bonCommande, typePaiement, datePaiement } = req.body;
    const m = Number(montant);
    if (!Number.isFinite(m) || m <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }

    const allowedTypes = ['integral', 'partiel', 'avance'];
    const type = allowedTypes.includes(typePaiement) ? typePaiement : null;
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type de paiement requis : integral (tout), partiel ou avance'
      });
    }

    const shopId = fournisseur.shop;

    const paiement = await PaiementFournisseur.create({
      fournisseur: fournisseur._id,
      bonCommande: bonCommande || undefined,
      montant: m,
      modePaiement: modePaiement || 'especes',
      typePaiement: type,
      notes,
      datePaiement: datePaiement ? new Date(datePaiement) : new Date(),
      createdBy: req.user._id,
      shop: shopId
    });

    fournisseur.dette = Math.max(0, (fournisseur.dette || 0) - m);
    await fournisseur.save();

    const populated = await PaiementFournisseur.findById(paiement._id)
      .populate('bonCommande', 'numero')
      .populate('createdBy', 'nom');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du paiement',
      error: error.message
    });
  }
};

// @desc    Create fourniture for fournisseur
// @route   POST /api/fournisseurs/:id/fournitures
// @access  Private
export const createFournitureFournisseur = async (req, res) => {
  try {
    const fournisseurId = req.params.id;
    const fournisseur = await Fournisseur.findOne({ _id: fournisseurId, ...req.shopFilter });
    if (!fournisseur) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    const { articles, modeFourniture, prixDouaniere, dateFourniture, notes } = req.body;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ success: false, message: 'Au moins un article est requis' });
    }

    const articlesData = [];
    let montantTotal = 0;
    for (const a of articles) {
      if (!a.designation || !String(a.designation).trim()) {
        return res.status(400).json({ success: false, message: 'Désignation requise pour tous les articles' });
      }
      const quantite = Number(a.quantite);
      const prixUnitaire = Number(a.prixUnitaire);
      if (!Number.isFinite(quantite) || quantite <= 0) {
        return res.status(400).json({ success: false, message: 'Quantité valide requise pour tous les articles' });
      }
      if (!Number.isFinite(prixUnitaire) || prixUnitaire < 0) {
        return res.status(400).json({ success: false, message: 'Prix unitaire valide requis pour tous les articles' });
      }
      const montant = quantite * prixUnitaire;
      montantTotal += montant;
      articlesData.push({
        designation: String(a.designation).trim(),
        quantite,
        prixUnitaire,
        montant
      });
    }

    const douane = Number(prixDouaniere) || 0;
    if (douane < 0) {
      return res.status(400).json({ success: false, message: 'Prix douanière invalide' });
    }

    const year = new Date().getFullYear();
    const numero = `FOUR-${year}-${Date.now().toString().slice(-6)}`;

    const fourniture = await FournitureFournisseur.create({
      numero,
      fournisseur: fournisseur._id,
      articles: articlesData,
      modeFourniture: modeFourniture || '',
      prixDouaniere: douane,
      montantTotal,
      montantTotalAvecDouane: montantTotal + douane,
      dateFourniture: dateFourniture ? new Date(dateFourniture) : new Date(),
      notes: notes || '',
      createdBy: req.user._id,
      shop: req.shopFilter?.shop || fournisseur.shop
    });

    res.status(201).json({ success: true, data: fourniture });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Erreur lors de la création de la fourniture', error: error.message });
  }
};

// @desc    Get fournitures for a fournisseur
// @route   GET /api/fournisseurs/:id/fournitures
// @access  Private
export const getFournituresFournisseur = async (req, res) => {
  try {
    const fournisseurId = req.params.id;
    const fournisseur = await Fournisseur.findOne({ _id: fournisseurId, ...req.shopFilter });
    if (!fournisseur) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    const fournitures = await FournitureFournisseur.find({ fournisseur: fournisseurId, ...req.shopFilter })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: fournitures.length, data: fournitures });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des fournitures', error: error.message });
  }
};

// @desc    Generate PDF for a fourniture
// @route   GET /api/fournisseurs/fournitures/:id/pdf
// @access  Private
export const generateFournitureFournisseurPDFRoute = async (req, res) => {
  try {
    const fourniture = await FournitureFournisseur.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('fournisseur')
      .populate('createdBy', 'nom');

    if (!fourniture) {
      return res.status(404).json({ success: false, message: 'Fourniture non trouvée' });
    }

    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : 'Gestion Commerciale';

    const pdfBuffer = await generateFournitureFournisseurPDF(
      fourniture,
      fourniture.fournisseur,
      fourniture.createdBy,
      boutiqueName,
      settings
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fourniture-${fourniture.numero}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la génération du PDF', error: error.message });
  }
};

