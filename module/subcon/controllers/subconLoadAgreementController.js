const subconLoadAgreementService = require('../services/subconLoadAgreementService');

async function listLoadAgreements(req, res) {
  try {
    const result = await subconLoadAgreementService.listLoadAgreements(req.databaseName, req.user.subcontractor_id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch load agreements' });
  }
}

async function getLoadAgreementById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconLoadAgreementService.getLoadAgreementById(req.databaseName, id, req.user.subcontractor_id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Load agreement not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch load agreement' });
  }
}

async function createLoadAgreement(req, res) {
  try {
    const payload = req.body || {};
    const result = await subconLoadAgreementService.createLoadAgreement(req.databaseName, {
      ...payload,
      subcontractor_id: req.user.subcontractor_id,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create load agreement' });
  }
}

async function updateLoadAgreement(req, res) {
  try {
    const { id } = req.params;
    const result = await subconLoadAgreementService.updateLoadAgreement(req.databaseName, id, req.body || {}, req.user?.id || null, req.user.subcontractor_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update load agreement' });
  }
}

async function deleteLoadAgreement(req, res) {
  try {
    const { id } = req.params;
    const result = await subconLoadAgreementService.deleteLoadAgreement(req.databaseName, id, req.user.subcontractor_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete load agreement' });
  }
}

async function acceptAgreement(req, res) {
  try {
    const { agreementId } = req.body;
    const result = await subconLoadAgreementService.acceptAgreement(req.databaseName, agreementId, req.user.subcontractor_id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to accept agreement' });
  }
}

module.exports = {
  listLoadAgreements,
  getLoadAgreementById,
  createLoadAgreement,
  updateLoadAgreement,
  deleteLoadAgreement,
  acceptAgreement
};
