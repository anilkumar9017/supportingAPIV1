const subconVehicleService = require('../services/subconVehicleService');

async function listVehicles(req, res) {
  try {
    const result = await subconVehicleService.getVehicles(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch vehicles' });
  }
}

async function getVehicleById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconVehicleService.getVehicleById(req.databaseName, id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch vehicle' });
  }
}

async function createVehicle(req, res) {
  try {
    const payload = req.body || {};
    const data = {
      subcontractor_id: req.user.subcontractor_id,
      vehicle_reg_no: payload.vehicle_reg_no,
      asset_type: payload.asset_type,
      max_payload_tonnes: payload.max_payload_tonnes,
      sap_equip_code: payload.sap_equip_code,
      dcc_ng_status: payload.dcc_ng_status || 'pending',
      insurance_expiry_date: payload.insurance_expiry_date || null,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null,
      log_inst: payload.log_inst || 1
    };

    const result = await subconVehicleService.createVehicle(req.databaseName, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create vehicle' });
  }
}

async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await subconVehicleService.updateVehicle(
      req.databaseName,
      id,
      payload,
      req.user?.id || null,
      req.user.subcontractor_id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update vehicle' });
  }
}

async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    const result = await subconVehicleService.deleteVehicle(req.databaseName, id, req.user.subcontractor_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete vehicle' });
  }
}

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
