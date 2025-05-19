const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { verifyRole, verifyOwnership } = require("../middleware/verifyRole");
const Order = require("../models/order");
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

// Get all orders (Admin and Manager only)
router.get("/all", verifyToken, verifyRole("manager", "admin"), getAllOrders);

// Customer gets their own orders
// This route is accessible to all roles, but customers will only see their own orders
router.get("/my-orders", verifyToken, getCustomerOrders);

// Get order statistics (Admin and Manager only)
router.get("/stats", verifyToken, verifyRole("manager", "admin"), (req, res) => {
  // This would be implemented in the controller
  res.status(200).json({
    success: true,
    message: "Order statistics endpoint - to be implemented"
  });
});

// Get a specific order by ID
// Uses ownership verification to ensure customers can only access their own orders
router.get("/:id", verifyToken,
  verifyOwnership(async (req) => {
    const order = await Order.findById(req.params.id);
    return order ? order.customer : null;
  }),
  getOrderById
);

// Update order status (Admin and Manager only)
router.patch("/:id/status",
  verifyToken,
  verifyRole("manager", "admin"),
  updateOrderStatus
);

// Accept order (Admin and Manager only) - Changes status to "Shipped"
router.patch("/:id/accept",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Shipped";
    updateOrderStatus(req, res);
  }
);

// Refuse order (Admin and Manager only) - Changes status to "Cancelled"
router.patch("/:id/refuse",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Cancelled";
    updateOrderStatus(req, res);
  }
);

// Process order (Admin and Manager only) - Changes status to "Delivered"
router.patch("/:id/process",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Delivered";
    updateOrderStatus(req, res);
  }
);

module.exports = router;