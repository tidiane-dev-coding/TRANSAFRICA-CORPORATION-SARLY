import Client from '../models/Client.model.js';
import Facture from '../models/Facture.model.js';
import PaiementClient from '../models/PaiementClient.model.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res) => {
  try {
    const { search, hasDebt } = req.query;
    const query = { isActive: true, ...req.shopFilter };

    if (search) {
      query.$text = { $search: search };
    }
    if (hasDebt === 'true') {
      query.solde = { $gt: 0 };
    }

    const clients = await Client.find(query).sort({ nom: 1 });
    
    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients',
      error: error.message
    });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
export const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, ...req.shopFilter });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client',
      error: error.message
    });
  }
};

// @desc    Create client
// @route   POST /api/clients
// @access  Private
export const createClient = async (req, res) => {
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
    
    const client = await Client.create({ ...req.body, shop: shopId });
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du client',
      error: error.message
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du client',
      error: error.message
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...req.shopFilter },
      { isActive: false },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Client supprimé',
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client',
      error: error.message
    });
  }
};

// @desc    Get client history (invoices and payments)
// @route   GET /api/clients/:id/history
// @access  Private
export const getClientHistory = async (req, res) => {
  try {
    const clientId = req.params.id;

    const factures = await Facture.find({ client: clientId, ...req.shopFilter })
      .populate('createdBy', 'nom')
      .sort({ createdAt: -1 });

    const paiements = await PaiementClient.find({ client: clientId, ...req.shopFilter })
      .populate('facture', 'numero')
      .populate('createdBy', 'nom')
      .sort({ datePaiement: -1 });

    // Recalculer le solde réel à partir des factures
    const soldeReel = factures.reduce((total, facture) => {
      const reste = facture.montantTotal - facture.montantPaye;
      return total + reste;
    }, 0);

    res.json({
      success: true,
      data: {
        factures,
        paiements,
        soldeReel,
        soldeStored: (await Client.findById(clientId))?.solde || 0
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

// @desc    Recalculate client balance from invoices
// @route   PUT /api/clients/:id/recalculate-balance
// @access  Private
export const recalculateClientBalance = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Recalculer le solde à partir de toutes les factures
    const factures = await Facture.find({ client: client._id, ...req.shopFilter });
    const nouveauSolde = factures.reduce((total, facture) => {
      const reste = facture.montantTotal - facture.montantPaye;
      return total + reste;
    }, 0);

    // Mettre à jour le solde
    client.solde = nouveauSolde;
    await client.save();

    res.json({
      success: true,
      message: 'Solde recalculé avec succès',
      data: {
        ancienSolde: client.solde,
        nouveauSolde,
        client
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du recalcul du solde',
      error: error.message
    });
  }
};

