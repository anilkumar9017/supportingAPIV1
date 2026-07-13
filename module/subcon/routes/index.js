const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const { authenticateSubconToken } = require('../middleware/subconAuth');
const subconController = require('../controllers/subconController');
const subconUserController = require('../controllers/subconUserController');
const subconVehicleController = require('../controllers/subconVehicleController');
const subconIncidentController = require('../controllers/subconIncidentController');
const subconSubcontractorController = require('../controllers/subconSubcontractorController');
const subconLoadAgreementController = require('../controllers/subconLoadAgreementController');
const subconShipmentController = require('../controllers/subconShipmentController');
const {
  validateVehicleCreate,
  validateVehicleUpdate,
  validateSubcontractorCreate,
  validateSubcontractorUpdate,
  validateIncidentCreate,
  validateIncidentUpdate,
  validateShipmentOrderUpdate
} = require('../middleware/subconValidation');

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
router.get('/users', subconUserController.listUsers);
router.post('/users', subconUserController.createUser);

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
router.get('/users/:id', subconUserController.getUserById);
router.put('/users/:id', subconUserController.updateUser);
router.delete('/users/:id', subconUserController.deleteUser);

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
 * /api/subcon/load-agreements:
 *   get:
 *     summary: Get load agreements for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of load agreements
 *   post:
 *     summary: Create a load agreement
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
 *               dcc_offer_ref:
 *                 type: string
 *               origin_location:
 *                 type: string
 *               destination_location:
 *                 type: string
 *               cargo_description:
 *                 type: string
 *               tonnage:
 *                 type: number
 *               status:
 *                 type: string
 *               vehicle_id:
 *                 type: integer
 *               driver_name:
 *                 type: string
 *               agreed_rate_lc:
 *                 type: number
 *               agreed_rate_sys:
 *                 type: number
 *               available_from:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Load agreement created
 */
router.get('/load-agreements', subconLoadAgreementController.listLoadAgreements);
router.post('/load-agreements', subconLoadAgreementController.createLoadAgreement);

/**
 * @swagger
 * /api/subcon/load-agreements/{id}:
 *   get:
 *     summary: Get a load agreement by id
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
 *         description: Load agreement details
 *   put:
 *     summary: Update a load agreement
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dcc_offer_ref:
 *                 type: string
 *               origin_location:
 *                 type: string
 *               destination_location:
 *                 type: string
 *               cargo_description:
 *                 type: string
 *               tonnage:
 *                 type: number
 *               status:
 *                 type: string
 *               vehicle_id:
 *                 type: integer
 *               driver_name:
 *                 type: string
 *               agreed_rate_lc:
 *                 type: number
 *               agreed_rate_sys:
 *                 type: number
 *               available_from:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Load agreement updated
 *   delete:
 *     summary: Delete a load agreement
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
 *         description: Load agreement deleted
 */
router.get('/load-agreements/:id', subconLoadAgreementController.getLoadAgreementById);
router.put('/load-agreements/:id', subconLoadAgreementController.updateLoadAgreement);
router.delete('/load-agreements/:id', subconLoadAgreementController.deleteLoadAgreement);

/**
 * @swagger
 * /api/subcon/load-agreements/accept:
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
router.post('/load-agreements/accept', subconLoadAgreementController.acceptAgreement);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   dcc_shipment_ref:
 *                     type: string
 *                   vehicle_reg_no:
 *                     type: string
 *                   origin_location:
 *                     type: string
 *                   destination_location:
 *                     type: string
 *                   dep_origin_time:
 *                     type: string
 *                     format: date-time
 *                   arr_border1_time:
 *                     type: string
 *                     format: date-time
 *                   arr_dest_time:
 *                     type: string
 *                     format: date-time
 *                   offloaded_time:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 */
router.get('/shipments', subconShipmentController.getShipments);

