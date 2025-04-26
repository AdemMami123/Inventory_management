const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");
const { 
  getAvailableProductsForOrders,
  createOrder, 
  getAllOrders, 
  getCustomerOrders, 
  getOrderById, 
  updateOrderStatus 
} = require("../controllers/orderController");

// Get available products for order creation (All authenticated users)
router.get("/available-products", verifyToken, getAvailableProductsForOrders);

// Create an order (All authenticated users)
// Staff can create orders on behalf of customers
// Customers can only create orders for themselves
router.post("/", verifyToken, createOrder);

// Get all orders (Staff only)
router.get("/all", verifyToken, verifyRole("employee", "manager", "admin"), getAllOrders);

// Customer gets their own orders
router.get("/my-orders", verifyToken, verifyRole("customer"), getCustomerOrders);

// Get a specific order by ID (accessible by staff and the customer who placed it)
router.get("/:id", verifyToken, getOrderById);

// Update order status (Staff only)
router.patch("/:id/status", verifyToken, verifyRole("employee", "manager", "admin"), updateOrderStatus);

module.exports = router;