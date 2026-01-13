import User from '../models/User.model.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
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

    // Create user
    const user = await User.create({
      nom,
      email,
      password,
      role: userRole,
      shop: userRole === 'employe' ? shop : undefined
    });

    const userData = await User.findById(user._id).select('-password').populate('shop');

    res.status(201).json({
      success: true,
      data: {
        id: userData._id,
        nom: userData.nom,
        email: userData.email,
        role: userData.role,
        shop: userData.shop,
        token: generateToken(userData._id)
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Populate shop
    const userData = await User.findById(user._id).select('-password').populate('shop');

    res.json({
      success: true,
      data: {
        id: userData._id,
        nom: userData.nom,
        email: userData.email,
        role: userData.role,
        shop: userData.shop,
        token: generateToken(userData._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('shop');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

