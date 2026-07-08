const db = require('../../../config/database');

async function getSubcontractors(databaseName) {
  const query = `
    SELECT id, sap_card_code, company_name, email_address, phone_number,
           is_active, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[subcontractors]
    ORDER BY createdate DESC
  `;

  return db.executeQuery(databaseName, query, {}, false);
}

async function getSubcontractorById(databaseName, id) {
  const query = `
    SELECT id, sap_card_code, company_name, email_address, phone_number,
           is_active, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[subcontractors]
    WHERE id = @id
  `;

  const rows = await db.executeQuery(databaseName, query, { id }, false);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function createSubcontractor(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[subcontractors]
      (sap_card_code, company_name, email_address, phone_number, is_active, createdate, updatedate, createdby, updatedby, log_inst)
    VALUES
      (@sap_card_code, @company_name, @email_address, @phone_number, @is_active, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst)
  `;

  await db.executeQuery(databaseName, query, {
    sap_card_code: payload.sap_card_code,
    company_name: payload.company_name,
    email_address: payload.email_address,
    phone_number: payload.phone_number || null,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    createdby: payload.createdby || null,
    updatedby: payload.updatedby || null,
    log_inst: payload.log_inst || 1
  }, false);

  return { success: true, message: 'Subcontractor created successfully.' };
}

async function updateSubcontractor(databaseName, id, payload, updatedBy) {
  const allowedFields = ['sap_card_code', 'company_name', 'email_address', 'phone_number', 'is_active', 'log_inst'];
  const updates = [];
  const params = { id, updatedby: updatedBy };

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
    UPDATE [subcon].[subcontractors]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id
  `;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'Subcontractor updated successfully.' };
}

async function deleteSubcontractor(databaseName, id) {
  const query = `DELETE FROM [subcon].[subcontractors] WHERE id = @id`;
  await db.executeQuery(databaseName, query, { id }, false);
  return { success: true, message: 'Subcontractor deleted successfully.' };
}

module.exports = {
  getSubcontractors,
  getSubcontractorById,
  createSubcontractor,
  updateSubcontractor,
  deleteSubcontractor
};
