/**
 * Role-Based Access Control Middleware
 * Checks if authenticated user has required role(s)
 */

const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated (should be done by auth middleware first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
            });
        }

        next();
    };
};

// Predefined role middleware for common use cases
const isUser = roleCheck('user', 'operator', 'admin');
const isOperator = roleCheck('operator', 'admin');
const isAdmin = roleCheck('admin');

module.exports = {
    roleCheck,
    isUser,
    isOperator,
    isAdmin,
};
