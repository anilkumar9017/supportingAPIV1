const db = require('../../../config/database');

async function listLoadAgreements(databaseName, subcontractorId, filters = {}) {
  const { status } = filters;
  let query = `
    SELECT id, subcontractor_id, dcc_offer_ref, origin_location, destination_location,
           cargo_description, tonnage, status, vehicle_id, driver_name, responded_at,
           agreed_rate_lc, agreed_rate_sys, available_from, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[load_agreements]
    WHERE subcontractor_id = @subId
  `;

  const params = { subId: subcontractorId };

  if (status) {
    query += ' AND status = @status';
    params.status = status;
  }

  query += ' ORDER BY id DESC';

  return db.executeQuery(databaseName, query, params, false);
}

async function getLoadAgreementById(databaseName, agreementId, subcontractorId) {
  const query = `
    SELECT id, subcontractor_id, dcc_offer_ref, origin_location, destination_location,
           cargo_description, tonnage, status, vehicle_id, driver_name, responded_at,
           agreed_rate_lc, agreed_rate_sys, available_from, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[load_agreements]
    WHERE id = @id AND subcontractor_id = @subId
  `;

  const result = await db.executeQuery(databaseName, query, { id: agreementId, subId: subcontractorId }, false);
  return result && result.length > 0 ? result[0] : null;
}

async function createLoadAgreement(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[load_agreements]
      (subcontractor_id, dcc_offer_ref, origin_location, destination_location, cargo_description,
       tonnage, status, vehicle_id, driver_name, agreed_rate_lc, agreed_rate_sys, available_from,
       createdate, updatedate, createdby, updatedby, log_inst)
    VALUES
      (@subcontractor_id, @dcc_offer_ref, @origin_location, @destination_location, @cargo_description,
       @tonnage, @status, @vehicle_id, @driver_name, @agreed_rate_lc, @agreed_rate_sys, @available_from,
       GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst)
  `;

  await db.executeQuery(databaseName, query, {
    subcontractor_id: payload.subcontractor_id,
    dcc_offer_ref: payload.dcc_offer_ref,
    origin_location: payload.origin_location,
    destination_location: payload.destination_location,
    cargo_description: payload.cargo_description,
    tonnage: payload.tonnage,
    status: payload.status || 'pending',
    vehicle_id: payload.vehicle_id || null,
    driver_name: payload.driver_name || null,
    agreed_rate_lc: payload.agreed_rate_lc || null,
    agreed_rate_sys: payload.agreed_rate_sys || null,
    available_from: payload.available_from || null,
    createdby: payload.createdby || null,
    updatedby: payload.updatedby || null,
    log_inst: payload.log_inst || 1
  }, false);

  return { success: true, message: 'Load agreement created successfully.' };
}

async function updateLoadAgreement(databaseName, agreementId, payload, updatedBy, subcontractorId) {
  const allowedFields = [
    'dcc_offer_ref',
    'origin_location',
    'destination_location',
    'cargo_description',
    'tonnage',
    'status',
    'vehicle_id',
    'driver_name',
    'agreed_rate_lc',
    'agreed_rate_sys',
    'available_from',
    'log_inst'
  ];

  const updates = [];
  const params = { id: agreementId, updatedby: updatedBy, subId: subcontractorId };

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
    UPDATE [subcon].[load_agreements]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'Load agreement updated successfully.' };
}

async function deleteLoadAgreement(databaseName, agreementId, subcontractorId) {
  const query = `DELETE FROM [subcon].[load_agreements] WHERE id = @id AND subcontractor_id = @subId`;
  await db.executeQuery(databaseName, query, { id: agreementId, subId: subcontractorId }, false);
  return { success: true, message: 'Load agreement deleted successfully.' };
}

async function acceptAgreement(databaseName, agreementId, subcontractorId, userId) {
  await db.executeQuery(
    databaseName,
    `
      UPDATE [subcon].[load_agreements]
      SET status = 'accepted', responded_at = GETUTCDATE(), updatedate = GETUTCDATE(), updatedby = @userId
      WHERE id = @id AND subcontractor_id = @subId
    `,
    { id: agreementId, subId: subcontractorId, userId },
    false
  );

  return { success: true, message: 'Agreement accepted.' };
}

module.exports = {
  listLoadAgreements,
  getLoadAgreementById,
  createLoadAgreement,
  updateLoadAgreement,
  deleteLoadAgreement,
  acceptAgreement
};
