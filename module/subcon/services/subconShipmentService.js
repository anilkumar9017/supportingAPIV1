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
    'receiver_name',
    'log_inst'
  ];

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

  const query = `
    UPDATE [subcon].[shipment_orders]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  await db.executeQuery(databaseName, query, params, false);

  return { success: true, message: 'Shipment order updated successfully.' };
}

module.exports = {
  getShipments,
  getShipmentById,
  updateShipmentOrder
};
