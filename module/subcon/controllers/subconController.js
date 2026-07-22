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

async function getContractorToken(req, res) {
  try {
    const { id, userId, subcontractor_id: subcontractorId } = req.body;
    const databaseName = req.user?.dbname || process.env.DEFAULT_DB_NAME || 'default';

    const result = await subconService.issueContractorToken({
      databaseName,
      userId: id || userId,
      subcontractorId
    });

    res.json(result);
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message || 'Failed to generate contractor token'
    });
  }
}

async function listUsers(req, res) {
  try {
    const result = await subconService.getUsers(req.databaseName);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconService.getUserById(req.databaseName, id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch user' });
  }
}

async function createUser(req, res) {
  try {
    const payload = req.body;
    const result = await subconService.createUser(req.databaseName, {
      ...payload,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const result = await subconService.updateUser(req.databaseName, id, req.body, req.user?.id || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update user' });
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

async function listVehicles(req, res) {
  try {
    const result = await subconService.getVehicles(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch vehicles' });
  }
}

async function getVehicleById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconService.getVehicleById(req.databaseName, id);
    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, data: result[0] });
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

    const result = await subconService.createVehicle(req.databaseName, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create vehicle' });
  }
}

async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const result = await subconService.updateVehicle(req.databaseName, id, payload, req.user?.id || null, req.user.subcontractor_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update vehicle' });
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

async function getDashboardOverview(req, res) {
  try {
    const result = await subconService.getDashboardOverview(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard overview' });
  }
}

async function getActionCenter(req, res) {
  try {
    const result = await subconService.getActionCenter(req.databaseName, req.user.subcontractor_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch action center data' });
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
  getContractorToken,
  getAgreements,
  acceptAgreement,
  updateMilestones,
  requestAdvance,
  getFinancials,
  getDashboardOverview,
  getActionCenter,
  uploadDocuments
};
