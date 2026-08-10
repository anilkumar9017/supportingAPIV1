const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import controllers
const agreementController = require('../controllers/agreementController');
const approvalController = require('../controllers/approvalController');
const udqController = require('../controllers/udqController');
const shipmentController = require('../controllers/shipmentController');
const syncController = require('../controllers/syncController');
const powerBiController = require('../controllers/powerBiController');

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

/**
 * Authenticated Agreement Routes
 */
router.get('/agreements', agreementController.getAllAgreements);
router.get('/agreement/:id', agreementController.getAgreementById);
router.post('/agreement', agreementController.createAgreement);
router.put('/agreement/:id', agreementController.updateAgreement);
router.delete('/agreement/:id', agreementController.deleteAgreement);
router.post('/agreement/:id/send-email', agreementController.sendAgreementEmail);

/* approval setup */
router.get('/approval-validate', approvalController.validateApprovalSetup);

/* user deined query */
router.post('/query-validate', udqController.validateQuery);

/* sync field formatting */
router.post('/sync-field-format', syncController.fieldFormateSync)

/**
 * Authenticated Shipment Routes
 */
router.get('/shipments', shipmentController.getAllShipments);
router.get('/shipments/:id', shipmentController.getShipmentById);
router.post('/shipments', shipmentController.createShipment);
router.put('/shipments/:id', shipmentController.updateShipment);
router.delete('/shipments/:id', shipmentController.deleteShipment);

/* 
 *  powerbi routes
*/
router.post('/bi-reports', powerBiController.generateReportEmbedToken);
router.post('/bi-dashboard', powerBiController.generateDashboardEmbedToken);
router.post('/bi-refresh', powerBiController.refreshDataset);
router.post('/refresh-status', powerBiController.refreshStatus);


/* 
  power bi routes
*/
router.get('/')


module.exports = router;
