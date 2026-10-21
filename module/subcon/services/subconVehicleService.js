const db = require('../../../config/database');
const subconCommitService = require('./subconCommitService');
const { startEmailWorker } = require('../../../services/emailWorker');

async function getVehicleStatus(databaseName, subcontractorId) {
  const query = `
    SELECT *
    FROM m_vehicle_status
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
}

async function getVehicles(databaseName, subcontractorId) {
  const query = `
    SELECT id, subcontractor_id, vehicle_reg_no, asset_type, max_payload_tonnes,
           sap_equip_code, dcc_ng_status, insurance_expiry_date, available_date, current_location, route_location, container_size, remarks, createdate, updatedate,
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
           sap_equip_code, dcc_ng_status, insurance_expiry_date, available_date, current_location, route_location, container_size, remarks, createdate, updatedate,
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
      (subcontractor_id, vehicle_reg_no, asset_type, max_payload_tonnes, sap_equip_code, dcc_ng_status, insurance_expiry_date, available_date, current_location, route_location, container_size, remarks, createdate, updatedate, createdby, updatedby, log_inst)
    OUTPUT INSERTED.id
    VALUES
      (@subcontractor_id, @vehicle_reg_no, @asset_type, @max_payload_tonnes, @sap_equip_code, @dcc_ng_status, @insurance_expiry_date, @available_date, @current_location, @route_location, @container_size, @remarks, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst)
  `;

  const result = await db.executeQuery(databaseName, query, {
    subcontractor_id: payload.subcontractor_id,
    vehicle_reg_no: payload.vehicle_reg_no,
    asset_type: payload.asset_type,
    max_payload_tonnes: payload.max_payload_tonnes || null,
    sap_equip_code: payload.sap_equip_code || null,
    dcc_ng_status: payload.dcc_ng_status || 'pending',
    insurance_expiry_date: payload.insurance_expiry_date || null,
    available_date: payload.available_date || null,
    current_location: payload.current_location || null,
    route_location: payload.route_location || null,
    container_size: payload.container_size || null,
    remarks: payload.remarks || null,
    createdby: payload.createdby || null,
    updatedby: payload.updatedby || null,
    log_inst: payload.log_inst || 1
  }, false);

  await subconCommitService.commit(databaseName, 'subcon.vehicles', 'C', result[0]?.id);
  return { success: true, message: 'Vehicle created successfully.' };
}

async function updateVehicle(databaseName, vehicleId, payload, updatedBy, subcontractorId) {
  const allowedFields = ['vehicle_reg_no', 'asset_type', 'max_payload_tonnes', 'sap_equip_code', 'dcc_ng_status', 'insurance_expiry_date', 'available_date', 'current_location', 'route_location', 'container_size', 'remarks', 'log_inst'];
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

  params.subId = subcontractorId;
  const currentVehicleRows = await db.executeQuery(
    databaseName,
    `
      SELECT CONVERT(char(10), available_date, 23) AS available_date
      FROM [subcon].[vehicles]
      WHERE id = @id AND subcontractor_id = @subId
    `,
    { id: vehicleId, subId: subcontractorId },
    false
  );
  const currentVehicle = currentVehicleRows?.[0];
  if (!currentVehicle) {
    throw new Error('Vehicle not found');
  }

  const hasAvailableDate = Object.prototype.hasOwnProperty.call(payload, 'available_date');
  const currentAvailableDate = currentVehicle.available_date || null;
  const requestedAvailableDate = payload.available_date == null
    ? null
    : String(payload.available_date).slice(0, 10);
  const skipEmailEvent = hasAvailableDate && currentAvailableDate === requestedAvailableDate;

  const query = `
    UPDATE [subcon].[vehicles]
    SET ${updates.join(', ')}, updatedate = GETUTCDATE(), updatedby = @updatedby
    WHERE id = @id AND subcontractor_id = @subId
  `;

  await db.executeQuery(databaseName, query, params, false);
  await subconCommitService.commit(databaseName, 'subcon.vehicles', 'U', vehicleId);

  let emailQueueItemsTriggered = 0;
  if (!skipEmailEvent) {
    const queueItems = await subconCommitService.processEmailEvent(
      databaseName,
      'subcon.vehicles',
      'U',
      vehicleId
    );

    for (const item of queueItems) {
      let triggerStatus = 'N';
      try {
        await startEmailWorker({
          dbName: databaseName,
          ID: item.ID,
          Email_Event_Config_Id: item.Email_Event_Config_Id,
          EntityId: item.EntityId,
          ChildId: item.ChildId,
          CombinedIds: item.CombinedIds
        });
        triggerStatus = 'Y';
        emailQueueItemsTriggered += 1;
      } catch (error) {
        console.error(`Failed to trigger email queue item ${item.ID}:`, error.message);
      }

      await db.executeQuery(
        databaseName,
        `
          UPDATE [dbo].[d_email_queue]
          SET tgr_status = @status, updatedate = GETDATE()
          WHERE id = @id
        `,
        { status: triggerStatus, id: item.ID },
        false
      );
    }
  }

  return {
    success: true,
    message: 'Vehicle updated successfully.',
    emailWorkerTriggered: emailQueueItemsTriggered > 0,
    emailQueueItemsTriggered
  };
}

async function deleteVehicle(databaseName, vehicleId, subcontractorId) {
  const query = `DELETE FROM [subcon].[vehicles] WHERE id = @id AND subcontractor_id = @subId`;
  await db.executeQuery(databaseName, query, { id: vehicleId, subId: subcontractorId }, false);
  return { success: true, message: 'Vehicle deleted successfully.' };
}

module.exports = {
  getVehicleStatus,
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
