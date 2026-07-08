const subconSubcontractorService = require('../services/subconSubcontractorService');

async function listSubcontractors(req, res) {
  try {
    const result = await subconSubcontractorService.getSubcontractors(req.databaseName);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch subcontractors' });
  }
}

async function getSubcontractorById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconSubcontractorService.getSubcontractorById(req.databaseName, id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Subcontractor not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch subcontractor' });
  }
}

async function createSubcontractor(req, res) {
  try {
    const payload = req.body || {};
    const data = {
      sap_card_code: payload.sap_card_code,
      company_name: payload.company_name,
      email_address: payload.email_address,
      phone_number: payload.phone_number || null,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null,
      log_inst: payload.log_inst || 1
    };

    const result = await subconSubcontractorService.createSubcontractor(req.databaseName, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create subcontractor' });
  }
}

async function updateSubcontractor(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await subconSubcontractorService.updateSubcontractor(
      req.databaseName,
      id,
      payload,
      req.user?.id || null
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update subcontractor' });
  }
}

async function deleteSubcontractor(req, res) {
  try {
    const { id } = req.params;
    const result = await subconSubcontractorService.deleteSubcontractor(req.databaseName, id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete subcontractor' });
  }
}

module.exports = {
  listSubcontractors,
  getSubcontractorById,
  createSubcontractor,
  updateSubcontractor,
  deleteSubcontractor
};
