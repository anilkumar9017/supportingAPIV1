const db = require('../config/database');
const crypto = require('crypto');
const moment = require('moment');


/**
 * Get agreement by GUID (public access)
 */
async function getAgreementByGuid(req, res) {
  try {
    const { guid } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }
    
    const query = `
      SELECT 
        id, guid, bp_name, bp_email, html_template, 
        status, is_signed, expires, remarks, log_inst
      FROM d_bp_agreement_docs 
      WHERE guid = @guid
    `;
    
    const result = await db.executeQuery(databaseName, query, { guid }, useApi);
    
    if (result && result.length > 0) {
      if(moment(result[0]?.expires).isSameOrAfter(moment())){
        res.json({
            success: true,
            data: result[0]
        });
      }else{
        res.status(204).json({
            success: false,
            message: 'Agreement expired'
        });
      }
    } else {
      res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }
  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Submit signed agreement (public access)
 */
async function signAgreement(req, res) {
  try {
    const { guid } = req.params;
    const { html_template, bp_remarks, log_inst } = req.body;
    const useApi = req.useApi || false;
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }
    
    if (!html_template) {
      return res.status(400).json({
        success: false,
        message: 'html_template is required'
      });
    }
    
    const updateQuery = `
      UPDATE d_bp_agreement_docs 
      SET 
        html_template = @html_template,
        is_signed = 'Y',
        status = 'signed',
        bp_remarks = @bp_remarks,
        updatedate = GETDATE(),
        log_inst = @log_inst
      WHERE guid = @guid
    `;
    
    await db.executeQuery(databaseName, updateQuery, {
      guid,
      html_template,
      bp_remarks,
      log_inst
    }, useApi);
    
    res.json({
      success: true,
      message: 'Agreement signed successfully'
    });
  } catch (error) {
    console.error('Error signing agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get all agreements (authenticated)
 */
async function getAllAgreements(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved from token or header)
    const databaseName = req.databaseName || 'default';
    
    let query = 'SELECT * FROM d_bp_agreement_docs WHERE 1=1';
    const params = {};
    
    if (status && status !== 'all') {
      query += ' AND status = @status';
      params.status = status;
    }
    
    query += ' ORDER BY createdate DESC';
    
    const result = await db.executeQuery(databaseName, query, params, useApi);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error('Error fetching agreements:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get agreement by ID (authenticated)
 */
async function getAgreementById(req, res) {
  try {
    const { id } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const query = 'SELECT * FROM d_bp_agreement_docs WHERE id = @id';
    const result = await db.executeQuery(databaseName, query, { id }, useApi);
    
    if (result && result.length > 0) {
      res.json({
        success: true,
        data: result[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }
  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Create new agreement (authenticated)
 */
async function createAgreement(req, res) {
  try {
    const {
      template_id,
      bp_name,
      bp_email,
      html_template,
      status = 'draft',
      expires,
      remarks
    } = req.body;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    if (!bp_name || !html_template) {
      return res.status(400).json({
        success: false,
        message: 'bp_name and html_template are required'
      });
    }
    
    const guid = crypto.randomUUID();
    
    const insertQuery = `
      INSERT INTO d_bp_agreement_docs 
      (template_id, bp_name, bp_email, html_template, status, expires, remarks, guid, created_at)
      VALUES 
      (@template_id, @bp_name, @bp_email, @html_template, @status, @expires, @remarks, @guid, GETDATE())
    `;
    
    await db.executeQuery(databaseName, insertQuery, {
      template_id: template_id || null,
      bp_name,
      bp_email: bp_email || null,
      html_template,
      status,
      expires: expires || null,
      remarks: remarks || null,
      guid
    }, useApi);
    
    res.status(201).json({
      success: true,
      message: 'Agreement created successfully',
      data: { guid }
    });
  } catch (error) {
    console.error('Error creating agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Update agreement (authenticated)
 */
async function updateAgreement(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const allowedFields = ['bp_name', 'bp_email', 'html_template', 'status', 'expires', 'remarks'];
    const updates = [];
    const params = { id };
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = @${field}`);
        params[field] = updateData[field];
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const query = `
      UPDATE d_bp_agreement_docs 
      SET ${updates.join(', ')}, updated_at = GETDATE()
      WHERE id = @id
    `;
    
    await db.executeQuery(databaseName, query, params, useApi);
    
    res.json({
      success: true,
      message: 'Agreement updated successfully'
    });
  } catch (error) {
    console.error('Error updating agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Delete agreement (authenticated)
 */
async function deleteAgreement(req, res) {
  try {
    const { id } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const query = 'DELETE FROM d_bp_agreement_docs WHERE id = @id';
    await db.executeQuery(databaseName, query, { id }, useApi);
    
    res.json({
      success: true,
      message: 'Agreement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agreement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Send agreement email (authenticated)
 */
async function sendAgreementEmail(req, res) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    // Get agreement
    const getQuery = 'SELECT * FROM d_bp_agreement_docs WHERE id = @id';
    const agreement = await db.executeQuery(databaseName, getQuery, { id }, useApi);
    
    if (!agreement || agreement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agreement not found'
      });
    }
    
    // TODO: Implement email sending logic here
    // For now, just update status
    const updateQuery = `
      UPDATE d_bp_agreement_docs 
      SET status = 'sent', sent_at = GETDATE()
      WHERE id = @id
    `;
    await db.executeQuery(databaseName, updateQuery, { id }, useApi);
    
    res.json({
      success: true,
      message: 'Email sent successfully (email service not implemented yet)'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = {
  getAgreementByGuid,
  signAgreement,
  getAllAgreements,
  getAgreementById,
  createAgreement,
  updateAgreement,
  deleteAgreement,
  sendAgreementEmail
};

