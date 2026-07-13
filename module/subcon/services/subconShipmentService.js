const db = require('../../../config/database');

async function getShipments(databaseName, subcontractorId) {
  const query = `
    SELECT s.id, s.dcc_shipment_ref, v.vehicle_reg_no, s.origin_location, s.destination_location,
           s.dep_origin_time, s.arr_border1_time, s.arr_dest_time, s.offloaded_time, s.status
    FROM [subcon].[shipment_orders] s
    INNER JOIN [subcon].[vehicles] v ON s.vehicle_id = v.id
    WHERE s.subcontractor_id = @subId AND s.status IN ('dispatched', 'in_transit', 'delayed')
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
}

async function getShipmentById(databaseName, shipmentId, subcontractorId) {
  const query = `
    SELECT s.id, s.subcontractor_id, s.dcc_shipment_ref, s.sap_doc_num, s.vehicle_id,
           s.origin_location, s.destination_location, s.dep_origin_time, s.arr_border1_time,
           s.dep_border1_time, s.arr_dest_time, s.offloaded_time, s.gross_rate_lc,
           s.gross_rate_sys, s.status, s.pod_document_url, s.final_invoice_url,
           s.last_sync_date, s.createdate, s.updatedate, s.createdby, s.updatedby,
           s.log_inst, s.delivery_date, s.deliver_qty, s.short_qty, s.damage_qty,
           s.receiver_name
    FROM [subcon].[shipment_orders] s
    WHERE s.id = @id AND s.subcontractor_id = @subId
  `;

  const result = await db.executeQuery(databaseName, query, { id: shipmentId, subId: subcontractorId }, false);
  return result && result.length > 0 ? result[0] : null;
}

async function updateShipmentOrder(databaseName, shipmentId, payload, updatedBy, subcontractorId) {
  // Concurrency: clients may send `log_inst` (their known version).
  // We will fetch the current `log_inst` from DB and prevent updates when
  // the incoming `log_inst` is less than the stored value (stale client).
  const allowedFields = [
    'dcc_shipment_ref',
    'sap_doc_num',
    'vehicle_id',
    'origin_location',
    'destination_location',
    'dep_origin_time',
    'arr_border1_time',
    'dep_border1_time',
    'arr_dest_time',
    'offloaded_time',
    'gross_rate_lc',
    'gross_rate_sys',
    'status',
    'pod_document_url',
    'final_invoice_url',
    'last_sync_date',
    'delivery_date',
    'deliver_qty',
    'short_qty',
    'damage_qty',
    'receiver_name'
  ];

  // Read current log_inst to detect concurrent modifications
  const currentRows = await db.executeQuery(
    databaseName,
    `SELECT log_inst FROM [subcon].[shipment_orders] WHERE id = @id AND subcontractor_id = @subId`,
    { id: shipmentId, subId: subcontractorId },
    false
  );

  if (!currentRows || currentRows.length === 0) {
    const err = new Error('Shipment not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const currentLogInst = Number(currentRows[0].log_inst) || 0;

  if (payload.log_inst !== undefined && payload.log_inst !== null) {
    const incoming = Number(payload.log_inst);
    if (Number.isNaN(incoming)) {
      const err = new Error('Invalid log_inst value');
      err.code = 'INVALID';
      throw err;
    }

    // If the client's version is older than DB version, reject to avoid overwrite
    if (incoming < currentLogInst) {
      const err = new Error('Record modified by another user. Refresh and resubmit.');
      err.code = 'CONFLICT';
      throw err;
    }
  }

  const updates = [];
  const params = {
    id: shipmentId,
    updatedby: updatedBy,
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

  // Increment log_inst to mark new version and include in update
  const newLogInst = currentLogInst + 1;
  updates.push('log_inst = @newLogInst');
  params.newLogInst = newLogInst;

  const query = `
    UPDATE [subcon].[shipment_orders]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  await db.executeQuery(databaseName, query, params, false);

  return { success: true, message: 'Shipment order updated successfully.', log_inst: newLogInst };
}

module.exports = {
  getShipments,
  getShipmentById,
  updateShipmentOrder
};
