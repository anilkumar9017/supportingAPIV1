const subconDemurrageClaimService = require('../services/subconDemurrageClaimService');

async function listDemurrageClaims(req, res) {
  try {
    const result = await subconDemurrageClaimService.listDemurrageClaims(
      req.databaseName,
      req.user.subcontractor_id,
      req.query || {}
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demurrage claims' });
  }
}

async function getDemurrageClaimById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconDemurrageClaimService.getDemurrageClaimById(
      req.databaseName,
      id,
      req.user.subcontractor_id
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Demurrage claim not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch demurrage claim' });
  }
}

async function createDemurrageClaim(req, res) {
  try {
    const payload = req.body || {};
    const result = await subconDemurrageClaimService.createDemurrageClaim(req.databaseName, {
      ...payload,
      created_by: req.user?.id || null,
      approved_by: payload.approved_by || null,
      subcontractor_id: req.user.subcontractor_id
    });

    res.status(201).json(result);
  } catch (error) {
    if (error && error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message || 'Shipment not found' });
    }

    res.status(500).json({ success: false, message: error.message || 'Failed to create demurrage claim' });
  }
}

async function updateDemurrageClaim(req, res) {
  try {
    const { id } = req.params;
    const result = await subconDemurrageClaimService.updateDemurrageClaim(
      req.databaseName,
      id,
      req.body || {},
      req.user?.id || null,
      req.user.subcontractor_id
    );

    res.json(result);
  } catch (error) {
    if (error && error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message || 'Demurrage claim not found' });
    }

    res.status(500).json({ success: false, message: error.message || 'Failed to update demurrage claim' });
  }
}

async function deleteDemurrageClaim(req, res) {
  try {
    const { id } = req.params;
    const result = await subconDemurrageClaimService.deleteDemurrageClaim(
      req.databaseName,
      id,
      req.user.subcontractor_id
    );

    res.json(result);
  } catch (error) {
    if (error && error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message || 'Demurrage claim not found' });
    }

    res.status(500).json({ success: false, message: error.message || 'Failed to delete demurrage claim' });
  }
}

async function uploadSupportingDocument(req, res) {
  try {
    const { id } = req.params;
    const supportingDocumentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await subconDemurrageClaimService.uploadSupportingDocument(
      req.databaseName,
      id,
      supportingDocumentUrl,
      req.user.subcontractor_id
    );

    res.json(result);
  } catch (error) {
    if (error && error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message || 'Demurrage claim not found' });
    }

    res.status(500).json({ success: false, message: error.message || 'Failed to upload supporting document' });
  }
}

module.exports = {
  listDemurrageClaims,
  getDemurrageClaimById,
  createDemurrageClaim,
  updateDemurrageClaim,
  deleteDemurrageClaim,
  uploadSupportingDocument
};
