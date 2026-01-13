import Facture from '../models/Facture.model.js';
import Client from '../models/Client.model.js';
import Product from '../models/Product.model.js';
import StockMovement from '../models/StockMovement.model.js';
import PaiementClient from '../models/PaiementClient.model.js';
import Settings from '../models/Settings.model.js';
import { generateFactureNumero } from '../utils/generateNumero.js';
import { generateFacturePDF } from '../utils/pdfGenerator.js';

// @desc    Get all factures
// @route   GET /api/factures
// @access  Private
export const getFactures = async (req, res) => {
  try {
    const { client, statut, startDate, endDate } = req.query;
    const query = { ...req.shopFilter };

    if (client) query.client = client;
    if (statut) query.statut = statut;
    if (startDate || endDate) {
      query.dateFacture = {};
      if (startDate) query.dateFacture.$gte = new Date(startDate);
      if (endDate) query.dateFacture.$lte = new Date(endDate);
    }

    const factures = await Facture.find(query)
      .populate('client', 'nom prenom')
      .populate('articles.product', 'nom categorie')
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: factures.length,
      data: factures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
};

// @desc    Get single facture
// @route   GET /api/factures/:id
// @access  Private
export const getFacture = async (req, res) => {
  try {
    const facture = await Facture.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message
    });
  }
};

// @desc    Create facture
// @route   POST /api/factures
// @access  Private
export const createFacture = async (req, res) => {
  try {
    const { client, articles, dateFacture, dateEcheance, notes } = req.body;

    // Set shop from user's shop or from request
    let shopId;
    if (req.user.role === 'admin') {
      // For admin, get shopId from query params (set by API interceptor) or body
      shopId = req.query.shopId || req.body.shop;
      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: 'Boutique requise. Veuillez sélectionner une boutique dans le menu latéral.'
        });
      }
    } else {
      // For employees, use their assigned shop
      if (!req.user.shop) {
        return res.status(400).json({
          success: false,
          message: 'Aucune boutique assignée à cet employé'
        });
      }
      shopId = req.user.shop._id || req.user.shop;
    }

    // Validate client
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client requis'
      });
    }

    const clientDoc = await Client.findOne({ _id: client, shop: shopId });
    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé ou n\'appartient pas à cette boutique'
      });
    }

    // Validate articles
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un article est requis'
      });
    }

    // Validate articles and check stock
    let montantTotal = 0;
    const articlesData = [];

    for (const article of articles) {
      if (!article.product) {
        return res.status(400).json({
          success: false,
          message: 'Produit requis pour tous les articles'
        });
      }

      if (!article.quantite || article.quantite <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantité valide requise pour tous les articles'
        });
      }

      if (!article.prixUnitaire || article.prixUnitaire <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Prix unitaire valide requis pour tous les articles'
        });
      }

      const product = await Product.findOne({ _id: article.product, shop: shopId });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit non trouvé ou n'appartient pas à cette boutique`
        });
      }

      if (product.stockActuel < article.quantite) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.nom}. Stock disponible: ${product.stockActuel}`
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

    // Generate invoice number
    const numero = await generateFactureNumero(Facture);

    // Create facture
    const facture = await Facture.create({
      numero,
      shop: shopId,
      client,
      articles: articlesData,
      montantTotal,
      dateFacture: dateFacture || new Date(),
      dateEcheance,
      notes,
      createdBy: req.user._id
    });

    // Update stock (create stock movements)
    for (const article of articlesData) {
      const product = await Product.findById(article.product);
      product.stockActuel -= article.quantite;
      await product.save();

      await StockMovement.create({
        product: article.product,
        type: 'sortie',
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire,
        montantTotal: article.montant,
        motif: 'Vente',
        reference: numero,
        facture: facture._id,
        shop: shopId,
        createdBy: req.user._id
      });
    }

    // Update client balance if credit sale
    if (req.body.montantPaye === 0 || req.body.montantPaye < montantTotal) {
      clientDoc.solde += (montantTotal - (req.body.montantPaye || 0));
      await clientDoc.save();
    }

    const populatedFacture = await Facture.findById(facture._id)
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.status(201).json({
      success: true,
      data: populatedFacture
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message
    });
  }
};

// @desc    Update facture payment
// @route   PUT /api/factures/:id/payment
// @access  Private
export const updateFacturePayment = async (req, res) => {
  try {
    const { montantPaye, modePaiement, notes } = req.body;

    const facture = await Facture.findOne({ _id: req.params.id, ...req.shopFilter });
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    const newMontantPaye = facture.montantPaye + montantPaye;
    
    if (newMontantPaye > facture.montantTotal) {
      return res.status(400).json({
        success: false,
        message: 'Le montant payé ne peut pas dépasser le montant total'
      });
    }

    facture.montantPaye = newMontantPaye;
    await facture.save();

    // Get shop from facture
    const shopId = facture.shop;

    // Create payment record
    await PaiementClient.create({
      client: facture.client,
      facture: facture._id,
      montant: montantPaye,
      modePaiement: modePaiement || 'especes',
      notes,
      createdBy: req.user._id,
      shop: shopId
    });

    // Update client balance
    const client = await Client.findById(facture.client);
    client.solde = Math.max(0, client.solde - montantPaye);
    await client.save();

    const updatedFacture = await Facture.findById(facture._id)
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.json({
      success: true,
      data: updatedFacture
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paiement',
      error: error.message
    });
  }
};

// @desc    Update facture
// @route   PUT /api/factures/:id
// @access  Private
export const updateFacture = async (req, res) => {
  try {
    // Determine shopId same as create
    let shopId;
    if (req.user.role === 'admin') {
      shopId = req.query.shopId || req.body.shop;
      if (!shopId) {
        return res.status(400).json({ success: false, message: 'Boutique requise.' });
      }
    } else {
      if (!req.user.shop) {
        return res.status(400).json({ success: false, message: 'Aucune boutique assignée à cet employé' });
      }
      shopId = req.user.shop._id || req.user.shop;
    }

    const facture = await Facture.findOne({ _id: req.params.id, shop: shopId });
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    const { client, articles, dateFacture, dateEcheance, notes } = req.body;

    // Validate client
    if (client) {
      const clientDoc = await Client.findOne({ _id: client, shop: shopId });
      if (!clientDoc) {
        return res.status(404).json({ success: false, message: 'Client non trouvé ou n\'appartient pas à cette boutique' });
      }
      facture.client = client;
    }

    // Validate and process articles
    if (articles && Array.isArray(articles)) {
      let montantTotal = 0;

      // Adjust stock based on difference between old and new quantities
      for (const newArticle of articles) {
        if (!newArticle.product) {
          return res.status(400).json({ success: false, message: 'Produit requis pour tous les articles' });
        }
        if (!newArticle.quantite || newArticle.quantite <= 0) {
          return res.status(400).json({ success: false, message: 'Quantité valide requise pour tous les articles' });
        }
        if (!newArticle.prixUnitaire || newArticle.prixUnitaire <= 0) {
          return res.status(400).json({ success: false, message: 'Prix unitaire valide requis pour tous les articles' });
        }

        const product = await Product.findOne({ _id: newArticle.product, shop: shopId });
        if (!product) {
          return res.status(404).json({ success: false, message: `Produit non trouvé ou n'appartient pas à cette boutique` });
        }

        const oldArticle = facture.articles.find(a => a.product.toString() === newArticle.product.toString());
        const oldQty = oldArticle ? oldArticle.quantite : 0;
        const diff = newArticle.quantite - oldQty; // positive => reduce stock, negative => add back

        if (diff > 0 && product.stockActuel < diff) {
          return res.status(400).json({ success: false, message: `Stock insuffisant pour ${product.nom}. Stock disponible: ${product.stockActuel}` });
        }

        // Apply stock changes
        product.stockActuel -= diff;
        await product.save();

        const montant = newArticle.quantite * newArticle.prixUnitaire;
        montantTotal += montant;
      }

      const articlesData = articles.map(a => ({ product: a.product, quantite: a.quantite, prixUnitaire: a.prixUnitaire, montant: a.quantite * a.prixUnitaire }));
      facture.articles = articlesData;
      facture.montantTotal = montantTotal;
    }

    if (dateFacture) facture.dateFacture = dateFacture;
    if (dateEcheance) facture.dateEcheance = dateEcheance;
    if (typeof notes !== 'undefined') facture.notes = notes;

    await facture.save();

    const populatedFacture = await Facture.findById(facture._id)
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom');

    res.json({ success: true, data: populatedFacture });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Erreur lors de la modification de la facture', error: error.message });
  }
};

