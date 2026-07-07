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
 * /api/subcon/users:
 *   get:
 *     summary: Get all Subcon users
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new Subcon user
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
 *               subcontractor_id:
 *                 type: integer
 *               role_name:
 *                 type: string
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               is_active:
 *                 type: integer
 *               log_inst:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created
 */
router.get('/users', subconController.listUsers);
router.post('/users', subconController.createUser);

/**
 * @swagger
 * /api/subcon/users/{id}:
 *   get:
 *     summary: Get one Subcon user by id
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *   put:
 *     summary: Update a Subcon user
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete a Subcon user
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted
 */
router.get('/users/:id', subconController.getUserById);
router.put('/users/:id', subconController.updateUser);
router.delete('/users/:id', subconController.deleteUser);

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

/* INSERT INTO [subcon].[users] (
    subcontractor_id,
    role_name,
    full_name,
    email,
    password_hash,
    is_active,
    createdate,
    updatedate,
    createdby,
    updatedby,
    log_inst
)
VALUES (
    1,
    'admin',
    'Subcon Admin',
    'subconadmin@example.com',
    '$2a$10$vdjs6EpI4doeZg3RxVuHzeQzM5/K/oEuCqlpkvAUGb1FMGrhPGqo.',
    1,
    GETUTCDATE(),
    GETUTCDATE(),
    1,
    1,
    1
); */