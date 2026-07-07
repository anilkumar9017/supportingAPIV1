const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const { authenticateSubconToken } = require('../middleware/subconAuth');
const subconController = require('../controllers/subconController');

router.post('/auth/login', subconController.login);

router.use(authenticateSubconToken);

router.get('/agreements', subconController.getAgreements);
router.post('/agreements/accept', subconController.acceptAgreement);
router.get('/shipments', subconController.getShipments);
router.post('/shipments/milestone', subconController.updateMilestones);
router.post('/shipments/advance', subconController.requestAdvance);
router.get('/financials', subconController.getFinancials);
router.post('/financials/upload', upload.fields([{ name: 'pod' }, { name: 'invoice' }]), subconController.uploadDocuments);

module.exports = router;
