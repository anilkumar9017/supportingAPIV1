const db = require('../config/database');

/**
 * Get is there already approval exist or not for any user or all
 * check user already exist or not with action name
 * check action name already exist or not action name without user
 */
const BLOCKED_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'RENAME', 'EXECUTE', 'MERGE', 'CALL', 'GRANT', 'REVOKE'];

async function validateQuery(req, res) {
  try {
    const { queryText } = req.body;
    console.log(" req.query ", req.body);
    const useApi = req.useApi || false;
    /* check query text is required */
    if (!queryText) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }
    
    
    
    const query = queryText.trim();
    const upperQuery = query.toUpperCase();
    const foundKeyword = BLOCKED_KEYWORDS.find(keyword =>
      upperQuery.includes(keyword)
    );

    /* check query is valid sql query */
    if (foundKeyword) {
      return res.status(403).json({
        success: false,
        message: `Query abandoned due to forbidden keyword: ${foundKeyword}`
      });
    }

    const result = await db.executeQuery(databaseName, query, {}, useApi);

    return res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching user query:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = {
    validateQuery,
};

