const express = require('express');
const router = express.Router();

// Import controllers
const powerBiController = require('../controllers/powerBiController');

// Import middleware
//const domainMiddleware = require('../middleware/domainMiddleware');

/**
 * Middleware to set useApi flag for all public routes
 * This ensures controllers know they should fetch database name from API
 */
/* router.use((req, res, next) => {
  req.useApi = true; // Public routes always use API for database name
  next();
}); */

/**
 * Public route - No authentication required
 * GET /api/public/health
 * Note: Health check doesn't need domain middleware (no database access)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sanaga API is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Domain middleware - extracts domain from header and fetches database name from API
 * Must be applied after useApi middleware and health route
 * Applied to all routes below this point
 */
//router.use(domainMiddleware);

/**
 * Sanga Agreement Routes
 */

/* check saga gomain */
function domainVerify(req, res, next) {
  const domain = req.headers['x-domain'] || req.headers.domain;

  if (!domain) {
    return res.status(400).json({
      success: false,
      message: 'X-Domain header is required'
    });
  }

  if (domain.toLowerCase() !== 'saga') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: invalid domain'
    });
  }

  // domain is valid, proceed to next middleware / route handler
  next();
}

/**
 * Sanga powerbi Routes
 */
router.post('/bi-reports-out', domainVerify, powerBiController.generateReportToken);
router.post('/bi-refresh-out', domainVerify, powerBiController.refreshDatasetCustom);
router.post('/refresh-status-out', domainVerify, powerBiController.refreshStatusCustom);


module.exports = router;
