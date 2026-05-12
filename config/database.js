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
 * @param {object} config - Database configuration
 * @return {object} MSSQL connection pool
 * This function creates a connection pool for MSSQL databases using the provided configuration. It checks if a pool already exists for the given database and returns it if available. If not, it creates a new connection pool with the specified configuration, connects to the database, and caches the pool for future use. This approach optimizes database connections by reusing existing pools and ensures efficient resource management when handling multiple requests that require database access.
 * The pool configuration includes settings for server, port, database, user credentials, and connection options such as encryption and trust settings. The function also includes error handling to catch and log any issues that may arise during the connection process, ensuring that the application can gracefully handle database connection errors without crashing.
 * By centralizing the database connection logic in this function, it promotes code reusability and maintainability, allowing other parts of the application to easily obtain a database connection pool without needing to manage the connection details directly. This is especially beneficial in scenarios where multiple database types are supported, as it abstracts away the specific connection logic for each database type and provides a consistent interface for obtaining connections.
 * Overall, this function is a critical component of the application's database management strategy, enabling efficient and reliable database connectivity while also providing flexibility to support different database types and configurations as needed.
 */
async function createMSSQLPool(config) {
  // Create a unique key for the connection pool based on host and database name
  const poolKey = `${config.host}_${config.database}`;
  // Check if a connection pool already exists for this database configuration
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }
  // Create a new connection pool with the provided configuration
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
  // Connect to the database and cache the connection pool for future use
  const pool = new mssql.ConnectionPool(poolConfig);
  await pool.connect();
  connectionPools[poolKey] = pool;
  
  console.log(`✅ MSSQL connection pool created for ${config.database}`);
  return pool;
}

/**
 * Create MySQL connection pool
 * @param {object} config - Database configuration
 * This function creates a connection pool for MySQL databases using the provided configuration. Similar to the MSSQL pool creation function, it checks if a pool already exists for the given database and returns it if available. If not, it creates a new connection pool with the specified configuration, which includes settings for host, port, database, user credentials, and connection limits. The function also includes error handling to catch and log any issues that may arise during the connection process, ensuring that the application can gracefully handle database connection errors without crashing. By centralizing the database connection logic in this function, it promotes code reusability and maintainability, allowing other parts of the application to easily obtain a database connection pool without needing to manage the connection details directly.
 * Overall, this function is a critical component of the application's database management strategy, enabling efficient and reliable database connectivity while also providing flexibility to support different database types and configurations as needed.
 */
async function createMySQLPool(config) {
  // Create a unique key for the connection pool based on host and database name
  const poolKey = `${config.host}_${config.database}`;
  // Check if a connection pool already exists for this database configuration
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }

  // Create a new connection pool with the provided configuration
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
 * @param {object} config - Database configuration
 * This function creates a connection pool for PostgreSQL databases using the provided configuration. It checks if a pool already exists for the given database and returns it if available. If not, it creates a new connection pool with the specified configuration, which includes settings for host, port, database, user credentials, and connection limits. The function also includes error handling to catch and log any issues that may arise during the connection process, ensuring that the application can gracefully handle database connection errors without crashing. By centralizing the database connection logic in this function, it promotes code reusability and maintainability, allowing other parts of the application to easily obtain a database connection pool without needing to manage the connection details directly. Overall, this function is a critical component of the application's database management strategy, enabling efficient and reliable database connectivity while also providing flexibility to support different database types and configurations as needed.
 */
async function createPostgresPool(config) {
  // Create a unique key for the connection pool based on host and database name
  const poolKey = `${config.host}_${config.database}`;
  // Check if a connection pool already exists for this database configuration
  if (connectionPools[poolKey]) {
    return connectionPools[poolKey];
  }
  // Create a new connection pool with the provided configuration
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
 * This function retrieves a database connection pool based on the provided database configuration ID and whether to fetch the database name from an API. It first obtains the database configuration using the `getDatabaseConfig` function, which can fetch the database name from an API if needed. Then, it determines the type of database (MSSQL, MySQL, or PostgreSQL) and calls the corresponding pool creation function to either retrieve an existing connection pool or create a new one if it doesn't already exist. This function abstracts away the details of managing different database types and provides a consistent interface for obtaining a connection pool, which can be used by other parts of the application to execute queries without needing to worry about the underlying database connection logic.
 * Overall, this function is a key part of the application's database management strategy, enabling efficient and reliable access to database connections while also providing flexibility to support different database types and configurations as needed.
 */
async function getConnection(dbConfigId = 'default', useApi = false) {
  // Get database configuration based on the provided ID and whether to use API for fetching database name
  const config = await getDatabaseConfig(dbConfigId, useApi);
  // Determine database type and get or create the corresponding connection pool
  const dbType = config.type.toLowerCase();

  //console.log("working  config", config);
  
  // Return the appropriate connection pool based on the database type
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
 * This function iterates through all the connection pools stored in the `connectionPools` cache and attempts to close each one. It checks if the pool has a `close` method (for MSSQL) or an `end` method (for MySQL and PostgreSQL) and calls it accordingly. The function includes error handling to catch and log any issues that may arise during the closing of the connection pools, ensuring that any errors are properly managed without crashing the application. After attempting to close all pools, it clears the `connectionPools` cache to free up memory and ensure that new connections can be established cleanly in the future. This function is essential for proper resource management, especially when the application is shutting down or when there is a need to reset database connections.
 * Overall, this function is a key part of the application's database management strategy, enabling efficient cleanup of database connections and ensuring that resources are properly released when they are no longer needed. By centralizing the logic for closing connection pools, it promotes code reusability and maintainability, allowing for consistent handling of database connections across different parts of the application.
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

