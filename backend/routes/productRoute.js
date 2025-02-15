const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");

//add product
router.post("/", protect, upload.single("image"), createProduct);
//update product
router.patch("/:id", protect, upload.single("image"), updateProduct);
//get all products
router.get("/", protect, getProducts);
//get single product
router.get("/:id", protect, getProduct);
//delete product
router.delete("/:id", protect, deleteProduct);

module.exports = router;