const db = require('../../../config/database');

async function listDemurrageClaims(databaseName, subcontractorId, filters = {}) {
  const { status } = filters;
  const params = { subId: subcontractorId };

  let query = `
    SELECT dc.id,
           dc.shipment_id,
           dc.arrival_time,
           dc.offloaded_time,
           dc.turnaround_hours,
           dc.free_hours,
           dc.billable_hours,
           dc.claim_amount,
           dc.remarks,
           dc.supporting_document_url,
           dc.status,
           dc.sap_document_no,
           dc.sap_status,
           dc.created_by,
           dc.approved_by,
           dc.created_at,
           dc.updated_at
    FROM [subcon].[demurrage_claims] dc
    INNER JOIN [subcon].[shipment_orders] so ON so.id = dc.shipment_id
    WHERE so.subcontractor_id = @subId
  `;

  if (status) {
    query += ' AND dc.status = @status';
    params.status = status;
  }

  query += ' ORDER BY dc.created_at DESC, dc.id DESC';

  return db.executeQuery(databaseName, query, params, false);
}

async function getDemurrageClaimById(databaseName, claimId, subcontractorId) {
  const query = `
    SELECT dc.id,
           dc.shipment_id,
           dc.arrival_time,
           dc.offloaded_time,
           dc.turnaround_hours,
           dc.free_hours,
           dc.billable_hours,
           dc.claim_amount,
           dc.remarks,
           dc.supporting_document_url,
           dc.status,
           dc.sap_document_no,
           dc.sap_status,
           dc.created_by,
           dc.approved_by,
           dc.created_at,
           dc.updated_at
    FROM [subcon].[demurrage_claims] dc
    INNER JOIN [subcon].[shipment_orders] so ON so.id = dc.shipment_id
    WHERE dc.id = @id AND so.subcontractor_id = @subId
  `;

  const rows = await db.executeQuery(databaseName, query, { id: claimId, subId: subcontractorId }, false);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function createDemurrageClaim(databaseName, payload) {
  const shipmentCheck = await db.executeQuery(
    databaseName,
    `SELECT id FROM [subcon].[shipment_orders] WHERE id = @shipmentId AND subcontractor_id = @subcontractor_id`,
    {
      shipmentId: payload.shipment_id,
      subcontractor_id: payload.subcontractor_id
    },
    false
  );

  if (!shipmentCheck || shipmentCheck.length === 0) {
    const error = new Error('Shipment not found for the authenticated subcontractor');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const query = `
    INSERT INTO [subcon].[demurrage_claims]
      (shipment_id, arrival_time, offloaded_time, turnaround_hours, free_hours, billable_hours,
       claim_amount, remarks, supporting_document_url, status, sap_document_no, sap_status,
       created_by, approved_by, created_at, updated_at)
    VALUES
      (@shipment_id, @arrival_time, @offloaded_time, @turnaround_hours, @free_hours, @billable_hours,
       @claim_amount, @remarks, @supporting_document_url, @status, @sap_document_no, @sap_status,
       @created_by, @approved_by, GETDATE(), GETDATE())
  `;

  await db.executeQuery(databaseName, query, {
    shipment_id: payload.shipment_id,
    arrival_time: payload.arrival_time || null,
    offloaded_time: payload.offloaded_time || null,
    turnaround_hours: payload.turnaround_hours || null,
    free_hours: payload.free_hours || null,
    billable_hours: payload.billable_hours || null,
    claim_amount: payload.claim_amount,
    remarks: payload.remarks || null,
    supporting_document_url: payload.supporting_document_url || null,
    status: payload.status || 'Draft',
    sap_document_no: payload.sap_document_no || null,
    sap_status: payload.sap_status || null,
    created_by: payload.created_by || null,
    approved_by: payload.approved_by || null
  }, false);

  return { success: true, message: 'Demurrage claim created successfully.' };
}

async function updateDemurrageClaim(databaseName, claimId, payload, updatedBy, subcontractorId) {
  const allowedFields = [
    'shipment_id',
    'arrival_time',
    'offloaded_time',
    'turnaround_hours',
    'free_hours',
    'billable_hours',
    'claim_amount',
    'remarks',
    'supporting_document_url',
    'status',
    'sap_document_no',
    'sap_status',
    'approved_by'
  ];

  const updates = [];
  const params = {
    id: claimId,
    updatedBy: updatedBy,
    subId: subcontractorId
  };

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates.push(`${field} = @${field}`);
      params[field] = payload[field];
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields provided for update.');
  }

  const claimRow = await db.executeQuery(
    databaseName,
    `SELECT dc.id FROM [subcon].[demurrage_claims] dc INNER JOIN [subcon].[shipment_orders] so ON so.id = dc.shipment_id WHERE dc.id = @id AND so.subcontractor_id = @subId`,
    { id: claimId, subId: subcontractorId },
    false
  );

  if (!claimRow || claimRow.length === 0) {
    const error = new Error('Demurrage claim not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const query = `
    UPDATE [subcon].[demurrage_claims]
    SET ${updates.join(', ')}, updated_at = GETDATE()
    WHERE id = @id
  `;

  await db.executeQuery(databaseName, query, params, false);

  return { success: true, message: 'Demurrage claim updated successfully.' };
}

async function deleteDemurrageClaim(databaseName, claimId, subcontractorId) {
  const claimRow = await db.executeQuery(
    databaseName,
    `SELECT dc.id FROM [subcon].[demurrage_claims] dc INNER JOIN [subcon].[shipment_orders] so ON so.id = dc.shipment_id WHERE dc.id = @id AND so.subcontractor_id = @subId`,
    { id: claimId, subId: subcontractorId },
    false
  );

  if (!claimRow || claimRow.length === 0) {
    const error = new Error('Demurrage claim not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await db.executeQuery(
    databaseName,
    `DELETE FROM [subcon].[demurrage_claims] WHERE id = @id`,
    { id: claimId },
    false
  );

  return { success: true, message: 'Demurrage claim deleted successfully.' };
}

async function uploadSupportingDocument(databaseName, claimId, supportingDocumentUrl, subcontractorId) {
  const claimRow = await db.executeQuery(
    databaseName,
    `SELECT dc.id FROM [subcon].[demurrage_claims] dc INNER JOIN [subcon].[shipment_orders] so ON so.id = dc.shipment_id WHERE dc.id = @id AND so.subcontractor_id = @subId`,
    { id: claimId, subId: subcontractorId },
    false
  );

  if (!claimRow || claimRow.length === 0) {
    const error = new Error('Demurrage claim not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await db.executeQuery(
    databaseName,
    `
      UPDATE [subcon].[demurrage_claims]
      SET supporting_document_url = @supportingDocumentUrl,
          updated_at = GETDATE()
      WHERE id = @id
    `,
    {
      id: claimId,
      supportingDocumentUrl
    },
    false
  );

  return { success: true, message: 'Supporting document uploaded successfully.' };
}

module.exports = {
  listDemurrageClaims,
  getDemurrageClaimById,
  createDemurrageClaim,
  updateDemurrageClaim,
  deleteDemurrageClaim,
  uploadSupportingDocument
};
