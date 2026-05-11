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

/**
 * Sanga powerbi Routes
 */
router.post('/bi-reports-out', powerBiController.generateReportToken);
router.post('/bi-refresh-out', powerBiController.refreshDatasetCustom);
router.post('/refresh-status-out', powerBiController.refreshStatusCustom);


module.exports = router;
