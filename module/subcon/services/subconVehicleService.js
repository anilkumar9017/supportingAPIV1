const db = require('../../../config/database');

async function getVehicles(databaseName, subcontractorId) {
  const query = `
    SELECT id, subcontractor_id, vehicle_reg_no, asset_type, max_payload_tonnes,
           sap_equip_code, dcc_ng_status, insurance_expiry_date, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[vehicles]
    WHERE subcontractor_id = @subId
    ORDER BY id DESC
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
}

async function getVehicleById(databaseName, vehicleId) {
  const query = `
    SELECT id, subcontractor_id, vehicle_reg_no, asset_type, max_payload_tonnes,
           sap_equip_code, dcc_ng_status, insurance_expiry_date, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[vehicles]
    WHERE id = @id
  `;

  const result = await db.executeQuery(databaseName, query, { id: vehicleId }, false);
  return result && result.length > 0 ? result[0] : null;
}

async function createVehicle(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[vehicles]
      (subcontractor_id, vehicle_reg_no, asset_type, max_payload_tonnes, sap_equip_code, dcc_ng_status, insurance_expiry_date, createdate, updatedate, createdby, updatedby, log_inst)
    VALUES
      (@subcontractor_id, @vehicle_reg_no, @asset_type, @max_payload_tonnes, @sap_equip_code, @dcc_ng_status, @insurance_expiry_date, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst)
  `;

  await db.executeQuery(databaseName, query, {
    subcontractor_id: payload.subcontractor_id,
    vehicle_reg_no: payload.vehicle_reg_no,
    asset_type: payload.asset_type,
    max_payload_tonnes: payload.max_payload_tonnes || null,
    sap_equip_code: payload.sap_equip_code || null,
    dcc_ng_status: payload.dcc_ng_status || 'pending',
    insurance_expiry_date: payload.insurance_expiry_date || null,
    createdby: payload.createdby || null,
    updatedby: payload.updatedby || null,
    log_inst: payload.log_inst || 1
  }, false);

  return { success: true, message: 'Vehicle created successfully.' };
}

async function updateVehicle(databaseName, vehicleId, payload, updatedBy, subcontractorId) {
  const allowedFields = ['vehicle_reg_no', 'asset_type', 'max_payload_tonnes', 'sap_equip_code', 'dcc_ng_status', 'insurance_expiry_date', 'log_inst'];
  const updates = [];
  const params = { id: vehicleId, updatedby: updatedBy };

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates.push(`${field} = @${field}`);
      params[field] = payload[field];
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  const query = `
    UPDATE [subcon].[vehicles]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  params.subId = subcontractorId;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'Vehicle updated successfully.' };
}

async function deleteVehicle(databaseName, vehicleId, subcontractorId) {
  const query = `DELETE FROM [subcon].[vehicles] WHERE id = @id AND subcontractor_id = @subId`;
  await db.executeQuery(databaseName, query, { id: vehicleId, subId: subcontractorId }, false);
  return { success: true, message: 'Vehicle deleted successfully.' };
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
