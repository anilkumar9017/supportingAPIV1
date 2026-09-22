const express = require('express');
const router = express.Router();

// Import controllers
const agreementController = require('../controllers/agreementController');
const quotationController = require('../controllers/quotation/quotationController');
const shipmentController = require('../controllers/shipmentController');

// Import middleware
const domainMiddleware = require('../middleware/domainMiddleware');
const upload = require('../middleware/upload');

/**
 * Middleware to set useApi flag for all public routes
 * This ensures controllers know they should fetch database name from API
 */
router.use((req, res, next) => {
  req.useApi = true; // Public routes always use API for database name
  next();
});

/**
 * Public route - No authentication required
 * GET /api/public/health
 * Note: Health check doesn't need domain middleware (no database access)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Public API is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Domain middleware - extracts domain from header and fetches database name from API
 * Must be applied after useApi middleware and health route
 * Applied to all routes below this point
 */
router.use(domainMiddleware);

/**
 * Public Agreement Routes
 */
router.get('/agreement/:guid', agreementController.getAgreementByGuid);
router.put('/agreement/:guid/sign', upload.single('file'), agreementController.signAgreement);
router.get('/quotation/:temp_guid', quotationController.getQuotationByGuid);
router.put('/quotation/:temp_guid/sign', quotationController.signQuotation);

/**
 * Public Shipment Routes
 */
router.get('/shipments/track/:trackingNumber', shipmentController.getShipmentByTracking);


module.exports = router;
