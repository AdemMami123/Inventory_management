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
  const { products, totalAmount, customerInfo } = req.body;

  console.log("Order request body:", req.body);
  console.log("User role:", req.user.role);
  console.log("Customer info:", customerInfo);

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
  // If created by staff (admin, manager), they must provide customer info
  else if (req.user.role === 'admin' || req.user.role === 'manager') {
    // First check if a customer ID is provided directly
    if (req.body.customer) {
      customer = req.body.customer;
    }
    // Then check if customer info is provided
    else if (customerInfo && customerInfo.email) {
      // If customer info is provided, find or create a customer user
      const { name, email } = customerInfo;

      if (!name || !email) {
        res.status(400);
        throw new Error("Customer name and email are required");
      }

      try {
        // Import the User model
        const User = require("../models/user");

        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // Use the existing user as the customer
          customer = existingUser._id;
          console.log("Using existing customer:", existingUser.name, existingUser._id);
        } else {
          // Create a new user with the customer role
          const newCustomer = await User.create({
            name,
            email,
            // Generate a random password (they can reset it later if needed)
            password: Math.random().toString(36).slice(-8),
            role: 'customer'
          });

          customer = newCustomer._id;
          console.log("Created new customer:", newCustomer.name, newCustomer._id);
        }
      } catch (error) {
        console.error("Error finding/creating customer:", error);
        res.status(500);
        throw new Error("Error processing customer information: " + error.message);
      }
    } else {
      res.status(400);
      throw new Error("Please specify a customer for this order");
    }
  } else {
    // For any other role, use their own ID as the customer
    customer = req.user._id;
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

// Get all orders (for admin and manager only)
const getAllOrders = asyncHandler(async (req, res) => {
  // Optional query parameters for filtering
  const { status, startDate, endDate } = req.query;

  // Build filter object
  const filter = {};

  // Filter by status if provided
  if (status && ["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    filter.status = status;
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // Get orders with filters
  const orders = await Order.find(filter)
    .populate("customer", "name email")
    .populate("products.product", "name price")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// Get customer's own orders (for customers)
const getCustomerOrders = asyncHandler(async (req, res) => {
  // Optional query parameters for filtering
  const { status } = req.query;

  // Build filter object
  const filter = {};

  // If user is a customer, they can only see their own orders
  if (req.user.role === 'customer') {
    filter.customer = req.user._id;

    // Filter by status if provided
    if (status && ["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("products.product", "name price")
      .sort("-createdAt");

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  }

  // For admin/manager, allow them to specify a customer ID to view that customer's orders
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    const customerId = req.query.customerId;

    if (customerId) {
      filter.customer = customerId;
    }

    // Filter by status if provided
    if (status && ["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .populate("products.product", "name price")
      .sort("-createdAt");

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  }

  // For other roles (like employee), return an empty array
  res.status(200).json({
    success: true,
    count: 0,
    data: []
  });
});

// Get a specific order by ID
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name email")
    .populate("products.product", "name price image");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Note: The ownership check is now handled by the verifyOwnership middleware
  // This function will only be called if the user is authorized to access this order

  // Return a more detailed response
  res.status(200).json({
    success: true,
    data: {
      ...order._doc,
      // Add any additional computed fields here
      canCancel: order.status === "Pending",
      canReturn: order.status === "Delivered" &&
                 new Date() < new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days return policy
    }
  });
});

// Update order status (admin and manager only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  if (!status || !["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    res.status(400);
    throw new Error("Please provide a valid status (Pending, Shipped, Delivered, or Cancelled)");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Record the previous status for tracking changes
  const previousStatus = order.status;

  // Update order status
  order.status = status;

  // Add notes if provided
  if (notes) {
    order.notes = notes;
  }

  // Add status history entry if not already implemented
  // This would require adding a statusHistory field to the order model
  // For now, we'll just update the status

  // Save the updated order
  const updatedOrder = await order.save();

  // Return a success response with the updated order
  res.status(200).json({
    success: true,
    message: `Order status updated from ${previousStatus} to ${status}`,
    data: updatedOrder
  });
});

module.exports = {
  getAvailableProductsForOrders,
  createOrder,
  getAllOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
};