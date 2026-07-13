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

async function getActionCenter(databaseName, subcontractorId) {
  const pendingAgreementsQuery = `
    SELECT COUNT(1) AS count
    FROM [subcon].[load_agreements]
    WHERE subcontractor_id = @subId AND status = 'pending'
  `;

  const missingTrackingUpdatesQuery = `
    SELECT COUNT(1) AS count
    FROM [subcon].[shipment_orders]
    WHERE subcontractor_id = @subId
      AND status IN ('dispatched', 'in_transit', 'delayed')
      AND (
        dep_origin_time IS NULL
        OR arr_border1_time IS NULL
        OR arr_dest_time IS NULL
        OR offloaded_time IS NULL
      )
  `;

  const pendingAdvanceRequestsQuery = `
    SELECT COUNT(1) AS count
    FROM [subcon].[advance_requests]
    WHERE subcontractor_id = @subId AND status = 'pending'
  `;

  const missingDocumentsQuery = `
    SELECT COUNT(1) AS count
    FROM [subcon].[shipment_orders]
    WHERE subcontractor_id = @subId
      AND (pod_document_url IS NULL OR final_invoice_url IS NULL)
  `;

  const [pendingAgreements] = await db.executeQuery(databaseName, pendingAgreementsQuery, { subId: subcontractorId }, false);
  const [missingTrackingUpdates] = await db.executeQuery(databaseName, missingTrackingUpdatesQuery, { subId: subcontractorId }, false);
  const [pendingAdvanceRequests] = await db.executeQuery(databaseName, pendingAdvanceRequestsQuery, { subId: subcontractorId }, false);
  const [missingDocuments] = await db.executeQuery(databaseName, missingDocumentsQuery, { subId: subcontractorId }, false);

  return {
    actionCenter: {
      widgets: [
        {
          key: 'pendingAgreements',
          label: 'Pending Agreements',
          count: pendingAgreements?.count || 0,
          description: 'Accept agreements that require your review.',
          route: '/agreements'
        },
        {
          key: 'missingTrackingUpdates',
          label: 'Missing Tracking Updates',
          count: missingTrackingUpdates?.count || 0,
          description: 'Update shipment milestones before the next checkpoint.',
          route: '/shipments'
        },
        {
          key: 'pendingAdvanceRequests',
          label: 'Pending Advance Requests',
          count: pendingAdvanceRequests?.count || 0,
          description: 'Review advance requests that are awaiting approval.',
          route: '/shipments/advance'
        },
        {
          key: 'missingDocuments',
          label: 'Missing POD / Invoice',
          count: missingDocuments?.count || 0,
          description: 'Upload missing Proof of Delivery or invoice documents.',
          route: '/financials/upload'
        }
      ]
    }
  };
}

async function getDashboardOverview(databaseName, subcontractorId) {
  const activeShipmentsQuery = `
    SELECT TOP 20
      id,
      dcc_shipment_ref,
      vehicle_id,
      origin_location,
      destination_location,
      dep_origin_time,
      arr_dest_time,
      offloaded_time,
      status
    FROM [subcon].[shipment_orders]
    WHERE subcontractor_id = @subId
    ORDER BY dep_origin_time DESC
  `;

  const pendingAgreementsQuery = `
    SELECT TOP 20
      id,
      dcc_offer_ref,
      origin_location,
      destination_location,
      cargo_description,
      tonnage,
      agreed_rate_lc,
      status
    FROM [subcon].[load_agreements]
    WHERE subcontractor_id = @subId
    ORDER BY id DESC
  `;

  const advanceRequestsQuery = `
    SELECT TOP 20
      id,
      shipment_id,
      advance_type,
      amount_requested_lc,
      amount_requested_sys,
      status,
      requested_at,
      remarks
    FROM [subcon].[advance_requests]
    WHERE subcontractor_id = @subId
    ORDER BY requested_at DESC
  `;

  const financialRowsQuery = `
    SELECT TOP 20
      shipment_id,
      dcc_shipment_ref,
      vehicle_reg_no,
      origin_location,
      destination_location,
      gross_rate_lc,
      total_advances_lc,
      net_payable_lc,
      offloaded_time,
      status
    FROM [subcon].[vw_shipment_financial_summary]
    WHERE subcontractor_id = @subId
    ORDER BY offloaded_time DESC
  `;

  const activeShipments = await db.executeQuery(databaseName, activeShipmentsQuery, { subId: subcontractorId }, false);
  const pendingAgreements = await db.executeQuery(databaseName, pendingAgreementsQuery, { subId: subcontractorId }, false);
  const advanceRequests = await db.executeQuery(databaseName, advanceRequestsQuery, { subId: subcontractorId }, false);
  const financialRows = await db.executeQuery(databaseName, financialRowsQuery, { subId: subcontractorId }, false);

  return {
    tables: {
      activeShipments,
      pendingAgreements,
      advanceRequests,
      financialRows
    }
  };
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
  getAgreements,
  acceptAgreement,
  getActionCenter,
  updateMilestones,
  requestAdvance,
  getFinancials,
  getDashboardOverview,
  uploadDocuments
};
