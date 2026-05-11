const db = require('../../config/database');
const axios = require('axios');

const workspaceId = "9401bf6e-960c-4624-b63a-4e710f2d2011"; //"f7f27648-38db-4365-b91c-2ba3552f6bb4";

const tokenCache = new Map();
async function getAzureADToken(tenatObj) {
  const key = tenatObj.AZURE_TENANT_ID;

  const cached = tokenCache.get(key);

  if (cached && cached.expiry > Date.now()) {
    return cached.token;
  }

  const response = await axios.post(
    `https://login.microsoftonline.com/${tenatObj.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: tenatObj.AZURE_CLIENT_ID,
      client_secret: tenatObj.AZURE_CLIENT_SECRET,
      scope: 'https://analysis.windows.net/powerbi/api/.default'
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  const token = response?.data?.access_token;

  tokenCache.set(key, {
    token,
    expiry: Date.now() + 55 * 60 * 1000
  });

  return token;
}

async function powerBIRequest(fn, tenantObj) {
    try {
      const token = await getAzureADToken(tenantObj);
      return await fn(token);
    } catch (err) {
      const isAuthError =
        err.response?.status === 401 ||
        err.response?.data?.error?.code === "InvalidAuthenticationToken";
  
      if (isAuthError) {
        // force refresh token
        tokenCache.delete(tenantObj.AZURE_TENANT_ID);
  
        const newToken = await getAzureADToken(tenantObj);
        return await fn(newToken);
      }
  
      throw err;
    }
  }

/* 
    it is suing as without token
*/
async function generateReportEmbedToken(req, res) {
    try {
      const { report_id } = req.body;
      if (!report_id) {
        return res.status(400).json({ success: false, message: "report_id is required" });
      }
  
      console.log("Report ID:", report_id);
  
      const databaseName = 'DCCBusinessSuite_mowara_test';
      const query = `SELECT * FROM vw_bi_basic_configuration`;
      const result = await db.executeQuery(databaseName, query, {}, false);
  
      if (!result || !result[0]) {
        return res.status(404).json({ success: false, message: "Tenant configuration not found" });
      }
  
      const tenantObj = result[0];
  
      // Generate embed token
      const response = await powerBIRequest(async (token) => {
        return axios.post(
          `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${report_id}/GenerateToken`,
          {
            accessLevel: 'View',
            allowSaveAs: false
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15s timeout to prevent hanging
          }
        );
      }, tenantObj);
  
      // Get report datasetId
      const reportResponse = await powerBIRequest(async (token) => {
        return axios.get(
          `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${report_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            timeout: 15000
          }
        );
      }, tenantObj);
  
      // Add embedUrl and datasetId safely
      const responseData = response.data || {};
      responseData.embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${report_id}`;
      responseData.datasetId = reportResponse?.data?.datasetId;
  
      console.log("Generate Embed Token Response:", {
        embedUrl: responseData.embedUrl,
        datasetId: responseData.datasetId
      });
  
      return responseData;
  
    } catch (error) {
      // Log only safe properties to avoid circular JSON errors
      console.error('Error generating embed token:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
  
      if (!res.headersSent) {
        return {
            success: false,
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        }
      }
    }
  }

  /* 
    refresh embed report
  */
    async function refreshDataset(req, res){
        try {
          const {datasetId, tn} = req.body;
          //console.log("datasetId ", datasetId);
    
          //get worspace id
          const databaseName = 'DCCBusinessSuite_mowara_test';
          const query = `select * from vw_bi_basic_configuration`;
          const result = await db.executeQuery(databaseName, query, {}, false);
          if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Power BI configuration not found.'
            });
          }
          const config = result[0];
          //refresh dataset
          let response  = await powerBIRequest(async (token) => {
           return axios.post(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          }, config);
         
          //console.log("generateEmbedToken ", response);
          return response.data;
        } catch (error) {
          console.error('Error Refresh:', error.response?.data?.error?.message || error.response?.data || error.message);
          return error.response?.data?.error?.message || error.message;
        }
      }
    
      /* refresh Status */
      async function refreshStatus(req, res) {
        try {
          const {datasetId, tn} = req.body;
      
          const databaseName = 'DCCBusinessSuite_mowara_test';
          const query = `select * from vw_bi_basic_configuration`;
          const result = await db.executeQuery(databaseName, query, {}, false);
          if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Power BI configuration not found.'
            });
          }
      
          const config = result[0];
      
          const response = await powerBIRequest(async (token) => {
            return axios.get(
              `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/datasets/${datasetId}/refreshes?$top=1`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
          }, config);
      
          return response.data;
      
        } catch (err) {
          return err.message;
        }
      }


module.exports = {
    generateReportEmbedToken,
    refreshStatus,
    refreshDataset,
}