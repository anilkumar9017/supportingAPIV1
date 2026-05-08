const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Authentication middleware for protected routes
 */
async function authenticateToken(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  //console.log("token ", token)
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.decode(token);
    req.user = decoded; // Attach user info to request
    const verify = `select * from m_login_detail where token = @token and valid_to >= GETDATE()`
    const response = await db.executeQuery(decoded?.dbname, verify, {
        token,
    }, false);
    
    if(response?.length == 0){
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Token has expired'
        }); 
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token has expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid token'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token, but attaches user if token is valid
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }
  
  next();
}

/**
 * Generate JWT token
 */
function generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken
};

