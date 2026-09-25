const db = require('../../config/database');
const fs = require('fs');
const os = require('os');
const path = require('path');
const uploadFile = require('../../tools/backplace');

function getUploadedFileUrl(uploadResponse) {
  const urlKeys = new Set([
    'public_url',
    'publicUrl',
    'file_url',
    'fileUrl',
    'download_url',
    'downloadUrl',
    'url'
  ]);

  function findUrl(value) {
    if (!value || typeof value !== 'object') {
      return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      if (urlKeys.has(key) && typeof nestedValue === 'string' && nestedValue.trim()) {
        return nestedValue;
      }

      const nestedUrl = findUrl(nestedValue);
      if (nestedUrl) {
        return nestedUrl;
      }
    }

    return null;
  }

  return findUrl(uploadResponse);
}

/**
 * Get quotation by temporary GUID (public access)
 */
async function getQuotationByGuid(req, res) {
  try {
    const { temp_guid } = req.params;
    const useApi = req.useApi || false;
    const databaseName = req.databaseName;

    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }

    const quotationResult = await db.executeQuery(
      databaseName,
      'SELECT * FROM sales_d_quotation_header WHERE temp_guid = @temp_guid',
      { temp_guid },
      useApi
    );

    if (!quotationResult || quotationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const quotation = quotationResult[0];

    if (quotation.incoterm) {
      const incotermResult = await db.executeQuery(
        databaseName,
        'SELECT * FROM m_incoterms WHERE id = @incoterm',
        { incoterm: quotation.incoterm },
        useApi
      );

      if (incotermResult && incotermResult.length > 0) {
        quotation.incoterm = incotermResult[0].name;
      }
    }

    if (quotation.payment_term) {
      const paymentTermResult = await db.executeQuery(
        databaseName,
        'SELECT * FROM m_payment_terms WHERE id = @payment_term',
        { payment_term: quotation.payment_term },
        useApi
      );

      if (paymentTermResult && paymentTermResult.length > 0) {
        quotation.payment_term = paymentTermResult[0].terms_name;
      }
    }

    if (quotation.salesperson_id) {
      const salespersonResult = await db.executeQuery(
        databaseName,
        'SELECT * FROM m_sales_employee WHERE id = @salesperson_id',
        { salesperson_id: quotation.salesperson_id },
        useApi
      );

      const userResult = await db.executeQuery(
        databaseName,
        'SELECT * FROM m_user_master WHERE id = @emp_id',
        { emp_id: salespersonResult[0].emp_id },
        useApi
      );

      if (userResult && userResult.length > 0) {
        quotation.email = userResult[0].email;
      }else if(salespersonResult && salespersonResult.length > 0) {
        quotation.email = salespersonResult[0].e_mail;
      }

      if (salespersonResult && salespersonResult.length > 0) {
        quotation.salesperson = salespersonResult[0].name;
      }
    }


    const lineResult = await db.executeQuery(
      databaseName,
      'SELECT * FROM sales_d_quotation_line WHERE parent_id = @parent_id',
      { parent_id: quotation.id },
      useApi
    );

    if(lineResult && lineResult.length > 0) {
      for (const line of lineResult) {
          if(line.expense_id){
            const expense = line.expense_module == 'C' ? 'm_file_expense_type': 'm_trip_expenses';
            const expenseResult = await db.executeQuery(
              databaseName,
              `SELECT * FROM ${expense} WHERE id = @expense_id`,
              { expense_id: line.expense_id },
              useApi
            );
            const columnKey = line.expense_module == 'C' ? 'name': 'expense_name';
            if (expenseResult && expenseResult.length > 0) {
              line.expense_id = expenseResult[0][columnKey];
            }
          }
          if (line.uom) {
            const uomResult = await db.executeQuery(
              databaseName,
              'SELECT * FROM m_uom WHERE id = @uom',
              { uom: line.uom },
              useApi
            );

            if (uomResult && uomResult.length > 0) {
              line.uom = uomResult[0].name;
            }
          }
      }
    }

    quotation.sales_d_quotation_line = lineResult || [];

    if (quotation.template_id) {
      const templateResult = await db.executeQuery(
        databaseName,
        'SELECT * FROM sales_m_quote_template WHERE id = @template_id',
        { template_id: quotation.template_id },
        useApi
      );

      quotation.templateData = templateResult?.[0] || {};
    }

    return res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Accept or reject quotation (public access)
 */
async function signQuotation(req, res) {
  let signatureFilePath;

  try {
    const { temp_guid } = req.params;
    const {
      quote_status,
      signature_url,
      signature_name,
      signature_jobtitle,
      remarks
    } = req.body;
    const useApi = req.useApi || false;
    const databaseName = req.databaseName;

    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }

    if (!['W', 'C'].includes(quote_status)) {
      return res.status(400).json({
        success: false,
        message: 'quote_status must be W (accepted) or C (rejected)'
      });
    }

    const quotationResult = await db.executeQuery(
      databaseName,
      'SELECT * FROM sales_d_quotation_header WHERE temp_guid = @temp_guid',
      { temp_guid },
      useApi
    );

    if (!quotationResult || quotationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const quotation = quotationResult[0];

    if (quote_status === 'W') {
      if (!signature_name || !signature_jobtitle) {
        return res.status(400).json({
          success: false,
          message: 'signature_name and signature_jobtitle are required when accepting a quotation'
        });
      }

      const onlineSignatureEnabled = [true, 1, '1', 'true', 'Y', 'y'].includes(
        quotation.online_signature
      );

      if (onlineSignatureEnabled) {
        if (!signature_url) {
          return res.status(400).json({
            success: false,
            message: 'signature_url is required when online_signature is enabled'
          });
        }

        const signatureMatch = signature_url.match(/^data:([^;]+);base64,(.+)$/s);
        if (!signatureMatch) {
          return res.status(400).json({
            success: false,
            message: 'signature_url must be a valid base64 data URL'
          });
        }

        const mimeType = signatureMatch?.[1] || 'image/png';
        const base64Data = signatureMatch?.[2] || signature_url;
        const extension = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
        signatureFilePath = path.join(os.tmpdir(), `${temp_guid}-${Date.now()}.${extension}`);
        fs.writeFileSync(signatureFilePath, Buffer.from(base64Data, 'base64'));

        const uploadRes = await uploadFile({
          filePath: signatureFilePath,
          fileName: `${temp_guid}-signature.${extension}`,
          mimeType,
          docType: 'quotation-signature',
          domain: req.domain,
          databaseName,
          useApi
        });
        const uploadedSignatureUrl = getUploadedFileUrl(uploadRes);

        if (!uploadedSignatureUrl) {
          // console.error('Signature upload response did not contain a public URL:', uploadRes);
          return res.status(502).json({
            success: false,
            message: 'Signature upload failed'
          });
        }

        req.uploadedSignatureUrl = uploadedSignatureUrl;
      }
    } else if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'remarks are required when rejecting a quotation'
      });
    }

    const updateQuery = `
      UPDATE sales_d_quotation_header
      SET
        quote_status = @quote_status,
        signature_url = @signature_url,
        signature_name = @signature_name,
        signature_jobtitle = @signature_jobtitle,
        remarks = @remarks,
        updatedate = GETDATE()
      WHERE temp_guid = @temp_guid
    `;

    const updatedSignatureUrl = req.uploadedSignatureUrl || quotation.signature_url || null;

    await db.executeQuery(databaseName, updateQuery, {
      temp_guid,
      quote_status,
      signature_url: updatedSignatureUrl,
      signature_name: quote_status === 'W' ? signature_name : quotation.signature_name,
      signature_jobtitle: quote_status === 'W' ? signature_jobtitle : quotation.signature_jobtitle,
      remarks: quote_status === 'C' ? remarks : quotation.remarks
    }, useApi);

    return res.json({
      success: true,
      message: quote_status === 'W'
        ? 'Quotation accepted successfully'
        : 'Quotation rejected successfully'
    });
  } catch (error) {
    console.error('Error signing quotation:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    if (signatureFilePath && fs.existsSync(signatureFilePath)) {
      fs.unlinkSync(signatureFilePath);
    }
  }
}

module.exports = {
  getQuotationByGuid,
  signQuotation
};