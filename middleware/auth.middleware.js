import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Shop from '../models/Shop.model.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé, token manquant'
      });
    }

    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('shop');
      
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non autorisé ou désactivé'
        });
      }
      
      // Set shop filter for queries
      if (req.user.role === 'admin') {
        // Admin can see all shops, but can filter by shopId in query params
        req.shopFilter = req.query.shopId ? { shop: req.query.shopId } : {};
      } else {
        // Employee can only see their shop
        if (!req.user.shop) {
          return res.status(403).json({
            success: false,
            message: 'Aucune boutique assignée à cet employé'
          });
        }
        req.shopFilter = { shop: req.user.shop._id || req.user.shop };
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      error: error.message
    });
  }
};

// Restrict to admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
};

// Restrict to admin or employee
export const adminOrEmployee = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'employe')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
};

// Helper function to get shop filter for queries
export const getShopFilter = (req) => {
  if (req.user.role === 'admin') {
    // Admin can see all shops, but can filter by shopId in query params
    return req.query.shopId ? { shop: req.query.shopId } : {};
  } else {
    // Employee can only see their shop
    return { shop: req.user.shop._id || req.user.shop };
  }
};

