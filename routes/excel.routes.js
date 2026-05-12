const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Export controllers
const excellController = require('../controllers/excellController');

//upload file
const upload = require('../middleware/upload');

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

//export template, dummy, export
router.post('/export', excellController.exportExcel);
router.post('/export-hierarchical', excellController.exportHierarchicalExcel);

//import excell
router.post('/import', upload.single('file'), excellController.importExcel);
router.post('/importHierarchicalExcel', upload.single('file'), excellController.importHierarchicalExcel);



module.exports = router;