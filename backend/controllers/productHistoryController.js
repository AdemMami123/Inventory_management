const asyncHandler = require("express-async-handler");
const ProductHistory = require("../models/productHistory");
const Product = require("../models/product");
const mongoose = require("mongoose");

// Record product history
const recordProductHistory = async (productId, userId, changeType, field, previousValue, newValue, notes = "") => {
  try {
    await ProductHistory.create({
      product: productId,
      user: userId,
      changeType,
      field,
      previousValue,
      newValue,
      notes
    });
  } catch (error) {
    console.error("Error recording product history:", error);
  }
};

// Get product history for a specific product
const getProductHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  // Check if product exists
  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Get history with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { product: id };
  
  // Add date range filter if provided
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Add change type filter if provided
  if (req.query.changeType) {
    filter.changeType = req.query.changeType;
  }
  
  // Add user filter if provided
  if (req.query.user) {
    filter.user = req.query.user;
  }

  // Get total count for pagination
  const total = await ProductHistory.countDocuments(filter);
  
  // Get history entries
  const history = await ProductHistory.find(filter)
    .sort({ timestamp: req.query.sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get all product history with filtering
const getAllProductHistory = asyncHandler(async (req, res) => {
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  
  // Add product filter if provided
  if (req.query.product) {
    filter.product = req.query.product;
  }
  
  // Add date range filter if provided
  if (req.query.startDate && req.query.endDate) {
    filter.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  // Add change type filter if provided
  if (req.query.changeType) {
    filter.changeType = req.query.changeType;
  }
  
  // Add user filter if provided
  if (req.query.user) {
    filter.user = req.query.user;
  }

  // Get total count for pagination
  const total = await ProductHistory.countDocuments(filter);
  
  // Get history entries
  const history = await ProductHistory.find(filter)
    .sort({ timestamp: req.query.sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email')
    .populate('product', 'name sku')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      history,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  recordProductHistory,
  getProductHistory,
  getAllProductHistory
};
