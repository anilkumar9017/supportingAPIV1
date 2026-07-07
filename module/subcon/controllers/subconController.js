const subconService = require('../services/subconService');

async function login(req, res) {
  try {
    const { email, password, dbname } = req.body;
    const databaseName = dbname || req.databaseName || process.env.DEFAULT_DB_NAME || 'default';

    const result = await subconService.loginSubconUser({ email, password, databaseName });
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Subcon login failed'
    });
  }
}

async function getAgreements(req, res) {
  try {
    const result = await subconService.getAgreements(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch agreements' });
  }
}

async function acceptAgreement(req, res) {
  try {
    const { agreementId } = req.body;
    const result = await subconService.acceptAgreement(req.databaseName, agreementId, req.user.subcontractor_id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to accept agreement' });
  }
}

async function getShipments(req, res) {
  try {
    const result = await subconService.getShipments(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch shipments' });
  }
}

async function updateMilestones(req, res) {
  try {
    const { data } = req.body;
    const result = await subconService.updateMilestones(req.databaseName, data || [], req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update tracking milestones' });
  }
}

async function requestAdvance(req, res) {
  try {
    const payload = req.body;
    const result = await subconService.requestAdvance(req.databaseName, payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to request advance' });
  }
}

async function getFinancials(req, res) {
  try {
    const result = await subconService.getFinancials(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch financials' });
  }
}

async function uploadDocuments(req, res) {
  try {
    const { shipmentId, invoiceNumber } = req.body;
    const podFile = req.files && req.files.pod ? req.files.pod[0].filename : null;
    const invFile = req.files && req.files.invoice ? req.files.invoice[0].filename : null;

    if (!podFile || !invFile) {
      return res.status(400).json({ success: false, message: 'Both POD and Invoice are required.' });
    }

    const result = await subconService.uploadDocuments(req.databaseName, {
      shipmentId,
      podFile,
      invFile,
      invoiceNumber,
      userId: req.user.id
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to upload documents' });
  }
}

module.exports = {
  login,
  getAgreements,
  acceptAgreement,
  getShipments,
  updateMilestones,
  requestAdvance,
  getFinancials,
  uploadDocuments
};
