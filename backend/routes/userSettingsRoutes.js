const express = require('express');
const router = express.Router();
const {
  getUserSettings,
  updateUserSettings
} = require('../controllers/userSettingsController');
const protect = require('../middleware/authMiddleware');

// All routes are protected - require authentication
router.use(protect);

// Get user settings
router.get('/', getUserSettings);

// Update user settings
router.patch('/', updateUserSettings);

module.exports = router;
