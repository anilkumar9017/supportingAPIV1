const configService = require('../services/configService');

/**
 * Middleware to extract domain and resolve database name
 * For public routes: Gets domain from X-Domain header and fetches DB name from API
 * For authenticated routes: Gets database name from JWT token
 */
async function domainMiddleware(req, res, next) {
  try {
    let domain = null;
    let databaseName = null;
    const isPublicRoute = req.useApi !== false; // Public routes have req.useApi = true

    if (isPublicRoute) {
      // Public route: Get domain from header and fetch database name from API
      domain = req.headers['x-domain'] || req.headers.domain;
      
      if (!domain) {
        return res.status(400).json({
          success: false,
          message: 'X-Domain header is required'
        });
      }
      console.log("get domain", domain)
      // Fetch database name from config API
      try {
        databaseName = await configService.getDatabaseName(domain);
        if (!databaseName) {
          return res.status(400).json({
            success: false,
            message: 'Database name not found for the provided domain'
          });
        }
        console.log(`📡 [Public] Domain: ${domain} → Database: ${databaseName}`);
      } catch (error) {
        console.error('Error fetching database name from API:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch database configuration',
          error: error.message
        });
      }
    } else {
      // Authenticated route: Get database name from JWT token
      if (req.user && req.user.dbname) {
        databaseName = req.user.dbname;
        domain = req.user.dbname; // Domain same as database name for authenticated routes
        console.log(`🔐 [Auth] Database from token: ${databaseName}`);
      }
    }

    // Attach domain and database name to request object
    req.domain = domain;
    req.databaseName = databaseName;

    next();
  } catch (error) {
    console.error('Error in domain middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in domain middleware',
      error: error.message
    });
  }
}

module.exports = domainMiddleware;

