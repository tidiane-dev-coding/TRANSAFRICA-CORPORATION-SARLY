import Facture from '../models/Facture.model.js';
import Depense from '../models/Depense.model.js';
import Product from '../models/Product.model.js';
import Client from '../models/Client.model.js';
import StockMovement from '../models/StockMovement.model.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Security: Ensure employees can only see their own shop
    // Even if they try to manipulate query params, force them to their shop
    if (req.user.role !== 'admin') {
      // For employees, always force their assigned shop
      if (!req.user.shop) {
        return res.status(403).json({
          success: false,
          message: 'Aucune boutique assignée à cet employé'
        });
      }
      // Override any shopId in query params for employees
      req.shopFilter = { shop: req.user.shop._id || req.user.shop };
    } else {
      // For admins, use shopId from query if provided, otherwise all shops
      req.shopFilter = req.query.shopId ? { shop: req.query.shopId } : {};
    }
    
    const dateFilter = {};

    if (startDate || endDate) {
      // Use dateFacture instead of createdAt to filter by invoice date
      dateFilter.dateFacture = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.dateFacture.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.dateFacture.$lte = end;
      }
    }

    // Get all invoices for the shop filter (for total count)
    const facturesFilter = { ...dateFilter, ...req.shopFilter };
    const factures = await Facture.find(facturesFilter).populate('articles.product', 'prixAchat');
    
    // For paid invoices, we want to include those that were:
    // 1. Created in the date range AND paid, OR
    // 2. Paid/updated in the date range (to catch payments made today on older invoices)
    const facturesPayeesFilter = { 
      ...req.shopFilter,
      montantPaye: { $gt: 0 } // Only paid invoices
    };
    
    // If date filter is provided, include invoices created OR paid in the date range
    if (Object.keys(dateFilter).length > 0) {
      const dateRange = dateFilter.dateFacture;
      facturesPayeesFilter.$or = [
        { dateFacture: dateRange }, // Invoices created in date range
        { 
          updatedAt: {
            $gte: dateRange.$gte,
            $lte: dateRange.$lte
          },
          statut: { $in: ['paye', 'partiel'] } // Or invoices paid/updated in date range
        }
      ];
    }
    
    const facturesPayees = await Facture.find(facturesPayeesFilter).populate('articles.product', 'prixAchat');
    
    // Calculate revenue only from paid invoices
    const chiffreAffaires = facturesPayees.reduce((sum, f) => sum + f.montantPaye, 0);
    const chiffreAffairesTotal = factures.reduce((sum, f) => sum + f.montantTotal, 0);
    const chiffreAffairesPaye = chiffreAffaires; // Alias for clarity

    // Coût des marchandises vendues (CMV) - only for paid invoices
    let coutMarchandisesVendues = 0;
    for (const facture of facturesPayees) {
      for (const article of facture.articles) {
        if (article.product && article.product.prixAchat) {
          // Calculate CMV proportionally to the paid amount
          const ratioPaye = facture.montantTotal > 0 ? facture.montantPaye / facture.montantTotal : 0;
          const coutArticle = article.quantite * article.product.prixAchat;
          coutMarchandisesVendues += coutArticle * ratioPaye;
        }
      }
    }

    // Dépenses
    const depensesFilter = {};
    if (startDate || endDate) {
      depensesFilter.dateDepense = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        depensesFilter.dateDepense.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        depensesFilter.dateDepense.$lte = end;
      }
    }
    const depenses = await Depense.find({ ...depensesFilter, ...req.shopFilter });
    const depensesTotal = depenses.reduce((sum, d) => sum + d.montant, 0);

    // Bénéfice brut (Chiffre d'affaires - CMV)
    const beneficeBrut = chiffreAffaires - coutMarchandisesVendues;
    
    // Bénéfice net (Bénéfice brut - Dépenses)
    const benefice = beneficeBrut - depensesTotal;

    // Produits en rupture
    const produitsRupture = await Product.find({
      isActive: true,
      ...req.shopFilter,
      $expr: { $lte: ['$stockActuel', '$seuilMinimum'] }
    }).select('nom categorie stockActuel seuilMinimum shop').populate('shop', 'nom');

    // Clients débiteurs
    const clientsDebiteurs = await Client.find({
      isActive: true,
      ...req.shopFilter,
      solde: { $gt: 0 }
    })
    .select('nom prenom solde')
    .sort({ solde: -1 })
    .limit(10);

    // Total dette clients
    const totalDetteClients = await Client.aggregate([
      { $match: { isActive: true, ...req.shopFilter } },
      { $group: { _id: null, total: { $sum: '$solde' } } }
    ]);
    const detteClients = totalDetteClients[0]?.total || 0;

    // Ventes par mois (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const ventesParMois = await Facture.aggregate([
      {
        $match: {
          dateFacture: { $gte: sixMonthsAgo },
          ...req.shopFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateFacture' },
            month: { $month: '$dateFacture' }
          },
          total: { $sum: '$montantTotal' },
          paye: { $sum: '$montantPaye' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Dépenses par catégorie
    const depensesParCategorie = await Depense.aggregate([
      {
        $match: { ...depensesFilter, ...req.shopFilter }
      },
      {
        $group: {
          _id: '$categorie',
          total: { $sum: '$montant' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Top produits vendus (use dateFacture filter for stock movements linked to invoices)
    const stockDateFilter = {};
    if (startDate || endDate) {
      stockDateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        stockDateFilter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        stockDateFilter.createdAt.$lte = end;
      }
    }
    
    const topProduits = await StockMovement.aggregate([
      {
        $match: {
          type: 'sortie',
          ...stockDateFilter,
          ...req.shopFilter
        }
      },
      {
        $group: {
          _id: '$product',
          quantite: { $sum: '$quantite' },
          montant: { $sum: '$montantTotal' }
        }
      },
      {
        $sort: { quantite: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Populate product names
    const topProduitsPopulated = await StockMovement.populate(topProduits, {
      path: '_id',
      select: 'nom categorie'
    });

    res.json({
      success: true,
      data: {
        chiffreAffaires, // Total revenue from all invoices in period
        chiffreAffairesTotal, // Same as chiffreAffaires (kept for compatibility)
        chiffreAffairesPaye, // Revenue from paid invoices only
        coutMarchandisesVendues,
        beneficeBrut,
        depensesTotal,
        benefice,
        produitsRupture: produitsRupture.length,
        produitsRuptureList: produitsRupture,
        clientsDebiteurs: clientsDebiteurs.length,
        clientsDebiteursList: clientsDebiteurs,
        detteClients,
        ventesParMois,
        depensesParCategorie,
        topProduits: topProduitsPopulated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

