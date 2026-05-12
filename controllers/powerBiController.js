const db = require('../config/database');
const axios = require('axios');

const poerBiService = require('../services/powerbi/powerbi.service')



/* 
  * Token caching mechanism to avoid redundant Azure AD token requests and handle token refresh on expiration or authentication errors.
  * Uses an in-memory Map to store tokens with their expiry times, keyed by tenant ID.
  * The powerBIRequest function wraps API calls to automatically handle token retrieval and refresh logic.
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
  * First check if a valid token exists in the cache; if not, generate a new one.
  * If an API call fails due to an authentication error, the token is automatically refreshed and the API call is retried with the new token. This ensures seamless authentication handling for Power BI API requests without requiring manual intervention for token management.
   * Overall, this mechanism optimizes performance by reducing unnecessary token requests and provides robustness by automatically handling token expiration and authentication errors, ensuring that API calls to Power BI are consistently authenticated with valid tokens.
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


/* 
  * Generate an embed token for a Power BI report
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to generate the embed token.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for generating the embed token, which includes automatic token management. The response from the Power BI API is augmented with the embed URL before being returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for generating embed tokens, it promotes code reusability and maintainability, allowing for consistent handling of Power BI API interactions across the application.
    * Overall, this function serves as a key part of the application's integration with Power BI, enabling secure and efficient generation of embed tokens for reports while managing authentication seamlessly through token caching and refresh logic.
*/
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

        // Query the database for Power BI configuration details
        const query = `select * from vw_bi_basic_configuration`;
        const result = await db.executeQuery(databaseName, query, {}, useApi);  // Pass useApi flag to control database name resolution in the query execution

        //console.log("get tenant ", result);
        if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Power BI configuration not found.'
            });
        }
        // Extract workspace ID from the configuration result
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
        //console.log("generateEmbedToken ", response);
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
    * Refresh a Power BI dataset
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to trigger a dataset refresh.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for refreshing the dataset, which includes automatic token management. The response from the Power BI API is returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for refreshing datasets, it promotes code reusability and maintainability, allowing for consistent handling of Power BI API interactions across the application.
    * Overall, this function serves as a key part of the application's integration with Power BI, enabling secure and efficient triggering of dataset refreshes while managing authentication seamlessly through token caching and refresh logic.
  */
  async function refreshDataset(req, res){
    try {
      const useApi = req.useApi || false;
      const {datasetId, tn} = req.body;
      //console.log("datasetId ", datasetId);

      //get worspace id
      const databaseName = req.databaseName;  // Get database name from middleware (already resolved)
      const query = `select * from vw_bi_basic_configuration`;  // Ensure this view returns the necessary Power BI configuration details, including the workspace ID
      const result = await db.executeQuery(databaseName, query, {}, useApi);  // Pass useApi flag to control database name resolution in the query execution
      //when no configuration return error
      if(result?.length==0 || !result){
        return res.status(400).json({
            success: false,
            message: 'Power BI configuration not found.'
        });
      }

      const config = result[0]; // Extract workspace ID from the configuration result

      // Trigger dataset refresh using the Power BI API with automatic token management
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

  /* 
    * Check the status of the last dataset refresh
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to get the status of the most recent dataset refresh.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for checking the refresh status, which includes automatic token management. The response from the Power BI API is returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for checking refresh status, it promotes code reusability and maintainability, allowing for consistent handling of Power BI API interactions across the application.
    * Overall, this function serves as a key part of the application's integration with Power BI, enabling secure and efficient retrieval of dataset refresh status while managing authentication seamlessly through token caching and refresh logic.
  */
  async function refreshStatus(req, res) {
    try {
      const useApi = req.useApi || false;
      const {datasetId, tn} = req.body;
  
      const databaseName = req.databaseName;  // Get database name from middleware (already resolved)
      const query = `select * from vw_bi_basic_configuration`;  // Ensure this view returns the necessary Power BI configuration details, including the workspace ID
      const result = await db.executeQuery(databaseName, query, {}, useApi);  // Pass useApi flag to control database name resolution in the query execution
      //when no configuration return error
      if(result?.length==0 || !result){
        return res.status(400).json({
            success: false,
            message: 'Power BI configuration not found.'
        });
      }
  
      const config = result[0]; // Extract workspace ID from the configuration result
  
      // Call Power BI API to get the status of the most recent dataset refresh with automatic token management
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

/* 
    * Generate an embed token for a Power BI dashboard
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to generate the embed token.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for generating the embed token, which includes automatic token management. The response from the Power BI API is augmented with the embed URL before being returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for generating embed tokens, it promotes code reusability and maintainability, allowing for consistent handling of Power BI API interactions across the application.
    * Overall, this function serves as a key part of the application's integration with Power BI, enabling secure and efficient generation of embed tokens for dashboards while managing authentication seamlessly through token caching and refresh logic.
 */
  async function generateDashboardEmbedToken(req,res) {
    try {
        const useApi = req.useApi || false;
        const {dashboard_id} = req.body;
        // Get database name from middleware (already resolved)
        const databaseName = req.databaseName;  // Ensure this view returns the necessary Power BI configuration details, including the workspace ID
        if (!databaseName) {
            return res.status(400).json({
                success: false,
                message: 'Database name not resolved'
            });
        }

        const query = `select * from vw_bi_basic_configuration`;  // Ensure this view returns the necessary Power BI configuration details, including the workspace ID
        const result = await db.executeQuery(databaseName, query, {}, useApi);  // Pass useApi flag to control database name resolution in the query execution

        console.log("get tenant ", result);
        //when no configuration return error
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
  

  /* 
    other databse with custom token and dataset refresh, status check - for more control from client side, currently not in use, can be used for future extension if needed, for example when we want to trigger dataset refresh from other system with custom token and just want to use the API without database call for configuration
     * Generate an embed token for a Power BI report
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to generate the embed token.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for generating the embed token, which includes automatic token management. The response from the Power BI API is augmented with the embed URL before being returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing
  */
  async function generateReportToken(req, res){
    try {
      const result = await poerBiService.generateReportEmbedToken(req, res);
      return res.status(200).json({
          success: true,
          message: 'Success',
          data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || error,
        error: error,
    });
    }
  }

  /* 
    custom dataset refresh and status check with token from client, currently not in use, can be used for future extension if needed, for example when we want to trigger dataset refresh from other system with custom token and just want to use the API without database call for configuration
     * Refresh a Power BI dataset
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to trigger a dataset refresh.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for refreshing the dataset, which includes automatic token management. The response from the Power BI API is returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for refreshing datasets, it promotes code reusability and maintainability, allowing for consistent handling of Power BI API interactions across the application
  */
  async function refreshDatasetCustom(req, res){
    try {
      const result = await poerBiService.refreshDataset(req, res);
      return res.status(200).json({
          success: true,
          message: 'Success',
          data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || error
    });
    }
  }

  /* 
    custom dataset refresh status check with token from client, currently not in use, can be used for future extension if needed, for example when we want to trigger dataset refresh from other system with custom token and just want to use the API without database call for configuration
     * Check the status of the last dataset refresh
    * Retrieves necessary configuration from the database, obtains an Azure AD token, and calls the Power BI API to get the status of the most recent dataset refresh.
    * The function first checks if the database name is resolved from the middleware. It then queries the database for Power BI configuration details, including the workspace ID. If the configuration is found, it uses the `powerBIRequest` function to handle the API call for checking the refresh status, which includes automatic token management. The response from the Power BI API is returned to the client. If any errors occur during this process, they are caught and an appropriate error message is returned in the response.
    * The function also includes error handling to manage scenarios where the database configuration is missing or when API calls fail, ensuring that the client receives informative responses in case of issues. By centralizing the logic for checking refresh status, it promotes code reusability and maintainability, allowing for
  */
  async function refreshStatusCustom(req, res){
    try {
      const result = await poerBiService.refreshStatus(req, res);
      return res.status(200).json({
          success: true,
          message: 'Success',
          data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || error
    });
    }
  }

module.exports = {
    generateReportEmbedToken,
    generateDashboardEmbedToken,
    refreshDataset,
    refreshStatus,

    generateReportToken,
    refreshDatasetCustom,
    refreshStatusCustom
}