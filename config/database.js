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
    password: process.env.DEFAULT_DB_PASSWORD || 'SQL@2020',
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
      max: 20,
      min: 0,
      idleTimeoutMillis: 30000
    },
    connectionTimeout: parseInt(process.env.DEFAULT_DB_CONNECTION_TIMEOUT_MS, 10) || 60000,
    requestTimeout: parseInt(process.env.DEFAULT_DB_REQUEST_TIMEOUT_MS, 10) || 900000
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
        request.timeout = parseInt(process.env.DEFAULT_DB_REQUEST_TIMEOUT_MS, 10) || 900000;
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
  * Execute query within a transaction (works with all database types)
  * @param {string} dbType - Database Typee.g. 'mssql', 'mysql', 'postgres'
  * @param {object} transaction - Database transaction object
  * @param {string} query - SQL query
  * @param {object} params - Query parameters
  * This function executes a SQL query within the context of a database transaction, supporting multiple database types (MSSQL, MySQL, PostgreSQL). It takes the database type, transaction object, SQL query, and query parameters as input. The function uses the appropriate database client to execute the query based on the specified database type. For MSSQL, it creates a new request from the transaction and adds input parameters before executing the query. For MySQL and PostgreSQL, it executes the query using the transaction's connection and passes the parameters accordingly. The function includes error handling to catch and log any issues that may arise during query execution, ensuring that errors are properly managed within the transaction context. By centralizing transaction query execution in this function, it promotes code reusability and maintainability when working with transactions across different database types.
*/
async function executeTransactionQuery(dbType='mssql', transaction, query, params = {}) {
    try {
        // Execute the query based on the database type
        switch(dbType) {
          case 'mssql':
          case 'sqlserver':
            // For MSSQL, create a new request from the transaction and add input parameters
            const request = new mssql.Request(transaction);
            // Increase per-request timeout when importing large Excel payloads
            request.timeout = parseInt(process.env.DEFAULT_DB_REQUEST_TIMEOUT_MS, 10) || 900000;
            //ADD PARAMETERS
            Object.keys(params).forEach(key => {
                request.input(
                    key,
                    params[key]
                );
            });
            
            const result = await request.query(query);  // Execute the query and return the recordset
            return result.recordset;  // Return the result set from the query execution
          case 'mysql':
          case 'mariadb':
            // For MySQL, execute the query using the transaction's connection and pass parameters as an array  
            const [rows] = await transaction.connection.execute(query, Object.values(params));
            return rows;  // Return the rows affected by the query execution
          case 'postgres':
          case 'postgresql':
            // For PostgreSQL, execute the query using the transaction's connection and pass parameters as an array
            const pgResult = await transaction.connection.query(query, Object.values(params));
            return pgResult.rows;  // Return the rows affected by the query execution
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
  // Get column names from the row object
  const columns = Object.keys(row);
  // Build the column names part of the query
  const columnNames = columns.join(',');
  // Initialize query variable
  let query = '';

  // Build the query based on the database type
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
  executeTransactionQuery,
  getDatabaseConfig,
  closeAllConnections,
  buildInsertQuery
};

