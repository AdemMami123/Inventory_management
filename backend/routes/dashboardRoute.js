const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { verifyRole } = require("../middleware/verifyRole");
const {
  getDashboardStats,
  getCustomerDashboardStats
} = require("../controllers/dashboardController");

// Get comprehensive dashboard statistics (Admin and Manager only)
router.get("/stats", verifyToken, verifyRole("manager", "admin"), getDashboardStats);

// Get customer dashboard statistics (All authenticated users)
router.get("/customer-stats", verifyToken, getCustomerDashboardStats);

module.exports = router;
