const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Not authorized, please login" });
        }
        
        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(verified.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, please login" });
    }
};

module.exports = verifyToken;