/**
 * @swagger
 * /api/subcon/shipments/{id}:
 *   get:
 *     summary: Get shipment order by id
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
 *         description: Shipment order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 subcontractor_id:
 *                   type: integer
 *                 dcc_shipment_ref:
 *                   type: string
 *                 sap_doc_num:
 *                   type: integer
 *                 vehicle_id:
 *                   type: integer
 *                 origin_location:
 *                   type: string
 *                 destination_location:
 *                   type: string
 *                 dep_origin_time:
 *                   type: string
 *                   format: date-time
 *                 arr_border1_time:
 *                   type: string
 *                   format: date-time
 *                 dep_border1_time:
 *                   type: string
 *                   format: date-time
 *                 arr_dest_time:
 *                   type: string
 *                   format: date-time
 *                 offloaded_time:
 *                   type: string
 *                   format: date-time
 *                 gross_rate_lc:
 *                   type: number
 *                 gross_rate_sys:
 *                   type: number
 *                 status:
 *                   type: string
 *                 pod_document_url:
 *                   type: string
 *                 final_invoice_url:
 *                   type: string
 *                 last_sync_date:
 *                   type: string
 *                   format: date-time
 *                 createdate:
 *                   type: string
 *                   format: date-time
 *                 updatedate:
 *                   type: string
 *                   format: date-time
 *                 createdby:
 *                   type: integer
 *                 updatedby:
 *                   type: integer
 *                 log_inst:
 *                   type: integer
 *                 delivery_date:
 *                   type: string
 *                   format: date
 *                 deliver_qty:
 *                   type: number
 *                 short_qty:
 *                   type: number
 *                 damage_qty:
 *                   type: number
 *                 receiver_name:
 *                   type: string
 *       404:
 *         description: Shipment order not found
 */
router.get('/shipments/:id', subconShipmentController.getShipmentById);

/**
 * @swagger
 * /api/subcon/shipments/{id}:
 *   put:
 *     summary: Update a shipment order
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dcc_shipment_ref:
 *                 type: string
 *               sap_doc_num:
 *                 type: integer
 *               vehicle_id:
 *                 type: integer
 *               origin_location:
 *                 type: string
 *               destination_location:
 *                 type: string
 *               dep_origin_time:
 *                 type: string
 *                 format: date-time
 *               arr_border1_time:
 *                 type: string
 *                 format: date-time
 *               dep_border1_time:
 *                 type: string
 *                 format: date-time
 *               arr_dest_time:
 *                 type: string
 *                 format: date-time
 *               offloaded_time:
 *                 type: string
 *                 format: date-time
 *               gross_rate_lc:
 *                 type: number
 *               gross_rate_sys:
 *                 type: number
 *               status:
 *                 type: string
 *               pod_document_url:
 *                 type: string
 *               final_invoice_url:
 *                 type: string
 *               last_sync_date:
 *                 type: string
 *                 format: date-time
 *               delivery_date:
 *                 type: string
 *                 format: date
 *               deliver_qty:
 *                 type: number
 *               short_qty:
 *                 type: number
 *               damage_qty:
 *                 type: number
 *               receiver_name:
 *                 type: string
 *               log_inst:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Shipment order updated
 */
router.put('/shipments/:id', validateShipmentOrderUpdate, subconShipmentController.updateShipmentOrder);

/**
 * @swagger
 * /api/subcon/vehicles:
 *   get:
 *     summary: Get vehicles for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicles
 */
router.get('/vehicles', subconVehicleController.listVehicles);

/**
 * @swagger
 * /api/subcon/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by id
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
 *         description: Vehicle details
 */
router.get('/vehicles/:id', subconVehicleController.getVehicleById);

/**
 * @swagger
 * /api/subcon/subcontractors:
 *   get:
 *     summary: Get all subcontractors
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subcontractors
 */
router.get('/subcontractors', subconSubcontractorController.listSubcontractors);

/**
 * @swagger
 * /api/subcon/subcontractors/{id}:
 *   get:
 *     summary: Get subcontractor by id
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
 *         description: Subcontractor details
 */
router.get('/subcontractors/:id', subconSubcontractorController.getSubcontractorById);

