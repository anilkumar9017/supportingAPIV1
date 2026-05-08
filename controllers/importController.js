const db = require('../config/database');
const axios = require('axios');

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