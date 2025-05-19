/**
 * Role-based authorization middleware
 * @param {...string} roles - The allowed roles for the route
 * @returns {function} Express middleware function
 */
const verifyRole = (...roles) => {
    return (req, res, next) => {
        // Make sure we have a user and role from verifyToken middleware
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in to access this resource."
            });
        }

        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This action requires ${roles.length > 1 ? 'one of these roles' : 'the role'}: ${roles.join(', ')}`,
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        // User has an allowed role, proceed
        next();
    };
};

/**
 * Resource ownership verification middleware
 * Ensures users can only access their own resources unless they're admins/managers
 * @param {Function} getResourceOwnerId - Function to extract owner ID from the request
 * @returns {Function} Express middleware function
 */
const verifyOwnership = (getResourceOwnerId) => {
    return async (req, res, next) => {
        try {
            // Admin and managers can access any resource
            if (req.user.role === 'admin' || req.user.role === 'manager') {
                return next();
            }

            // For other roles, verify ownership
            const ownerId = await getResourceOwnerId(req);

            // If owner ID couldn't be determined
            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: "Resource not found"
                });
            }

            // Check if the current user is the owner
            if (ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You can only access your own resources."
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error verifying resource ownership",
                error: error.message
            });
        }
    };
};

module.exports = { verifyRole, verifyOwnership };