const express = require('express');
const router = express.Router();

const { authenticateGeofenceWebhook } = require('../middleware/webhookAuth');
const domainMiddleware = require('../../../middleware/domainMiddleware');
const geofenceController = require('../controller/geofenceController');

router.use(authenticateGeofenceWebhook);

router.use((req, res, next) => {
  req.useApi = true;
  next();
});

router.use(domainMiddleware);

router.post('/events', geofenceController.receiveEvent);

module.exports = router;