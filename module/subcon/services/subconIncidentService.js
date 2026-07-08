const db = require('../../../config/database');

async function getIncidents(databaseName, subcontractorId) {
  const query = `
    SELECT id, subcontractor_id, shipment_id, incident_type, description, reported_date,
           status, severity, incident_location, resolution_notes, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[incidents]
    WHERE subcontractor_id = @subId
    ORDER BY reported_date DESC, id DESC
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
}

async function getIncidentById(databaseName, incidentId, subcontractorId) {
  const query = `
    SELECT id, subcontractor_id, shipment_id, incident_type, description, reported_date,
           status, severity, incident_location, resolution_notes, createdate, updatedate,
           createdby, updatedby, log_inst
    FROM [subcon].[incidents]
    WHERE id = @id AND subcontractor_id = @subId
  `;

  const rows = await db.executeQuery(databaseName, query, { id: incidentId, subId: subcontractorId }, false);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function createIncident(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[incidents]
      (subcontractor_id, shipment_id, incident_type, description, reported_date, status,
       severity, incident_location, resolution_notes, createdate, updatedate, createdby, updatedby, log_inst)
    VALUES
      (@subcontractor_id, @shipment_id, @incident_type, @description, @reported_date, @status,
       @severity, @incident_location, @resolution_notes, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst)
  `;

  await db.executeQuery(databaseName, query, {
    subcontractor_id: payload.subcontractor_id,
    shipment_id: payload.shipment_id,
    incident_type: payload.incident_type,
    description: payload.description,
    reported_date: payload.reported_date,
    status: payload.status,
    severity: payload.severity,
    incident_location: payload.incident_location,
    resolution_notes: payload.resolution_notes,
    createdby: payload.createdby,
    updatedby: payload.updatedby,
    log_inst: payload.log_inst || 1
  }, false);

  return { success: true, message: 'Incident created successfully.' };
}

async function updateIncident(databaseName, incidentId, payload, updatedBy, subcontractorId) {
  const allowedFields = ['shipment_id', 'incident_type', 'description', 'reported_date', 'status', 'severity', 'incident_location', 'resolution_notes', 'log_inst'];
  const updates = [];
  const params = { id: incidentId, subId: subcontractorId, updatedby: updatedBy };

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
    UPDATE [subcon].[incidents]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'Incident updated successfully.' };
}

async function deleteIncident(databaseName, incidentId, subcontractorId) {
  const query = `DELETE FROM [subcon].[incidents] WHERE id = @id AND subcontractor_id = @subId`;
  await db.executeQuery(databaseName, query, { id: incidentId, subId: subcontractorId }, false);
  return { success: true, message: 'Incident deleted successfully.' };
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
};
