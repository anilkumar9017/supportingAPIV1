const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../../config/database');

const SUBCON_JWT_SECRET = process.env.SUBCON_JWT_SECRET || process.env.JWT_SECRET || 'super-secret-logistics-key';

async function loginSubconUser({ email, password, databaseName }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const query = `
    SELECT TOP 1
      u.id,
      u.subcontractor_id,
      u.role_name,
      u.password_hash,
      s.sap_card_code,
      s.company_name
    FROM [subcon].[users] u
    INNER JOIN [subcon].[subcontractors] s ON u.subcontractor_id = s.id
    WHERE u.email = @email AND u.is_active = 1
  `;

  const users = await db.executeQuery(databaseName, query, { email }, false);

  if (!users || users.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = users[0];

  let isPasswordValid = false;

  if (user.password_hash) {
    if (typeof user.password_hash === 'string' && user.password_hash.startsWith('$2')) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      isPasswordValid = password === user.password_hash;
    }
  }

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    {
      id: user.id,
      subcontractor_id: user.subcontractor_id,
      sap_card_code: user.sap_card_code,
      role_name: user.role_name,
      dbname: databaseName
    },
    SUBCON_JWT_SECRET,
    { expiresIn: '12h' }
  );

  await db.executeQuery(
    databaseName,
    `UPDATE [subcon].[users] SET last_login_date = GETUTCDATE(), updatedate = GETUTCDATE(), updatedby = @userId WHERE id = @userId`,
    { userId: user.id },
    false
  );

  return {
    success: true,
    token,
    company: user.company_name,
    userId: user.id
  };
}

async function getUsers(databaseName) {
  const query = `
    SELECT id, subcontractor_id, role_name, full_name, email, password_hash, is_active, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[users]
    ORDER BY createdate DESC
  `;

  return db.executeQuery(databaseName, query, {}, false);
}

async function getUserById(databaseName, userId) {
  const query = `
    SELECT id, subcontractor_id, role_name, full_name, email, password_hash, is_active, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[users]
    WHERE id = @id
  `;

  const result = await db.executeQuery(databaseName, query, { id: userId }, false);
  return result && result.length > 0 ? result[0] : null;
}

async function createUser(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[users] (
      subcontractor_id, role_name, full_name, email, password_hash, is_active, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    ) VALUES (
      @subcontractor_id, @role_name, @full_name, @email, @password_hash, @is_active, @last_login_date, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst
    )
  `;

  await db.executeQuery(
    databaseName,
    query,
    {
      subcontractor_id: payload.subcontractor_id,
      role_name: payload.role_name,
      full_name: payload.full_name,
      email: payload.email,
      password_hash: payload.password_hash,
      is_active: payload.is_active !== undefined ? payload.is_active : 1,
      last_login_date: payload.last_login_date || null,
      createdby: payload.createdby || null,
      updatedby: payload.updatedby || null,
      log_inst: payload.log_inst !== undefined ? payload.log_inst : 1
    },
    false
  );

  return { success: true, message: 'User created successfully.' };
}

async function updateUser(databaseName, userId, payload, updatedBy) {
  const allowedFields = ['subcontractor_id', 'role_name', 'full_name', 'email', 'password_hash', 'is_active', 'last_login_date', 'log_inst'];
  const updates = [];
  const params = { id: userId, updatedby: updatedBy };

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates.push(`${field} = @${field}`);
      params[field] = payload[field];
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  updates.push('updatedate = GETUTCDATE()');
  updates.push('updatedby = @updatedby');

  const query = `
    UPDATE [subcon].[users]
    SET ${updates.join(', ')}
    WHERE id = @id
  `;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'User updated successfully.' };
}

async function deleteUser(databaseName, userId) {
  await db.executeQuery(databaseName, 'DELETE FROM [subcon].[users] WHERE id = @id', { id: userId }, false);
  return { success: true, message: 'User deleted successfully.' };
}

async function getAgreements(databaseName, subcontractorId) {
  const query = `
    SELECT id, dcc_offer_ref, origin_location, destination_location, cargo_description, tonnage, agreed_rate_lc, agreed_rate_sys, status
    FROM [subcon].[load_agreements]
    WHERE subcontractor_id = @subId AND status = 'pending'
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
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

async function updateMilestones(databaseName, updates, userId) {
  for (const update of updates) {
    const query = `
      UPDATE [subcon].[shipment_orders]
      SET ${update.milestoneField} = @timestampVal,
          updatedate = GETUTCDATE(),
          updatedby = @updatedBy
      WHERE id = @shipmentId
    `;

    await db.executeQuery(
      databaseName,
      query,
      {
        shipmentId: update.shipmentId,
        timestampVal: update.timestamp,
        updatedBy: userId
      },
      false
    );
  }

  return { success: true, message: 'Tracking milestones updated successfully.' };
}

async function requestAdvance(databaseName, { shipmentId, type, amount, amountSys, remarks }) {
  await db.executeQuery(
    databaseName,
    `
      INSERT INTO [subcon].[advance_requests] (shipment_id, advance_type, amount_requested_lc, amount_requested_sys, status, requested_at, remarks)
      VALUES (@shipmentId, @type, @amountLc, @amountSys, 'pending', GETUTCDATE(), @remarks)
    `,
    {
      shipmentId,
      type,
      amountLc: amount,
      amountSys: amountSys || null,
      remarks: remarks || null
    },
    false
  );

  return { success: true, message: 'Advance request queued for SAP B1.' };
}

async function getFinancials(databaseName, subcontractorId) {
  const query = `
    SELECT shipment_id, dcc_shipment_ref, vehicle_reg_no, origin_location, destination_location,
           status, gross_rate_lc, gross_rate_sys, total_advances_lc, total_advances_sys, net_payable_lc, net_payable_sys, offloaded_time
    FROM [subcon].[vw_shipment_financial_summary]
    WHERE subcontractor_id = @subId
    ORDER BY offloaded_time DESC
  `;

  return db.executeQuery(databaseName, query, { subId: subcontractorId }, false);
}

async function uploadDocuments(databaseName, { shipmentId, podFile, invFile, invoiceNumber, userId }) {
  await db.executeQuery(
    databaseName,
    `
      UPDATE [subcon].[shipment_orders]
      SET pod_document_url = @podUrl,
          final_invoice_url = @invUrl,
          status = 'invoiced',
          updatedate = GETUTCDATE(),
          updatedby = @userId
      WHERE id = @id
    `,
    {
      id: shipmentId,
      podUrl: podFile ? `/uploads/${podFile}` : null,
      invUrl: invFile ? `/uploads/${invFile}` : null,
      userId
    },
    false
  );

  return { success: true, message: 'Documents uploaded and sent to SAP B1.' };
}

module.exports = {
  loginSubconUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAgreements,
  acceptAgreement,
  getShipments,
  updateMilestones,
  requestAdvance,
  getFinancials,
  uploadDocuments
};
