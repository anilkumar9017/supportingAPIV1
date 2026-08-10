const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Export controllers
const exportDummyController = require('../controllers/exportDummyController');
const controller = require('../controllers/excellController');

// Import middleware
const domainMiddleware = require('../middleware/domainMiddleware');

// All routes in this file require authentication
router.use(authenticateToken);

/**
 * Middleware to set useApi flag for all authenticated routes
 * Authenticated routes use .env directly (no API call for database name)
 */
router.use((req, res, next) => {
    req.useApi = false; // Authenticated routes use .env directly
    next();
});

/**
 * Domain middleware - extracts database name from JWT token or header
 * Must be applied after authentication and useApi middleware
 */
router.use(domainMiddleware);

//projects
router.get('/export-dummy-projects', exportDummyController.exportDummyExcell);

//
router.post('/export', controller.exportExcel);



module.exports = router;