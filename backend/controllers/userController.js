const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { response } = require("express");
const crypto = require("crypto");
const exp = require("constants");
const { send } = require("process");
const Token = require("../models/tokenModel");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};
//register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all the fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be atleast 6 characters long");
  }
  //chekc if user email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  //create user
  const user = await User.create({
    name,
    email,
    password,
  });

  //generate token for user
  const token = generateToken(user._id);
  //send http-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1day
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});
/********************************************************/
//login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all the fields");
  }
  //check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  //check if password matches
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //generate token for user
  const token = generateToken(user._id);
  //send http-only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1day
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), 
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "Logged out successfully" });
});

//get user data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
//get login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});
//update user
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.photo = req.body.photo || photo;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not  found");
  }
});
//change password
const changePassword = asyncHandler(async (req, res) => {
  //get user from db
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;
  //check if user exists
  if (!user) {
    res.status(400);
    throw new Error("user not found , please login again");
  }
  //validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }
  //check if old password matches
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
  //save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } else {
    res.status(400);
    throw new Error("Invalid password");
  }
});
//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  //check if user exists
  const user = await User.findOne({
    email,
  });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  //create reset token
  let resetToken = crypto.randomBytes(32).toString("hex")+ user._id;
  //hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
//save toekn to db
await new Token({
  userId: user._id,
  token: hashedToken,
  createdAt: Date.now(),
  expiresAt: Date.now() + 30 * (60 * 1000), //30mins
}).save();
//construct reset url
const resetUrl='$(process.env.FRONTEND_URL)/resetpassword/${resetToken}';
//reset Email
const message=`<h2>Hello ${user.name}</h2>
<p>please user the url to reset your password</p>
<p>this reset url is valid for only 30 mins</p>
<a href="${resetUrl}clicktracking=off">${resetUrl}</a>
<p>Regarrds</p>
`
const subject='Reset your password'
const send_to=user.email;
const sent_from=process.env.EMAIL_USER;
try {
  await sendEmail(subject,message,send_to,sent_from);
  res.status(200).json({success:true,message:'Email sent'});
  
} catch (error) {

    res.status(500);
    throw new Error("Email could not be sent,please try again");
}
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
};
