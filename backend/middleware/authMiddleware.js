const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authorized, please login"
            });
            return;
        }

        // Verify token
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            const user = await User.findById(verified.id).select("-password");

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: "User not found"
                });
                return;
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            res.status(401).json({
                success: false,
                message: "Invalid or expired token, please login again"
            });
            return;
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Authentication error"
        });
        return;
    }
});
// Restrict Route to Admins Only

module.exports = protect;