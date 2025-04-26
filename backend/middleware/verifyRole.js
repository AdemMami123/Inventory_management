/**
 * Role-based authorization middleware
 * @param {...string} roles - The allowed roles for the route
 * @returns {function} Express middleware function
 */
const verifyRole = (...roles) => {
    return (req, res, next) => {
        // Make sure we have a user and role from verifyToken middleware
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        // User has an allowed role, proceed
        next();
    };
};

module.exports = verifyRole;