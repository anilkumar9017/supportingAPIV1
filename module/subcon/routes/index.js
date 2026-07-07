const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const { authenticateSubconToken } = require('../middleware/subconAuth');
const subconController = require('../controllers/subconController');

/**
 * @swagger
 * /api/subcon/auth/login:
 *   post:
 *     summary: Login for Subcon users
 *     tags: [Subcon]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               dbname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', subconController.login);

router.use(authenticateSubconToken);

/**
 * @swagger
 * /api/subcon/agreements:
 *   get:
 *     summary: Get pending agreements for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agreements
 */
router.get('/agreements', subconController.getAgreements);

/**
 * @swagger
 * /api/subcon/agreements/accept:
 *   post:
 *     summary: Accept a load agreement
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agreementId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Agreement accepted
 */
router.post('/agreements/accept', subconController.acceptAgreement);

/**
 * @swagger
 * /api/subcon/shipments:
 *   get:
 *     summary: Get active shipments for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipments
 */
router.get('/shipments', subconController.getShipments);

/**
 * @swagger
 * /api/subcon/shipments/milestone:
 *   post:
 *     summary: Update shipment tracking milestones
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Milestones updated
 */
router.post('/shipments/milestone', subconController.updateMilestones);

/**
 * @swagger
 * /api/subcon/shipments/advance:
 *   post:
 *     summary: Request a financial advance
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Advance request created
 */
router.post('/shipments/advance', subconController.requestAdvance);

/**
 * @swagger
 * /api/subcon/financials:
 *   get:
 *     summary: Get financial summary for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary
 */
router.get('/financials', subconController.getFinancials);

/**
 * @swagger
 * /api/subcon/financials/upload:
 *   post:
 *     summary: Upload POD and invoice documents
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shipmentId:
 *                 type: integer
 *               invoiceNumber:
 *                 type: string
 *               pod:
 *                 type: string
 *                 format: binary
 *               invoice:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded
 */
router.post('/financials/upload', upload.fields([{ name: 'pod' }, { name: 'invoice' }]), subconController.uploadDocuments);

module.exports = router;
