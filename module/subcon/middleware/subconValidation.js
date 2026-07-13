function sendValidationError(res, errors) {
  return res.status(400).json({ success: false, errors });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBooleanLike(value) {
  return typeof value === 'boolean' || value === 0 || value === 1 || value === '0' || value === '1';
}

function isValidDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateVehicleCreate(req, res, next) {
  const payload = req.body || {};
  const errors = [];

  if (!isNonEmptyString(payload.vehicle_reg_no)) {
    errors.push('vehicle_reg_no is required and must be a non-empty string.');
  }

  if (!isNonEmptyString(payload.asset_type)) {
    errors.push('asset_type is required and must be a non-empty string.');
  }

  if (payload.max_payload_tonnes !== undefined && payload.max_payload_tonnes !== null) {
    const value = Number(payload.max_payload_tonnes);
    if (Number.isNaN(value) || value < 0) {
      errors.push('max_payload_tonnes must be a non-negative number if provided.');
    }
  }

  if (payload.insurance_expiry_date !== undefined && payload.insurance_expiry_date !== null && payload.insurance_expiry_date !== '') {
    if (!isValidDate(payload.insurance_expiry_date)) {
      errors.push('insurance_expiry_date must be a valid date string if provided.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

function validateVehicleUpdate(req, res, next) {
  const payload = req.body || {};
  const allowedFields = ['vehicle_reg_no', 'asset_type', 'max_payload_tonnes', 'sap_equip_code', 'dcc_ng_status', 'insurance_expiry_date', 'log_inst'];
  const providedFields = Object.keys(payload).filter((field) => allowedFields.includes(field));
  const errors = [];

  if (providedFields.length === 0) {
    errors.push('At least one valid field must be provided for update.');
  }

  if (payload.vehicle_reg_no !== undefined && !isNonEmptyString(payload.vehicle_reg_no)) {
    errors.push('vehicle_reg_no must be a non-empty string.');
  }

  if (payload.asset_type !== undefined && !isNonEmptyString(payload.asset_type)) {
    errors.push('asset_type must be a non-empty string.');
  }

  if (payload.max_payload_tonnes !== undefined && payload.max_payload_tonnes !== null) {
    const value = Number(payload.max_payload_tonnes);
    if (Number.isNaN(value) || value < 0) {
      errors.push('max_payload_tonnes must be a non-negative number if provided.');
    }
  }

  if (payload.insurance_expiry_date !== undefined && payload.insurance_expiry_date !== null && payload.insurance_expiry_date !== '') {
    if (!isValidDate(payload.insurance_expiry_date)) {
      errors.push('insurance_expiry_date must be a valid date string if provided.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

function validateSubcontractorCreate(req, res, next) {
  const payload = req.body || {};
  const errors = [];

  if (!isNonEmptyString(payload.sap_card_code)) {
    errors.push('sap_card_code is required and must be a non-empty string.');
  }

  if (!isNonEmptyString(payload.company_name)) {
    errors.push('company_name is required and must be a non-empty string.');
  }

  if (!isNonEmptyString(payload.email_address)) {
    errors.push('email_address is required and must be a non-empty string.');
  } else if (!payload.email_address.includes('@')) {
    errors.push('email_address must be a valid email address.');
  }

  if (payload.phone_number !== undefined && payload.phone_number !== null && payload.phone_number !== '') {
    if (typeof payload.phone_number !== 'string' || payload.phone_number.trim().length === 0) {
      errors.push('phone_number must be a string when provided.');
    }
  }

  if (payload.is_active !== undefined && !isBooleanLike(payload.is_active)) {
    errors.push('is_active must be a boolean or 0/1 if provided.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

function validateSubcontractorUpdate(req, res, next) {
  const payload = req.body || {};
  const allowedFields = ['sap_card_code', 'company_name', 'email_address', 'phone_number', 'is_active', 'log_inst'];
  const providedFields = Object.keys(payload).filter((field) => allowedFields.includes(field));
  const errors = [];

  if (providedFields.length === 0) {
    errors.push('At least one valid field must be provided for update.');
  }

  if (payload.sap_card_code !== undefined && !isNonEmptyString(payload.sap_card_code)) {
    errors.push('sap_card_code must be a non-empty string.');
  }

  if (payload.company_name !== undefined && !isNonEmptyString(payload.company_name)) {
    errors.push('company_name must be a non-empty string.');
  }

  if (payload.email_address !== undefined) {
    if (!isNonEmptyString(payload.email_address)) {
      errors.push('email_address must be a non-empty string.');
    } else if (!payload.email_address.includes('@')) {
      errors.push('email_address must be a valid email address.');
    }
  }

  if (payload.phone_number !== undefined && payload.phone_number !== null && payload.phone_number !== '') {
    if (typeof payload.phone_number !== 'string' || payload.phone_number.trim().length === 0) {
      errors.push('phone_number must be a string when provided.');
    }
  }

  if (payload.is_active !== undefined && !isBooleanLike(payload.is_active)) {
    errors.push('is_active must be a boolean or 0/1 if provided.');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

function validateIncidentCreate(req, res, next) {
  const payload = req.body || {};
  const errors = [];

  if (payload.shipment_id !== undefined && payload.shipment_id !== null) {
    const value = Number(payload.shipment_id);
    if (Number.isNaN(value) || value <= 0) {
      errors.push('shipment_id must be a positive integer when provided.');
    }
  }

  if (!isNonEmptyString(payload.incident_type)) {
    errors.push('incident_type is required and must be a non-empty string.');
  }

  if (!isNonEmptyString(payload.description)) {
    errors.push('description is required and must be a non-empty string.');
  }

  if (payload.reported_date !== undefined && payload.reported_date !== null && payload.reported_date !== '') {
    if (!isValidDate(payload.reported_date)) {
      errors.push('reported_date must be a valid date string when provided.');
    }
  }

  if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
    if (!isNonEmptyString(payload.status)) {
      errors.push('status must be a non-empty string when provided.');
    }
  }

  if (payload.severity !== undefined && payload.severity !== null && payload.severity !== '') {
    if (!isNonEmptyString(payload.severity)) {
      errors.push('severity must be a non-empty string when provided.');
    }
  }

  if (payload.incident_location !== undefined && payload.incident_location !== null && payload.incident_location !== '') {
    if (!isNonEmptyString(payload.incident_location)) {
      errors.push('incident_location must be a non-empty string when provided.');
    }
  }

  if (payload.resolution_notes !== undefined && payload.resolution_notes !== null && payload.resolution_notes !== '') {
    if (!isNonEmptyString(payload.resolution_notes)) {
      errors.push('resolution_notes must be a non-empty string when provided.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

function validateIncidentUpdate(req, res, next) {
  const payload = req.body || {};
  const allowedFields = ['shipment_id', 'incident_type', 'description', 'reported_date', 'status', 'severity', 'incident_location', 'resolution_notes', 'log_inst'];
  const providedFields = Object.keys(payload).filter((field) => allowedFields.includes(field));
  const errors = [];

  if (providedFields.length === 0) {
    errors.push('At least one valid field must be provided for update.');
  }

  if (payload.shipment_id !== undefined && payload.shipment_id !== null) {
    const value = Number(payload.shipment_id);
    if (Number.isNaN(value) || value <= 0) {
      errors.push('shipment_id must be a positive integer when provided.');
    }
  }

  if (payload.incident_type !== undefined && payload.incident_type !== null && payload.incident_type !== '') {
    if (!isNonEmptyString(payload.incident_type)) {
      errors.push('incident_type must be a non-empty string when provided.');
    }
  }

  if (payload.description !== undefined && payload.description !== null && payload.description !== '') {
    if (!isNonEmptyString(payload.description)) {
      errors.push('description must be a non-empty string when provided.');
    }
  }

  if (payload.reported_date !== undefined && payload.reported_date !== null && payload.reported_date !== '') {
    if (!isValidDate(payload.reported_date)) {
      errors.push('reported_date must be a valid date string when provided.');
    }
  }

  if (payload.status !== undefined && payload.status !== null && payload.status !== '') {
    if (!isNonEmptyString(payload.status)) {
      errors.push('status must be a non-empty string when provided.');
    }
  }

  if (payload.severity !== undefined && payload.severity !== null && payload.severity !== '') {
    if (!isNonEmptyString(payload.severity)) {
      errors.push('severity must be a non-empty string when provided.');
    }
  }

  if (payload.incident_location !== undefined && payload.incident_location !== null && payload.incident_location !== '') {
    if (!isNonEmptyString(payload.incident_location)) {
      errors.push('incident_location must be a non-empty string when provided.');
    }
  }

  if (payload.resolution_notes !== undefined && payload.resolution_notes !== null && payload.resolution_notes !== '') {
    if (!isNonEmptyString(payload.resolution_notes)) {
      errors.push('resolution_notes must be a non-empty string when provided.');
    }
  }

  if (payload.log_inst !== undefined) {
    const value = Number(payload.log_inst);
    if (Number.isNaN(value) || value < 0) {
      errors.push('log_inst must be a non-negative integer when provided.');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

/* currently coment the validations */
function validateShipmentOrderUpdate(req, res, next) {
  const payload = req.body || {};
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

  const providedFields = Object.keys(payload).filter((field) => allowedFields.includes(field));
  const errors = [];

  /* if (providedFields.length === 0) {
    errors.push('At least one valid shipment field must be provided for update.');
  }

  if (payload.sap_doc_num !== undefined && payload.sap_doc_num !== null) {
    const value = Number(payload.sap_doc_num);
    if (Number.isNaN(value)) {
      errors.push('sap_doc_num must be a valid integer when provided.');
    }
  }

  ['vehicle_id', 'log_inst'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null) {
      const value = Number(payload[field]);
      if (Number.isNaN(value) || value < 0) {
        errors.push(`${field} must be a non-negative number when provided.`);
      }
    }
  });

  ['gross_rate_lc', 'gross_rate_sys', 'deliver_qty', 'short_qty', 'damage_qty'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null) {
      const value = Number(payload[field]);
      if (Number.isNaN(value)) {
        errors.push(`${field} must be a valid number when provided.`);
      }
    }
  });

  ['dep_origin_time', 'arr_border1_time', 'dep_border1_time', 'arr_dest_time', 'offloaded_time', 'last_sync_date', 'delivery_date'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      if (!isValidDate(payload[field])) {
        errors.push(`${field} must be a valid date/time string when provided.`);
      }
    }
  });

  ['dcc_shipment_ref', 'origin_location', 'destination_location', 'status', 'pod_document_url', 'final_invoice_url', 'receiver_name'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      if (!isNonEmptyString(payload[field])) {
        errors.push(`${field} must be a non-empty string when provided.`);
      }
    }
  }); */

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
}

module.exports = {
  validateVehicleCreate,
  validateVehicleUpdate,
  validateSubcontractorCreate,
  validateSubcontractorUpdate,
  validateIncidentCreate,
  validateIncidentUpdate,
  validateShipmentOrderUpdate
};
