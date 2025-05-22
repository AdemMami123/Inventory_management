const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const { sendOrderStatusNotification } = require("../utils/orderNotifications");

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
  const { products, totalAmount, customerInfo, paymentMethod, notes } = req.body;

  console.log("Order request body:", req.body);
  console.log("User role:", req.user.role);
  console.log("Customer info:", customerInfo);

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error("Please add products to your order");
  }

  if (!totalAmount || totalAmount <= 0) {
    res.status(400);
    throw new Error("Invalid total amount");
  }

  // Verify all products exist and have sufficient quantity
  const productDetails = [];
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

    // Store product details for later use
    productDetails.push({
      product: item.product,
      quantity: item.quantity,
      price: parseFloat(product.price),
      name: product.name
    });
  }

  // Set the customer based on who is creating the order
  let customer;
  let customerInfoData = {};

  // If created by a customer, they are the customer
  if (req.user.role === 'customer') {
    customer = req.user._id;

    // Get customer info from their user profile
    const customerUser = await User.findById(req.user._id);
    if (customerUser) {
      customerInfoData = {
        name: customerUser.name,
        email: customerUser.email,
        phone: customerUser.phone || '',
      };
    }
  }
  // If created by staff (admin, manager), they must provide customer info
  else if (req.user.role === 'admin' || req.user.role === 'manager') {
    // First check if a customer ID is provided directly
    if (req.body.customer) {
      customer = req.body.customer;

      // Get customer info from their user profile
      const customerUser = await User.findById(req.body.customer);
      if (customerUser) {
        customerInfoData = {
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone || '',
        };
      }
    }
    // Then check if customer info is provided
    else if (customerInfo && customerInfo.email) {
      // If customer info is provided, find or create a customer user
      const { name, email, phone, address } = customerInfo;

      if (!name || !email) {
        res.status(400);
        throw new Error("Customer name and email are required");
      }

      try {
        // Check if a user with this email already exists
        let existingUser = await User.findOne({ email });

        if (existingUser) {
          // Use existing customer
          customer = existingUser._id;
          console.log("Using existing customer:", existingUser.name, existingUser._id);
        } else {
          // Create a new customer user
          const randomPassword = Math.random().toString(36).slice(-8);
          const newCustomer = await User.create({
            name,
            email,
            password: randomPassword, // Generate a random password
            role: 'customer',
            phone: phone || '',
          });

          customer = newCustomer._id;
          console.log("Created new customer:", newCustomer.name, newCustomer._id);
        }

        // Store customer info
        customerInfoData = {
          name,
          email,
          phone: phone || '',
          address: address || ''
        };
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
    // For any other role (like employee), use their own ID as the customer
    customer = req.user._id;

    // Get customer info from their user profile
    const customerUser = await User.findById(req.user._id);
    if (customerUser) {
      customerInfoData = {
        name: customerUser.name,
        email: customerUser.email,
        phone: customerUser.phone || '',
      };
    }
  }

  // Create order with enhanced data
  const orderData = {
    customer,
    customerInfo: customerInfoData,
    products: productDetails,
    totalAmount,
    status: "Pending",
    paymentStatus: "Unpaid",
    paymentMethod: paymentMethod || "Other",
    notes: notes || "",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  const order = await Order.create(orderData);

  // Update product quantities in inventory
  for (const item of products) {
    const product = await Product.findById(item.product);
    product.quantity = (parseInt(product.quantity) - item.quantity).toString();
    await product.save();
  }

  // Return the created order with populated fields
  const populatedOrder = await Order.findById(order._id)
    .populate("customer", "name email")
    .populate("products.product", "name price image");

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: populatedOrder
  });
});

