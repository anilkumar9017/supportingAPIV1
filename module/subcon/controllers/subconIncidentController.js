const subconIncidentService = require('../services/subconIncidentService');

async function listIncidents(req, res) {
  try {
    const result = await subconIncidentService.getIncidents(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch incidents' });
  }
}

async function getIncidentById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconIncidentService.getIncidentById(req.databaseName, id, req.user.subcontractor_id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch incident' });
  }
}

async function createIncident(req, res) {
  try {
    const payload = req.body || {};
    const data = {
      subcontractor_id: req.user.subcontractor_id,
      shipment_id: payload.shipment_id || null,
      incident_type: payload.incident_type || null,
      description: payload.description || null,
      reported_date: payload.reported_date || null,
      status: payload.status || 'open',
      severity: payload.severity || null,
      incident_location: payload.incident_location || null,
      resolution_notes: payload.resolution_notes || null,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null,
      log_inst: payload.log_inst || 1
    };

    const result = await subconIncidentService.createIncident(req.databaseName, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create incident' });
  }
}

async function updateIncident(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await subconIncidentService.updateIncident(
      req.databaseName,
      id,
      payload,
      req.user?.id || null,
      req.user.subcontractor_id
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update incident' });
  }
}

async function deleteIncident(req, res) {
  try {
    const { id } = req.params;
    const result = await subconIncidentService.deleteIncident(req.databaseName, id, req.user.subcontractor_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete incident' });
  }
}

module.exports = {
  listIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
};
