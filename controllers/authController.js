const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_admin_secret_key_2024';

// Default Admin Credentials for instant login & fallback
const DEFAULT_ADMIN = {
  id: 'admin-001',
  name: 'System Admin',
  email: process.env.ADMIN_EMAIL || 'admin@hostel.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  role: 'admin'
};

const generateToken = (id, email, name, role) => {
  return jwt.sign({ id, email, name, role }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

const isDBConnected = () => mongoose.connection.readyState === 1;

// @desc    Admin Login
// @route   POST /api/auth/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check Default Admin Credentials
    if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && password === DEFAULT_ADMIN.password) {
      const token = generateToken(DEFAULT_ADMIN.id, DEFAULT_ADMIN.email, DEFAULT_ADMIN.name, DEFAULT_ADMIN.role);
      return res.status(200).json({
        success: true,
        message: 'Admin logged in successfully',
        token,
        user: {
          id: DEFAULT_ADMIN.id,
          name: DEFAULT_ADMIN.name,
          email: DEFAULT_ADMIN.email,
          role: DEFAULT_ADMIN.role
        }
      });
    }

    // Check MongoDB Database if connected
    if (isDBConnected()) {
      const admin = await Admin.findOne({ email: cleanEmail });
      if (admin && (await admin.matchPassword(password))) {
        const token = generateToken(admin._id, admin.email, admin.name, admin.role);
        return res.status(200).json({
          success: true,
          message: 'Admin logged in successfully',
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid admin email or password' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current Logged in Admin Profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginAdmin,
  getMe
};
