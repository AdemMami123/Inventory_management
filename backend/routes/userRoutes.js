const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  getAllUsers,
  checkEmail
} = require('../controllers/userController');

const protect = require('../middleware/authMiddleware');

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/check-email", checkEmail);
router.get("/loggedin", loginStatus);

// Protected routes
router.get("/getuser", protect, getUser);
router.get("/customers", getAllUsers);

router.patch("/updateuser",protect ,updateUser);
//change password
router.patch("/changepassword",protect,changePassword);
//forgot password
router.post("/forgotpassword",forgotPassword);


module.exports = router;