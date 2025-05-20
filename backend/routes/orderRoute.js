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
  updateOrderStatus,
  updatePaymentInfo,
  getOrderStats
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
router.get("/stats", verifyToken, verifyRole("manager", "admin"), getOrderStats);

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

// Update payment information (Admin and Manager only)
router.patch("/:id/payment",
  verifyToken,
  verifyRole("manager", "admin"),
  updatePaymentInfo
);

// Approve order (Admin and Manager only) - Changes status to "Approved"
router.patch("/:id/approve",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Approved";
    req.body.notes = req.body.notes || "Order approved";
    updateOrderStatus(req, res);
  }
);

// Ship order (Admin and Manager only) - Changes status to "Shipped"
router.patch("/:id/ship",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Shipped";
    req.body.notes = req.body.notes || "Order shipped";
    updateOrderStatus(req, res);
  }
);

// Mark order as delivered (Admin and Manager only) - Changes status to "Delivered"
router.patch("/:id/deliver",
  verifyToken,
  verifyRole("manager", "admin"),
  (req, res) => {
    req.body.status = "Delivered";
    req.body.notes = req.body.notes || "Order delivered";
    updateOrderStatus(req, res);
  }
);

// Cancel order (Admin, Manager, and Customer) - Changes status to "Cancelled"
// Customers can only cancel their own pending orders
router.patch("/:id/cancel",
  verifyToken,
  verifyOwnership(async (req) => {
    const order = await Order.findById(req.params.id);

    // Admin and Manager can cancel any order
    if (req.user.role === "admin" || req.user.role === "manager") {
      return null; // Skip ownership check
    }

    // Customers can only cancel their own orders and only if they're pending
    if (req.user.role === "customer") {
      if (order && order.status !== "Pending") {
        throw new Error("You can only cancel pending orders");
      }
      return order ? order.customer : null;
    }

    // For other roles, check ownership
    return order ? order.customer : null;
  }),
  (req, res) => {
    req.body.status = "Cancelled";
    req.body.notes = req.body.notes || "Order cancelled";
    updateOrderStatus(req, res);
  }
);

module.exports = router;