const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// ============================================================
// UPLOAD FILE TO NG API
// ============================================================
const uploadFile = async ({ filePath, fileName, mimeType, docType, domain }) => {
  try {
    if (!filePath || !fileName || !mimeType || !docType) {
      throw new Error('filePath, fileName, mimeType, docType and domain are required');
    }


    console.log("========== UPLOADING TO NG API ==========");
    console.log("File :", fileName, filePath, mimeType, docType, domain);

    const formData = new FormData();

    formData.append("app_id", process.env.APPID);
    formData.append("app_key", process.env.APPKEY);
    formData.append("bucket_id", process.env.BUCKETID);
    formData.append("company_name", domain);
    formData.append("doc_type", docType);
    formData.append("flag", 1);

    formData.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: mimeType,
    });

    const response = await axios.post(
      "https://microservices.dcctz.com/api/uploadFile/NG",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization:
            "Bearer EAAWOFw8QuSgBOZB6IYFbdSTpTBWD9pXeI5DEZB8ZCs8Ivtg7Fopi9llcc5hddMgUx65IiLe7cZCJevlWMV7JVkTbwm8qG7FMDh3PMoiGabhuufRtgRV32gy0Ttw0XeZAJcBj48gEywbPrQ3K6wxL0ZBabBfsVhGBcqVTxGWHJ1UZBUXPkKoMiJ1QbIHnBAu0pL1",
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