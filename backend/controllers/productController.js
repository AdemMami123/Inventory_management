const asyncHandler = require("express-async-handler");
const Product = require("../models/product");
const { fileSizeFormatter } = require("../utils/fileUpload");
const path = require("path");
const { recordProductHistory } = require("./productHistoryController");


// Create Prouct
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //   Validation
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    const filePath = path.join("uploads", req.file.filename);

    fileData = {
      fileName: req.file.originalname,
      filePath: filePath,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  // Record product creation in history
  await recordProductHistory(
    product._id,
    req.user.id,
    "created",
    "product",
    null,
    {
      name,
      sku,
      category,
      quantity,
      price,
      description
    },
    "Product created"
  );

  res.status(201).json(product);
});

// Get all Products
const getProducts = asyncHandler(async (req, res) => {
  // If this is a public request or from a customer, return all products
  if (!req.user || req.user.role === 'customer') {
    const products = await Product.find().sort("-createdAt");
    return res.status(200).json(products);
  }

  // For admin/manager/employee, return products they created
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

// Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // If user is a customer, they can view any product
  if (req.user.role === 'customer') {
    return res.status(200).json(product);
  }

  // For admin/manager/employee, match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  res.status(200).json(product);
});

/// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Record product deletion in history
  await recordProductHistory(
    req.params.id,
    req.user.id,
    "deleted",
    "product",
    {
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      description: product.description
    },
    null,
    "Product deleted"
  );

  // Delete the product
  await Product.deleteOne({ _id: req.params.id });

  res.status(200).json({ message: "Product deleted." });
});


// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

   // Handle Image Upload
   let fileData = {};
   if (req.file) {
     const filePath = path.join("uploads", req.file.filename); // Save image locally

     fileData = {
       fileName: req.file.originalname,
       filePath: filePath,
       fileType: req.file.mimetype,
       fileSize: fileSizeFormatter(req.file.size, 2),
     };
   }

  // Track changes for history
  const changes = [];

  if (name !== product.name) {
    changes.push({
      field: "name",
      previousValue: product.name,
      newValue: name,
      changeType: "information"
    });
  }

  if (category !== product.category) {
    changes.push({
      field: "category",
      previousValue: product.category,
      newValue: category,
      changeType: "information"
    });
  }

  if (quantity !== product.quantity) {
    changes.push({
      field: "quantity",
      previousValue: product.quantity,
      newValue: quantity,
      changeType: "quantity"
    });
  }

  if (price !== product.price) {
    changes.push({
      field: "price",
      previousValue: product.price,
      newValue: price,
      changeType: "price"
    });
  }

  if (description !== product.description) {
    changes.push({
      field: "description",
      previousValue: product.description,
      newValue: description,
      changeType: "information"
    });
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // Record history for each change
  for (const change of changes) {
    await recordProductHistory(
      id,
      req.user.id,
      change.changeType,
      change.field,
      change.previousValue,
      change.newValue
    );
  }

  // Record image change if applicable
  if (Object.keys(fileData).length > 0) {
    await recordProductHistory(
      id,
      req.user.id,
      "information",
      "image",
      product.image,
      fileData,
      "Image updated"
    );
  }

  res.status(200).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};