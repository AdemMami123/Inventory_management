const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { verifyRole } = require("../middleware/verifyRole");
const {
  getSalesReport,
  getInventoryReport,
  getOrderFulfillmentReport,
  getProductPerformanceReport,
  exportReportToCSV
} = require("../controllers/reportsController");

// All reports routes are restricted to admin and manager roles
const adminManagerMiddleware = [verifyToken, verifyRole("admin", "manager")];

// Sales reports
router.get("/sales", adminManagerMiddleware, getSalesReport);

// Inventory reports
router.get("/inventory", adminManagerMiddleware, getInventoryReport);

// Order fulfillment reports
router.get("/orders", adminManagerMiddleware, getOrderFulfillmentReport);

// Product performance reports
router.get("/products", adminManagerMiddleware, getProductPerformanceReport);

// Export reports to CSV/PDF
router.get("/:reportType/export", adminManagerMiddleware, exportReportToCSV);

module.exports = router;
