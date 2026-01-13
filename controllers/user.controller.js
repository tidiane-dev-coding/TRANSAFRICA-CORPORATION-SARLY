import User from '../models/User.model.js';
import Shop from '../models/Shop.model.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res) => {
  try {
    const { role, shop } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }
    if (shop) {
      query.shop = shop;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('shop', 'nom')
      .sort({ nom: 1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('shop', 'nom');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
export const createUser = async (req, res) => {
  try {
    const { nom, email, password, role, shop } = req.body;

    // Validate input
    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont requis'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Validate shop for employees
    const userRole = role || 'employe';
    if (userRole === 'employe' && !shop) {
      return res.status(400).json({
        success: false,
        message: 'Une boutique est requise pour les employés'
      });
    }

    // Verify shop exists if provided
    if (shop) {
      const shopExists = await Shop.findById(shop);
      if (!shopExists) {
        return res.status(404).json({
          success: false,
          message: 'Boutique non trouvée'
        });
      }
    }

    // Create user
    const user = await User.create({
      nom,
      email,
      password,
      role: userRole,
      shop: userRole === 'employe' ? shop : undefined
    });

    const userData = await User.findById(user._id)
      .select('-password')
      .populate('shop', 'nom');

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { nom, email, password, role, shop, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Check if email is already used by another user
    if (email && email !== user.email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Validate shop for employees
    const userRole = role || user.role;
    if (userRole === 'employe' && shop) {
      const shopExists = await Shop.findById(shop);
      if (!shopExists) {
        return res.status(404).json({
          success: false,
          message: 'Boutique non trouvée'
        });
      }
    }

    // Update user
    if (nom) user.nom = nom;
    if (email) user.email = email;
    if (password) user.password = password;
    if (role) user.role = role;
    if (userRole === 'employe' && shop) {
      user.shop = shop;
    } else if (userRole === 'admin') {
      user.shop = undefined;
    }
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const userData = await User.findById(user._id)
      .select('-password')
      .populate('shop', 'nom');

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur désactivé',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

