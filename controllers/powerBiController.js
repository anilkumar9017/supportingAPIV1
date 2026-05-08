const db = require('../config/database');
const axios = require('axios');



/* 
    get powerBi details tenant, worksapace, secret, and others
*/
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

/* 
  first check token exist not exist then generate new token
*/
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

/*let cachedToken = null; let expiryTime = null;
 async function getAzureADToken(tenatObj) {
    try {
      if (cachedToken && expiryTime > Date.now()) {
        return cachedToken;
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

      cachedToken = response.data.access_token;
      expiryTime = Date.now() + 55 * 60 * 1000;
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Azure AD token:', error.response?.data || error.message);
      throw new Error(`Failed to obtain Azure AD token - ${error.response?.data?.error_description || error.message}`);
    }
} */


async function generateReportEmbedToken(req, res) {
    try {
        const useApi = req.useApi || false;
        const {report_id} = req.body;
        console.log("report_id ", report_id);
        // Get database name from middleware (already resolved)
        const databaseName = req.databaseName;
        if (!databaseName) {
            return res.status(400).json({
                success: false,
                message: 'Database name not resolved'
            });
        }

        const query = `select * from vw_bi_basic_configuration`;
        const result = await db.executeQuery(databaseName, query, {}, useApi);

        //console.log("get tenant ", result);
        if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Power BI configuration not found.'
            });
        }

        const workspaceId = result[0]?.POWERBI_WORKSPACE_ID;

        //
        //const azureToken = await getAzureADToken(result[0]);
        
        //console.log("azure token ", report_id, azureToken);
        // Generate embed token for the requested report 
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
              }
              }
          );
        }, result[0]);
        
        //get report datasetId for refresh token
        const reportResponse  = await powerBIRequest(async (token) => {
          return axios.get(
            `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${report_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        },  result[0]);
        //console.log("response ". response?.data);
        // Add embedUrl to the response
        response.data.embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${report_id}`;
        response.data.datasetId = reportResponse?.data?.datasetId;
        //response.data.tn = azureToken;
        console.log("generateEmbedToken ", response);
        return res.json({
            success: true,
            message: 'success',
            data: response.data,
        });
    } catch (error) {
      console.error('Error generating embed token:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
    });
    }
  }

  /* 
    1 azure token, workspaceId, datasetId
  */
 /* storeAzureToken(){
    
 } */


  /* 
    refresh embed report
  */
  async function refreshDataset(req, res){
    try {
      const useApi = req.useApi || false;
      const {datasetId, tn} = req.body;
      //console.log("datasetId ", datasetId);

      //get worspace id
      const databaseName = req.databaseName;
      const query = `select * from vw_bi_basic_configuration`;
      const result = await db.executeQuery(databaseName, query, {}, useApi);
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
        `https://api.powerbi.com/v1.0/myorg/groups/${config?.POWERBI_WORKSPACE_ID}/datasets/${datasetId}/refreshes`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      }, config);
     
      //console.log("generateEmbedToken ", response);
      return res.json({
          success: true,
          message: 'success',
          data: response.data,
      });
    } catch (error) {
      console.error('Error Refresh:', error.response?.data?.error?.message || error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.error?.message || error.message,
      });
    }
  }

  /* refresh Status */
  async function refreshStatus(req, res) {
    try {
      const useApi = req.useApi || false;
      const {datasetId, tn} = req.body;
  
      const databaseName = req.databaseName;
      const query = `select * from vw_bi_basic_configuration`;
      const result = await db.executeQuery(databaseName, query, {}, useApi);
      if(result?.length==0 || !result){
        return res.status(400).json({
            success: false,
            message: 'Power BI configuration not found.'
        });
      }
  
      const config = result[0];
  
      const response = await powerBIRequest(async (token) => {
        return axios.get(
          `https://api.powerbi.com/v1.0/myorg/groups/${config.POWERBI_WORKSPACE_ID}/datasets/${datasetId}/refreshes?$top=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }, config);
  
      return res.json({
        success: true,
        message: 'success',
        data: response.data
      });
  
    } catch (err) {
      res.status(500).json({ 
        success: false,
        message: err.message
       });
    }
  }

  // ========================
// Generate Dashboard Embed Token
// ========================
  async function generateDashboardEmbedToken(req,res) {
    try {
        const useApi = req.useApi || false;
        const {dashboard_id} = req.body;
        // Get database name from middleware (already resolved)
        const databaseName = req.databaseName;
        if (!databaseName) {
            return res.status(400).json({
                success: false,
                message: 'Database name not resolved'
            });
        }

        const query = `select * from vw_bi_basic_configuration`;
        const result = await db.executeQuery(databaseName, query, {}, useApi);

        console.log("get tenant ", result);
        if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Azure Id not come.'
            });
        }

        // Get Azure AD token
        const azureToken = await getAzureADToken(result[0]);
        console.log("azure token ", report_id, azureToken);
        
      // Get the dashboard details to extract embedUrl with cluster config
      const dashboardsResponse = await axios.get(
        `https://api.powerbi.com/v1.0/myorg/groups/${result[0]?.POWERBI_WORKSPACE_ID}/dashboards`,
        { headers: { Authorization: `Bearer ${azureToken}` } }
      );
      
      // Find the dashboard with matching ID
      const dashboard = dashboardsResponse.data.value.find(d => d.id === dashboard_id);
      const embedUrl = dashboard?.embedUrl || `https://app.powerbi.com/dashboardEmbed?dashboardId=${dashboard_id}`;
      
      // Generate the token
      const response = await axios.post(
        `https://api.powerbi.com/v1.0/myorg/groups/${result[0]?.POWERBI_WORKSPACE_ID}/dashboards/${dashboard_id}/GenerateToken`,
        { accessLevel: 'View' },
        {
          headers: {
            Authorization: `Bearer ${azureToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Return token response with the correct embedUrl
      response.data.embedUrl = embedUrl;
      return res.json({
        success: true,
        message: 'success',
        data: response.data,
    });
    } catch (error) {
      console.error('Error generating dashboard embed token:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  


module.exports = {
    generateReportEmbedToken,
    generateDashboardEmbedToken,
    refreshDataset,
    refreshStatus
}