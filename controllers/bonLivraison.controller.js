import BonLivraison from '../models/BonLivraison.model.js';
import Client from '../models/Client.model.js';
import Facture from '../models/Facture.model.js';
import Product from '../models/Product.model.js';
import Settings from '../models/Settings.model.js';
import { generateBonLivraisonNumero } from '../utils/generateNumero.js';
import { generateBonLivraisonPDF } from '../utils/pdfGenerator.js';

// @desc    Get all bons livraison
// @route   GET /api/bons-livraison
// @access  Private
export const getBonsLivraison = async (req, res) => {
  try {
    const { client, facture, startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (client) query.client = client;
    if (facture) query.facture = facture;
    if (startDate || endDate) {
      query.dateLivraison = {};
      if (startDate) query.dateLivraison.$gte = new Date(startDate);
      if (endDate) query.dateLivraison.$lte = new Date(endDate);
    }

    const bonsLivraison = await BonLivraison.find(query)
      .populate('client', 'nom prenom')
      .populate('facture', 'numero')
      .populate('articles.product', 'nom categorie')
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bonsLivraison.length,
      data: bonsLivraison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des bons de livraison',
      error: error.message
    });
  }
};

// @desc    Get single bon livraison
// @route   GET /api/bons-livraison/:id
// @access  Private
export const getBonLivraison = async (req, res) => {
  try {
    const bonLivraison = await BonLivraison.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('client')
      .populate('facture')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    if (!bonLivraison) {
      return res.status(404).json({
        success: false,
        message: 'Bon de livraison non trouvé'
      });
    }

    res.json({
      success: true,
      data: bonLivraison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du bon de livraison',
      error: error.message
    });
  }
};

// @desc    Create bon livraison
// @route   POST /api/bons-livraison
// @access  Private
export const createBonLivraison = async (req, res) => {
  try {
    const { client, facture, articles, dateLivraison, transporteur, notes } = req.body;

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

    // Validate client
    const clientDoc = await Client.findOne({ _id: client, shop: shopId });
    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé ou n\'appartient pas à cette boutique'
      });
    }

    // Validate facture if provided
    if (facture) {
      const factureDoc = await Facture.findOne({ _id: facture, shop: shopId });
      if (!factureDoc) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée ou n\'appartient pas à cette boutique'
        });
      }
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
    const numero = await generateBonLivraisonNumero(BonLivraison);

    // Create bon livraison
    const bonLivraison = await BonLivraison.create({
      numero,
      client,
      facture,
      articles: articlesData,
      montantTotal,
      dateLivraison: dateLivraison || new Date(),
      transporteur,
      notes,
      createdBy: req.user._id,
      shop: shopId
    });

    const populatedBonLivraison = await BonLivraison.findById(bonLivraison._id)
      .populate('client')
      .populate('facture', 'numero')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedBonLivraison
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du bon de livraison',
      error: error.message
    });
  }
};

// @desc    Generate PDF
// @route   GET /api/bons-livraison/:id/pdf
// @access  Private
export const generateBonLivraisonPDFRoute = async (req, res) => {
  try {
    const bonLivraison = await BonLivraison.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    if (!bonLivraison) {
      return res.status(404).json({
        success: false,
        message: 'Bon de livraison non trouvé'
      });
    }

    // Récupérer les paramètres de la boutique
    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : 'Gestion Commerciale';

    const pdfBuffer = await generateBonLivraisonPDF(bonLivraison, bonLivraison.client, bonLivraison.createdBy, boutiqueName, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bon-livraison-${bonLivraison.numero}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

