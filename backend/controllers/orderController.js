const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Product = require("../models/product");

// Get available products for order creation
const getAvailableProductsForOrders = asyncHandler(async (req, res) => {
  // Only return products with quantity > 0
  const products = await Product.find({ quantity: { $gt: 0 } })
    .select("name category quantity price description image")
    .sort({ category: 1, name: 1 });
  
  res.status(200).json(products);
});

// Create a new order (for both customers and staff)
const createOrder = asyncHandler(async (req, res) => {
  const { products, totalAmount } = req.body;
  
  if (!products || products.length === 0 || !totalAmount) {
    res.status(400);
    throw new Error("Please add products and total amount");
  }

  // Verify all products exist and have sufficient quantity
  for (const item of products) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      res.status(404);
      throw new Error(`Product with ID ${item.product} not found`);
    }
    
    if (parseInt(product.quantity) < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}`);
    }
  }
  
  // Set the customer based on who is creating the order
  let customer;
  
  // If created by a customer, they are the customer
  if (req.user.role === 'customer') {
    customer = req.user._id;
  } 
  // If created by staff, they must provide a customer ID
  else {
    if (!req.body.customer) {
      res.status(400);
      throw new Error("Please specify a customer for this order");
    }
    customer = req.body.customer;
  }

  // Create order
  const order = await Order.create({
    customer,
    products,
    totalAmount,
    createdBy: req.user._id,
  });

  // Update product quantities in inventory
  for (const item of products) {
    const product = await Product.findById(item.product);
    product.quantity = (parseInt(product.quantity) - item.quantity).toString();
    await product.save();
  }

  res.status(201).json(order);
});

// Get all orders (for staff only)
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("customer", "name email")
    .populate("products.product", "name price")
    .sort("-createdAt");
  
  res.status(200).json(orders);
});

// Get customer's own orders (for customers)
const getCustomerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate("products.product", "name price")
    .sort("-createdAt");
  
  res.status(200).json(orders);
});

// Get a specific order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name email")
    .populate("products.product", "name price");
  
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  
  // Check if user has permission to view this order
  if (req.user.role === 'customer' && order.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to access this order");
  }
  
  res.status(200).json(order);
});

// Update order status (staff only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status || !["Pending", "Shipped", "Delivered"].includes(status)) {
    res.status(400);
    throw new Error("Please provide a valid status");
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  
  order.status = status;
  await order.save();
  
  res.status(200).json(order);
});

module.exports = {
  getAvailableProductsForOrders,
  createOrder,
  getAllOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
};