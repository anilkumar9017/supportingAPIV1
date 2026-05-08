const axios = require('axios');

/**
 * Fetch database name from external API (only for public routes)
 * API should return only the database name
 */
async function getDatabaseName(dbConfigId = 'default') {
  const configApiUrl = process.env.DB_CONFIG_API_URL;
  console.log("configApiUrl ", `${configApiUrl}?subdomain=${dbConfigId}`);
  if (!configApiUrl) {
    throw new Error('DB_CONFIG_API_URL not configured');
  }

  try {
    const response = await axios.get(`${configApiUrl}?subdomain=${dbConfigId}`, {
      timeout: 5000
    });
    //console.log("response ", response);
    // Handle different response formats
    if(response?.data?.SubDomain === dbConfigId) {
      return response?.data?.DBName;
    }

    throw new Error('Invalid response from config API: ' + response?.SubDomain);
  }catch(error) {
    throw new Error('Error fetching database name from config API: ' + error?.message);
  }
}

/**
 * Cache database names (optional - can be implemented for performance)
 */
const databaseNameCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedDatabaseName(dbConfigId = 'default') {
  const cacheKey = dbConfigId;
  const cached = databaseNameCache[cacheKey];

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.databaseName;
  }

  const databaseName = await getDatabaseName(dbConfigId);
  databaseNameCache[cacheKey] = {
    databaseName,
    timestamp: Date.now()
  };

  return databaseName;
}

/**
 * Clear database name cache
 */
function clearDatabaseNameCache(dbConfigId = null) {
  if (dbConfigId) {
    delete databaseNameCache[dbConfigId];
  } else {
    Object.keys(databaseNameCache).forEach(key => delete databaseNameCache[key]);
  }
}

module.exports = {
  getDatabaseName,
  getCachedDatabaseName,
  clearDatabaseNameCache
};

