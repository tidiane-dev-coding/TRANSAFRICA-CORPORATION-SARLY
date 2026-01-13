import BonCommande from '../models/BonCommande.model.js';
import Fournisseur from '../models/Fournisseur.model.js';
import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import Settings from '../models/Settings.model.js';
import { generateBonCommandeNumero } from '../utils/generateNumero.js';
import { generateBonCommandePDF } from '../utils/pdfGenerator.js';

// @desc    Get all bons commande
// @route   GET /api/bons-commande
// @access  Private
export const getBonsCommande = async (req, res) => {
  try {
    const { fournisseur, statut, startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (fournisseur) query.fournisseur = fournisseur;
    if (statut) query.statut = statut;
    if (startDate || endDate) {
      query.dateCommande = {};
      if (startDate) query.dateCommande.$gte = new Date(startDate);
      if (endDate) query.dateCommande.$lte = new Date(endDate);
    }

    const bonsCommande = await BonCommande.find(query)
      .populate('fournisseur', 'nom')
      .populate('articles.product', 'nom categorie')
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bonsCommande.length,
      data: bonsCommande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bons de commande',
      error: error.message
    });
  }
};

// @desc    Get single bon commande
// @route   GET /api/bons-commande/:id
// @access  Private
export const getBonCommande = async (req, res) => {
  try {
    const bonCommande = await BonCommande.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('fournisseur')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    if (!bonCommande) {
      return res.status(404).json({
        success: false,
        message: 'Bon de commande non trouvé'
      });
    }

    res.json({
      success: true,
      data: bonCommande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du bon de commande',
      error: error.message
    });
  }
};

// @desc    Create bon commande
// @route   POST /api/bons-commande
// @access  Private
export const createBonCommande = async (req, res) => {
  try {
    const { fournisseur, articles, dateCommande, dateLivraisonPrevue, notes } = req.body;

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

    // Validate fournisseur
    const fournisseurDoc = await Fournisseur.findOne({ _id: fournisseur, shop: shopId });
    if (!fournisseurDoc) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé ou n\'appartient pas à cette boutique'
      });
    }

    // Validate articles
    let montantTotal = 0;
    const articlesData = [];

    for (const article of articles) {
      const product = await Product.findOne({ _id: article.product, shop: shopId });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit ${article.product} non trouvé ou n'appartient pas à cette boutique`
        });
      }

      const montant = article.quantite * article.prixUnitaire;
      montantTotal += montant;

      articlesData.push({
        product: article.product,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        montant
      });
    }

    // Generate number
    const numero = await generateBonCommandeNumero(BonCommande);

    // Create bon commande
    const bonCommande = await BonCommande.create({
      numero,
      fournisseur,
      articles: articlesData,
      montantTotal,
      dateCommande: dateCommande || new Date(),
      dateLivraisonPrevue,
      notes,
      createdBy: req.user._id,
      shop: shopId
    });

    // Update fournisseur debt
    fournisseurDoc.dette += montantTotal;
    await fournisseurDoc.save();

    const populatedBonCommande = await BonCommande.findById(bonCommande._id)
      .populate('fournisseur')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedBonCommande
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du bon de commande',
      error: error.message
    });
  }
};

// @desc    Update bon commande status
// @route   PUT /api/bons-commande/:id/status
// @access  Private
export const updateBonCommandeStatus = async (req, res) => {
  try {
    const { statut } = req.body;

    const bonCommande = await BonCommande.findOne({ _id: req.params.id, ...req.shopFilter });
    if (!bonCommande) {
      return res.status(404).json({
        success: false,
        message: 'Bon de commande non trouvé'
      });
    }

    // If status is "livre", update stock
    if (statut === 'livre' && bonCommande.statut !== 'livre') {
      for (const article of bonCommande.articles) {
        const product = await Product.findById(article.product);
        product.stockActuel += article.quantite;
        await product.save();

        await StockMovement.create({
          product: article.product,
          type: 'entree',
          quantite: article.quantite,
          prixUnitaire: article.prixUnitaire,
          montantTotal: article.montant,
          motif: 'Réception bon de commande',
          reference: bonCommande.numero,
          bonCommande: bonCommande._id,
          createdBy: req.user._id,
          shop: bonCommande.shop
        });
      }
    }

    bonCommande.statut = statut;
    await bonCommande.save();

    const updatedBonCommande = await BonCommande.findById(bonCommande._id)
      .populate('fournisseur')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.json({
      success: true,
      data: updatedBonCommande
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// @desc    Generate PDF
// @route   GET /api/bons-commande/:id/pdf
// @access  Private
export const generateBonCommandePDFRoute = async (req, res) => {
  try {
    const bonCommande = await BonCommande.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('fournisseur')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    if (!bonCommande) {
      return res.status(404).json({
        success: false,
        message: 'Bon de commande non trouvé'
      });
    }

    // Récupérer les paramètres de la boutique
    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : 'Gestion Commerciale';

    const pdfBuffer = await generateBonCommandePDF(bonCommande, bonCommande.fournisseur, bonCommande.createdBy, boutiqueName, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bon-commande-${bonCommande.numero}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

