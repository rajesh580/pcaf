const jwt = require('jsonwebtoken');
const { hasPermission } = require('../config/rolesAndPermissions');

// Active revoked tokens for instant logout & session invalidation
const revokedTokens = new Set();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: 'Session has been logged out. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_pfac_portal_2026_dev_secure'
    );
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
  }
};

/**
 * Authorize by role (e.g. authorizeRoles('SUPER_ADMIN', 'COLLEGE_ADMIN'))
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient role permissions',
        userRole: req.user?.role,
        requiredRoles: allowedRoles,
      });
    }
    next();
  };
};

/**
 * Authorize by granular permission (e.g. checkPermission('OPPORTUNITY_CREATE'))
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, requiredPermission)) {
      return res.status(403).json({
        error: `Forbidden: Missing required permission [${requiredPermission}]`,
        userRole: req.user?.role,
      });
    }
    next();
  };
};

function revokeToken(token) {
  revokedTokens.add(token);
}

module.exports = {
  authenticate,
  authorize: authorizeRoles,
  checkPermission,
  revokeToken,
};