/**
 * @swagger
 * /api/subcon/subcontractors:
 *   post:
 *     summary: Create a new subcontractor
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
 *               sap_card_code:
 *                 type: string
 *               company_name:
 *                 type: string
 *               email_address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Subcontractor created
 */
router.post('/subcontractors', validateSubcontractorCreate, subconSubcontractorController.createSubcontractor);

/**
 * @swagger
 * /api/subcon/subcontractors/{id}:
 *   put:
 *     summary: Update a subcontractor
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
 *         description: Subcontractor updated
 */
router.put('/subcontractors/:id', validateSubcontractorUpdate, subconSubcontractorController.updateSubcontractor);

/**
 * @swagger
 * /api/subcon/subcontractors/{id}:
 *   delete:
 *     summary: Delete a subcontractor
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
 *         description: Subcontractor deleted
 */
router.delete('/subcontractors/:id', subconSubcontractorController.deleteSubcontractor);

/**
 * @swagger
 * /api/subcon/vehicles:
 *   post:
 *     summary: Create a new vehicle
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
 *               vehicle_reg_no:
 *                 type: string
 *               asset_type:
 *                 type: string
 *               max_payload_tonnes:
 *                 type: number
 *               sap_equip_code:
 *                 type: string
 *               dcc_ng_status:
 *                 type: string
 *               insurance_expiry_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Vehicle created
 */
router.post('/vehicles', validateVehicleCreate, subconVehicleController.createVehicle);

/**
 * @swagger
 * /api/subcon/vehicles/{id}:
 *   put:
 *     summary: Update a vehicle
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
 *         description: Vehicle updated
 */
router.put('/vehicles/:id', validateVehicleUpdate, subconVehicleController.updateVehicle);

/**
 * @swagger
 * /api/subcon/incidents:
 *   get:
 *     summary: Get incidents for the authenticated subcontractor
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incidents
 */
router.get('/incidents', subconIncidentController.listIncidents);

/**
 * @swagger
 * /api/subcon/incidents/{id}:
 *   get:
 *     summary: Get an incident by id
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
 *         description: Incident details
 */
router.get('/incidents/:id', subconIncidentController.getIncidentById);

/**
 * @swagger
 * /api/subcon/incidents:
 *   post:
 *     summary: Create a new incident
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
 *               shipment_id:
 *                 type: integer
 *               incident_type:
 *                 type: string
 *               description:
 *                 type: string
 *               reported_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *               severity:
 *                 type: string
 *               incident_location:
 *                 type: string
 *               resolution_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident created
 */
router.post('/incidents', validateIncidentCreate, subconIncidentController.createIncident);

/**
 * @swagger
 * /api/subcon/incidents/{id}:
 *   put:
 *     summary: Update an incident
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
 *         description: Incident updated
 */
router.put('/incidents/:id', validateIncidentUpdate, subconIncidentController.updateIncident);

/**
 * @swagger
 * /api/subcon/incidents/{id}:
 *   delete:
 *     summary: Delete an incident
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
 *         description: Incident deleted
 */
router.delete('/incidents/:id', subconIncidentController.deleteIncident);

/**
 * @swagger
 * /api/subcon/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
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
 *         description: Vehicle deleted
 */
router.delete('/vehicles/:id', subconVehicleController.deleteVehicle);

/**
 * @swagger
 * /api/subcon/shipments/milestone:
 *   post:
 *     summary: Update shipment tracking milestones
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
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     shipmentId:
 *                       type: integer
 *                     milestoneField:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *             required:
 *               - data
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
 * /api/subcon/dashboard/overview:
 *   get:
 *     summary: Get Subcon dashboard overview
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get('/dashboard/overview', subconController.getDashboardOverview);

/**
 * @swagger
 * /api/subcon/action-center:
 *   get:
 *     summary: Get Subcon action center widgets
 *     tags: [Subcon]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Action center widget counts
 */
router.get('/action-center', subconController.getActionCenter);

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