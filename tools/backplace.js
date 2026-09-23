const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const db = require("../config/database");

const getCdnParams = async (databaseName, useApi) => {
  if (!databaseName) {
    throw new Error("Database name is required to load CDN configuration");
  }

  const result = await db.executeQuery(
    databaseName,
    "SELECT cdn_params FROM cfg_basic_config WHERE id = @id",
    { id: 1 },
    useApi
  );
  const cdnParams = result?.[0]?.cdn_params;

  if (!cdnParams) {
    throw new Error("cdn_params was not found in cfg_basic_config");
  }

  let config;
  try {
    config = typeof cdnParams === "string" ? JSON.parse(cdnParams) : cdnParams;
  } catch (error) {
    throw new Error(`Invalid cdn_params JSON: ${error.message}`);
  }

  const params = Array.isArray(config) ? config : config?.data;
  if (!Array.isArray(params)) {
    throw new Error("cdn_params must contain an array of CDN settings");
  }

  const values = Object.fromEntries(
    params
      .filter(item => item?.key && item.value != null)
      .map(item => [item.key, item.value])
  );

  if (!values.url || !values.bearerToken || !values.app_id || !values.app_key || !values.bucket_id) {
    throw new Error("cdn_params is missing one or more required CDN settings");
  }

  return values;
};

// ============================================================
// UPLOAD FILE TO NG API
// ============================================================
const uploadFile = async ({ filePath, fileName, mimeType, docType, domain, databaseName, useApi }) => {
  try {
    if (!filePath || !fileName || !mimeType || !docType) {
      throw new Error('filePath, fileName, mimeType, docType and domain are required');
    }


    const cdnParams = await getCdnParams(databaseName, useApi);

    console.log("========== UPLOADING TO NG API ==========");
    console.log("File :", fileName, filePath, mimeType, docType, domain, cdnParams.url);

    const formData = new FormData();

    formData.append("app_id", cdnParams.app_id);
    formData.append("app_key", cdnParams.app_key);
    formData.append("bucket_id", cdnParams.bucket_id);
    formData.append("company_name", domain);
    formData.append("doc_type", docType);
    formData.append("flag", 1);

    formData.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: mimeType,
    });

    const response = await axios.post(
      cdnParams.url,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${cdnParams.bearerToken}`,
        },
        timeout: 120000,
      },
    );

    return response.data;
  } catch (error) {
    console.error('Backplace upload failed:', error.response?.data || error.message);
    return null;
  }
};

// ============================================================
// EXPORT
// ============================================================
module.exports = uploadFile;