const subconShipmentService = require('../services/subconShipmentService');

async function getShipments(req, res) {
  try {
    const result = await subconShipmentService.getShipments(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipments' });
  }
}

async function getShipmentById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconShipmentService.getShipmentById(req.databaseName, id, req.user.subcontractor_id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipment' });
  }
}

async function updateShipmentOrder(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const result = await subconShipmentService.updateShipmentOrder(
      req.databaseName,
      id,
      payload,
      req.user?.id || null,
      req.user.subcontractor_id
    );

    res.json(result);
  } catch (error) {
    if (error && error.code === 'CONFLICT') {
      return res.status(409).json({ success: false, message: error.message || 'Conflict updating shipment order' });
    }

    if (error && error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message || 'Shipment not found' });
    }

    res.status(500).json({ success: false, message: error.message || 'Failed to update shipment order' });
  }
}

async function uploadPODDocuments(req, res) {
  try {
    const { id } = req.params;
    const podFile = req.file ? req.file.filename : null;
    const { deliveryStatus, receiverName, deliveryDate, exception, deliverQty, shortQty, damageQty } = req.body;

    const result = await subconShipmentService.uploadPODDocuments(req.databaseName, {
      shipmentId: id,
      podFile,
      deliveryStatus,
      receiverName,
      deliveryDate,
      exception,
      deliverQty,
      shortQty,
      damageQty,
      userId: req.user?.id || null,
      subcontractorId: req.user?.subcontractor_id || null
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload POD documents' });
  }
}

module.exports = {
  getShipments,
  getShipmentById,
  updateShipmentOrder,
  uploadPODDocuments
};
