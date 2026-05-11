const mssql = require('mssql');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const configService = require('../services/configService');

// Connection pool cache
const connectionPools = {};

/**
 * Get database configuration
 * @param {string} dbConfigId - Database configuration ID
 * @param {boolean} useApi - If true, fetch database name from API (for public routes). If false, use .env directly (for authenticated routes)
 */
async function getDatabaseConfig(dbName = 'default', useApi = false) {
  // Base configuration from .env file
  //console.log("working ", process.env.DEFAULT_DB_USER)
  const baseConfig = {
    type: process.env.DEFAULT_DB_TYPE || 'mssql',
    host: process.env.DEFAULT_DB_HOST || 'localhost',
    port: parseInt(process.env.DEFAULT_DB_PORT) || 1433,
    database: dbName || 'your_database',
    user: process.env.DEFAULT_DB_USER || 'sa',
    password: process.env.DEFAULT_DB_PASSWORD || '',
    options: {
      encrypt: process.env.DEFAULT_DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DEFAULT_DB_TRUST_CERT === 'true'
    }
  };

  // For public routes, fetch database name from API
  /* if (useApi) {
    try {
      const databaseName = await configService.getDatabaseName(dbConfigId);
      if (databaseName) {
        baseConfig.database = databaseName;
        console.log(`📡 Fetched database name from API: ${databaseName}`);
      } else {
        console.warn('⚠️  API returned empty database name, using .env default');
      }
    } catch (error) {
      console.error('⚠️  Error fetching database name from API:', error.message);
      console.log('📝 Using database name from .env file as fallback');
      // Continue with .env database name
    }
  } */

  return baseConfig;
}

/**
 * Create MSSQL connection pool
 */
async function createMSSQLPool(config) {
  const poolKey = `${config.host}_${config.database}`;
  
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }

  const poolConfig = {
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options: {
      encrypt: config.options?.encrypt || false,
      trustServerCertificate: config.options?.trustServerCertificate || true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  const pool = new mssql.ConnectionPool(poolConfig);
  await pool.connect();
  connectionPools[poolKey] = pool;
  
  console.log(`✅ MSSQL connection pool created for ${config.database}`);
  return pool;
}

/**
 * Create MySQL connection pool
 */
async function createMySQLPool(config) {
  const poolKey = `${config.host}_${config.database}`;
  
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }

  const pool = mysql.createPool({
    host: config.host,
    port: config.port || 3306,
    database: config.database,
    user: config.user,
    password: config.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  connectionPools[poolKey] = pool;
  console.log(`✅ MySQL connection pool created for ${config.database}`);
  return pool;
}

/**
 * Create PostgreSQL connection pool
 */
async function createPostgresPool(config) {
  const poolKey = `${config.host}_${config.database}`;
  
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }

  const pool = new Pool({
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 10,
    idleTimeoutMillis: 30000
  });

  connectionPools[poolKey] = pool;
  console.log(`✅ PostgreSQL connection pool created for ${config.database}`);
  return pool;
}

/**
 * Get database connection pool
 * @param {string} dbConfigId - Database configuration ID
 * @param {boolean} useApi - If true, fetch database name from API (for public routes)
 */
async function getConnection(dbConfigId = 'default', useApi = false) {
  const config = await getDatabaseConfig(dbConfigId, useApi);
  const dbType = config.type.toLowerCase();
  //console.log("working  config", config);
  switch (dbType) {
    case 'mssql':
    case 'sqlserver':
      return await createMSSQLPool(config);
    
    case 'mysql':
    case 'mariadb':
      return await createMySQLPool(config);
    
    case 'postgres':
    case 'postgresql':
      return await createPostgresPool(config);
    
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

/**
 * Execute query (works with all database types)
 * @param {string} dbConfigId - Database configuration ID
 * @param {string} query - SQL query
 * @param {object} params - Query parameters
 * @param {boolean} useApi - If true, fetch database name from API (for public routes)
 */
async function executeQuery(dbName, query, params = {}, useApi = false) {
  //const config = await getDatabaseConfig(dbConfigId, useApi);
  const pool = await getConnection(dbName, useApi);
  const dbType = process.env.DEFAULT_DB_TYPE || 'mssql'; //config.type.toLowerCase();

  try {
    switch (dbType) {
      case 'mssql':
      case 'sqlserver': {
        const request = pool.request();
        //console.log("request ", request);
        // Add parameters
        Object.keys(params).forEach(key => {
          request.input(key, params[key]);
        });
        const result = await request.query(query);
        return result.recordset;
      }
      
      case 'mysql':
      case 'mariadb': {
        const [rows] = await pool.execute(query, Object.values(params));
        return rows;
      }
      
      case 'postgres':
      case 'postgresql': {
        const result = await pool.query(query, Object.values(params));
        return result.rows;
      }
      
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}


/* 
  here we will apply transection

*/
async function executeTransactionQuery(dbType='mssql', transaction, query, params = {}) {
    try {
        switch(dbType) {
          case 'mssql':
          case 'sqlserver':
            const request = new mssql.Request(transaction);
            //ADD PARAMETERS
            Object.keys(params).forEach(key => {
                request.input(
                    key,
                    params[key]
                );
            });
            const result = await request.query(query);
            return result.recordset;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
    }
    catch (error) {
        console.error('Transaction query error:', error);
        throw error;
    }
}

/* 
  * generate query based on database type
  * @param {string} dbType - Database Type
  * @param {string} tableName - Table name 
  * @param {Object} row - row it holds object with value
  * 
*/
function buildInsertQuery(dbType, tableName, row) {

  const columns = Object.keys(row);

  const columnNames = columns.join(',');

  let query = '';

  switch (dbType) {
      case 'mssql':
      case 'sqlserver':

          query = `
              INSERT INTO ${tableName}
              (${columnNames})
              VALUES (
                  ${columns.map(
                      col => `@${col}`
                  ).join(',')}
              )
          `;

          break;

      case 'mysql':
      case 'mariadb':

          query = `
              INSERT INTO ${tableName}
              (${columnNames})
              VALUES (
                  ${columns.map(
                      () => '?'
                  ).join(',')}
              )
          `;

          break;

      case 'postgres':
      case 'postgresql':

          query = `
              INSERT INTO ${tableName}
              (${columnNames})
              VALUES (
                  ${columns.map(
                      (_, i) => `$${i + 1}`
                  ).join(',')}
              )
          `;

          break;
  }

  return query;
}

/**
 * Close all connection pools
 */
async function closeAllConnections() {
  for (const [key, pool] of Object.entries(connectionPools)) {
    try {
      if (pool.close) {
        await pool.close();
      } else if (pool.end) {
        await pool.end();
      }
      console.log(`Closed connection pool: ${key}`);
    } catch (error) {
      console.error(`Error closing pool ${key}:`, error);
    }
  }
  Object.keys(connectionPools).forEach(key => delete connectionPools[key]);
}

module.exports = {
  createMSSQLPool,
  getConnection,
  executeQuery,
  getDatabaseConfig,
  closeAllConnections,
  buildInsertQuery,
  executeTransactionQuery
};