// @desc    Delete facture
// @route   DELETE /api/factures/:id
// @access  Private
export const deleteFacture = async (req, res) => {
  try {
    const facture = await Facture.findOne({ _id: req.params.id, ...req.shopFilter });
    if (!facture) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    // Restore stock for each article
    for (const article of facture.articles) {
      const product = await Product.findById(article.product);
      if (product) {
        product.stockActuel += article.quantite;
        await product.save();

        // Create a stock movement record for the restoration
        await StockMovement.create({
          product: article.product,
          type: 'entree',
          quantite: article.quantite,
          prixUnitaire: article.prixUnitaire,
          montantTotal: article.montant,
          motif: 'Annulation facture',
          reference: facture.numero,
          facture: facture._id,
          shop: facture.shop,
          createdBy: req.user._id
        });
      }
    }

    // Delete related payments
    await PaiementClient.deleteMany({ facture: facture._id });

    await Facture.findByIdAndDelete(facture._id);

    res.json({ success: true, message: 'Facture supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la facture', error: error.message });
  }
};

// @desc    Generate PDF
// @route   GET /api/factures/:id/pdf
// @access  Private
export const generateFacturePDFRoute = async (req, res) => {
  try {
    const facture = await Facture.findOne({ _id: req.params.id, ...req.shopFilter })
      .populate('client')
      .populate('articles.product')
      .populate('createdBy', 'nom')
      .populate('shop');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Récupérer les paramètres de la boutique
    const settings = await Settings.findOne();
    const boutiqueName = settings ? settings.boutiqueName : 'Gestion Commerciale';

    const pdfBuffer = await generateFacturePDF(facture, facture.client, facture.createdBy, boutiqueName, settings, facture.shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${facture.numero}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