// Get all orders (for admin and manager only)
const getAllOrders = asyncHandler(async (req, res) => {
  // Optional query parameters for filtering
  const { status, startDate, endDate, customerId, search, sort = "-createdAt", limit = 50, page = 1 } = req.query;

  // Build filter object
  const filter = {};

  // Filter by status if provided
  if (status && ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    filter.status = status;
  }

  // Filter by customer if provided
  if (customerId) {
    filter.customer = customerId;
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  // Search functionality
  if (search) {
    const searchRegex = new RegExp(search, 'i');

    // Find customers that match the search term
    const customers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id');

    const customerIds = customers.map(c => c._id);

    // Add search conditions to filter
    filter.$or = [
      { 'customerInfo.name': searchRegex },
      { 'customerInfo.email': searchRegex },
      { 'notes': searchRegex }
    ];

    // Add customer IDs to the search if any were found
    if (customerIds.length > 0) {
      filter.$or.push({ customer: { $in: customerIds } });
    }
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get total count for pagination
  const totalCount = await Order.countDocuments(filter);

  // Get orders with filters, pagination and sorting
  const orders = await Order.find(filter)
    .populate("customer", "name email")
    .populate("products.product", "name price image")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.status(200).json({
    success: true,
    count: orders.length,
    totalCount,
    currentPage: parseInt(page),
    totalPages,
    data: orders
  });
});

// Get customer's own orders (for customers)
const getCustomerOrders = asyncHandler(async (req, res) => {
  // Optional query parameters for filtering
  const { status, startDate, endDate, search, sort = "-createdAt", limit = 20, page = 1 } = req.query;

  // Build filter object
  const filter = {};

  // If user is a customer, they can only see their own orders
  if (req.user.role === 'customer') {
    filter.customer = req.user._id;

    // Filter by status if provided
    if (status && ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search by product name or order ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { _id: search.length === 24 ? search : null }, // Only if it's a valid ObjectId length
        { 'products.name': searchRegex }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await Order.countDocuments(filter);

    // Get orders with detailed information
    const orders = await Order.find(filter)
      .populate("products.product", "name price image")
      .populate("statusHistory.updatedBy", "name role")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get status counts for filtering UI
    const statusCounts = await Order.aggregate([
      { $match: { customer: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format status counts
    const formattedStatusCounts = {
      Pending: 0,
      Approved: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };

    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    // Enhance orders with additional information
    const enhancedOrders = orders.map(order => {
      const daysSinceOrder = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));

      return {
        ...order._doc,
        // Add computed fields for frontend use
        canCancel: order.status === "Pending" || order.status === "Approved",
        canReturn: order.status === "Delivered" && daysSinceOrder <= 14, // 14 days return policy
        daysSinceOrder,
        isRecentOrder: daysSinceOrder <= 30, // Flag for orders in the last 30 days
        statusTimeline: generateStatusTimeline(order),
      };
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      currentPage: parseInt(page),
      totalPages,
      statusCounts: formattedStatusCounts,
      data: enhancedOrders
    });
  }

  // For admin/manager, allow them to specify a customer ID to view that customer's orders
  if (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'employee') {
    const customerId = req.query.customerId;

    if (customerId) {
      filter.customer = customerId;
    } else if (req.user.role === 'employee') {
      // Employees must specify a customer ID if they want to see orders
      return res.status(400).json({
        success: false,
        message: "Please specify a customer ID to view their orders"
      });
    }

    // Filter by status if provided
    if (status && ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .populate("products.product", "name price image")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      currentPage: parseInt(page),
      totalPages,
      data: orders
    });
  }

  // For any other roles, return an empty array
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
    .populate("products.product", "name price image")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role")
    .populate("statusHistory.updatedBy", "name role");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Note: The ownership check is now handled by the verifyOwnership middleware
  // This function will only be called if the user is authorized to access this order

  // Calculate additional fields for the response
  const now = new Date();
  const orderDate = new Date(order.createdAt);
  const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

  // Return a more detailed response
  res.status(200).json({
    success: true,
    data: {
      ...order._doc,
      // Add computed fields for frontend use
      canCancel: order.status === "Pending",
      canReturn: order.status === "Delivered" && daysSinceOrder <= 14, // 14 days return policy
      daysSinceOrder,
      isRecentOrder: daysSinceOrder <= 30, // Flag for orders in the last 30 days
      statusTimeline: generateStatusTimeline(order),
    }
  });
});

// Helper function to generate a timeline from status history
const generateStatusTimeline = (order) => {
  if (!order.statusHistory || order.statusHistory.length === 0) {
    return [{
      status: order.status,
      timestamp: order.createdAt,
      notes: "Order created"
    }];
  }

  // Sort status history by timestamp
  return order.statusHistory.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

// Update order status (admin and manager only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  console.log("Update order status request:", {
    orderId: req.params.id,
    body: req.body,
    user: req.user ? { id: req.user._id, role: req.user.role } : 'No user'
  });

  const { status, notes, trackingNumber, estimatedDelivery } = req.body;

  if (!status || !["Pending", "Approved", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    res.status(400);
    throw new Error("Please provide a valid status (Pending, Approved, Shipped, Delivered, or Cancelled)");
  }

  // Validate status transitions
  const validTransitions = {
    "Pending": ["Approved", "Cancelled"],
    "Approved": ["Shipped", "Cancelled"],
    "Shipped": ["Delivered", "Cancelled"],
    "Delivered": [], // Terminal state
    "Cancelled": []  // Terminal state
  };

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // If status is not changing, no need to validate transition
  if (status === order.status) {
    // Just update notes or tracking info if provided
  }
  // Check if the status transition is valid
  else if (!validTransitions[order.status].includes(status)) {
    res.status(400);
    throw new Error(`Invalid status transition from ${order.status} to ${status}. Valid transitions are: ${validTransitions[order.status].join(', ')}`);
  }

  // Additional validation for specific status transitions
  if (status === "Shipped" && !trackingNumber) {
    res.status(400);
    throw new Error("Tracking number is required when setting an order to Shipped status");
  }

  // Record the previous status for tracking changes
  const previousStatus = order.status;

  // Update order status
  order.status = status;

  // Add notes if provided
  if (notes) {
    order.notes = notes;
  }

  // Update tracking information if provided
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  if (estimatedDelivery) {
    order.estimatedDelivery = new Date(estimatedDelivery);
  }

  // Set the updatedBy field to the current user
  order.updatedBy = req.user._id;

  // Save the updated order (status history will be updated by the pre-save middleware)
  const updatedOrder = await order.save();

  // Populate the updated order for the response
  const populatedOrder = await Order.findById(updatedOrder._id)
    .populate("customer", "name email")
    .populate("products.product", "name price image")
    .populate("statusHistory.updatedBy", "name role");

  // Send notification email if status has changed
  if (previousStatus !== status) {
    try {
      // Attach invoice PDF for delivered orders
      const attachInvoice = status === 'Delivered';

      await sendOrderStatusNotification(
        populatedOrder,
        previousStatus,
        status,
        req.user,
        attachInvoice
      );

      console.log(`Notification sent for order ${order._id} status change: ${previousStatus} -> ${status}`);
    } catch (error) {
      console.error('Error sending order status notification:', error);
      // Don't throw error here, as we still want to return the updated order
    }
  }

  // Return a success response with the updated order
  res.status(200).json({
    success: true,
    message: `Order status updated from ${previousStatus} to ${status}`,
    data: populatedOrder
  });
});

// Update order payment information (admin and manager only)
const updatePaymentInfo = asyncHandler(async (req, res) => {
  console.log("Update payment info request:", {
    orderId: req.params.id,
    body: req.body,
    user: req.user ? { id: req.user._id, role: req.user.role } : 'No user'
  });

  const { paymentStatus, paymentMethod, notes } = req.body;

  if (!paymentStatus || !["Unpaid", "Paid", "Partially Paid", "Refunded"].includes(paymentStatus)) {
    res.status(400);
    throw new Error("Please provide a valid payment status");
  }

  if (!paymentMethod || !["Credit Card", "Cash", "Bank Transfer", "Other"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("Please provide a valid payment method");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Record the previous payment status for tracking changes
  const previousPaymentStatus = order.paymentStatus;

  // Update payment information
  order.paymentStatus = paymentStatus;
  order.paymentMethod = paymentMethod;

  // Add notes if provided
  if (notes) {
    // Append to existing notes or create new
    if (order.notes) {
      order.notes = `${order.notes}\n\nPayment update (${new Date().toISOString()}): ${notes}`;
    } else {
      order.notes = `Payment update (${new Date().toISOString()}): ${notes}`;
    }
  }

  // Set the updatedBy field to the current user
  order.updatedBy = req.user._id;

  // Save the updated order
  const updatedOrder = await order.save();

  // Populate the updated order for the response
  const populatedOrder = await Order.findById(updatedOrder._id)
    .populate("customer", "name email")
    .populate("products.product", "name price image")
    .populate("statusHistory.updatedBy", "name role");

  // Return a success response with the updated order
  res.status(200).json({
    success: true,
    message: `Payment status updated from ${previousPaymentStatus} to ${paymentStatus}`,
    data: populatedOrder
  });
});

// Get order statistics (admin and manager only)
const getOrderStats = asyncHandler(async (req, res) => {
  // Get counts by status
  const statusCounts = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  // Get counts by payment status
  const paymentStatusCounts = await Order.aggregate([
    { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
  ]);

  // Get total revenue
  const revenueStats = await Order.aggregate([
    { $match: { paymentStatus: "Paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
  ]);

  console.log("Revenue stats:", revenueStats);

  // Get orders by date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ordersByDate = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        paymentStatus: "Paid"  // Only include paid orders in revenue calculations
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 },
        revenue: { $sum: "$totalAmount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  console.log("Orders by date:", ordersByDate);

  // Format the status counts into a more usable object
  const formattedStatusCounts = {};
  statusCounts.forEach(item => {
    formattedStatusCounts[item._id] = item.count;
  });

  // Format the payment status counts
  const formattedPaymentStatusCounts = {};
  paymentStatusCounts.forEach(item => {
    formattedPaymentStatusCounts[item._id] = item.count;
  });

  // Calculate total orders
  const totalOrders = Object.values(formattedStatusCounts).reduce((sum, count) => sum + count, 0);

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      statusCounts: formattedStatusCounts,
      paymentStatusCounts: formattedPaymentStatusCounts,
      totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
      ordersByDate
    }
  });
});

module.exports = {
  getAvailableProductsForOrders,
  createOrder,
  getAllOrders,
  getCustomerOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentInfo,
  getOrderStats
};