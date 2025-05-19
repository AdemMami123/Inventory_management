const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/verifyToken");
const { verifyRole } = require("../middleware/verifyRole");
const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");

// Public route - Get all products (no authentication required)
// This allows anyone to view products without logging in
router.get("/public", getProducts);

// Admin/Manager only - Create product
router.post("/",
  verifyToken,
  verifyRole("admin", "manager"),
  upload.single("image"),
  createProduct
);

// Admin/Manager only - Update product
router.patch("/:id",
  verifyToken,
  verifyRole("admin", "manager"),
  upload.single("image"),
  updateProduct
);

// All authenticated users - Get all products
// Both customers and staff can view products
router.get("/", verifyToken, getProducts);

// All authenticated users - Get single product
// Both customers and staff can view a single product
router.get("/:id", verifyToken, getProduct);

// Admin/Manager only - Delete product
router.delete("/:id",
  verifyToken,
  verifyRole("admin", "manager"),
  deleteProduct
);

module.exports = router;