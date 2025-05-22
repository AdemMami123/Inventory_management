const asyncHandler = require('express-async-handler');
const UserSettings = require('../models/userSettings');

// Get user settings
const getUserSettings = asyncHandler(async (req, res) => {
  try {
    // Find settings for the current user
    let userSettings = await UserSettings.findOne({ user: req.user._id });

    // If no settings exist yet, create default settings
    if (!userSettings) {
      userSettings = await UserSettings.create({
        user: req.user._id,
        // Default values are defined in the schema
      });
    }

    res.status(200).json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching settings"
    });
  }
});

// Update user settings
const updateUserSettings = asyncHandler(async (req, res) => {
  try {
    const { theme, notifications, display } = req.body;
    
    // Find settings for the current user
    let userSettings = await UserSettings.findOne({ user: req.user._id });

    // If no settings exist yet, create new settings
    if (!userSettings) {
      userSettings = new UserSettings({
        user: req.user._id,
      });
    }

    // Update settings with provided values
    if (theme) userSettings.theme = theme;
    
    if (notifications) {
      if (notifications.orderUpdates !== undefined) 
        userSettings.notifications.orderUpdates = notifications.orderUpdates;
      if (notifications.promotions !== undefined) 
        userSettings.notifications.promotions = notifications.promotions;
      if (notifications.productUpdates !== undefined) 
        userSettings.notifications.productUpdates = notifications.productUpdates;
      if (notifications.email !== undefined) 
        userSettings.notifications.email = notifications.email;
      if (notifications.inApp !== undefined) 
        userSettings.notifications.inApp = notifications.inApp;
    }
    
    if (display) {
      if (display.itemsPerPage) 
        userSettings.display.itemsPerPage = display.itemsPerPage;
      if (display.defaultView) 
        userSettings.display.defaultView = display.defaultView;
    }

    // Save updated settings
    await userSettings.save();

    res.status(200).json({
      success: true,
      data: userSettings,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while updating settings"
    });
  }
});

module.exports = {
  getUserSettings,
  updateUserSettings
};
