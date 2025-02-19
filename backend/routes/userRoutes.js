const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { registerUser,loginUser,logoutUser,getUser,loginStatus,updateUser,changePassword,forgotPassword,getAllUsers } = require('../controllers/userController');

const  protect  = require('../middleware/authMiddleware');



router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/logout",logoutUser);
router.get("/getuser", protect,getUser);
//get all users
router.get("/customers",getAllUsers);


//login status if user is logged in or not
router.get("/loggedin", loginStatus);

router.patch("/updateuser",protect ,updateUser);
//change password
router.patch("/changepassword",protect,changePassword);
//forgot password
router.post("/forgotpassword",forgotPassword);


module.exports = router;