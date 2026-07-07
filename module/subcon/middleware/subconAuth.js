const jwt = require('jsonwebtoken');

const SUBCON_JWT_SECRET = process.env.SUBCON_JWT_SECRET || process.env.JWT_SECRET || 'super-secret-logistics-key';

function authenticateSubconToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Subcon token is required.'
    });
  }

  try {
    const decoded = jwt.verify(token, SUBCON_JWT_SECRET);
    req.user = decoded;
    req.databaseName = decoded.dbname || req.headers['x-database'] || process.env.DEFAULT_DB_NAME || 'default';
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired subcon token.'
    });
  }
}

module.exports = {
  authenticateSubconToken
};
