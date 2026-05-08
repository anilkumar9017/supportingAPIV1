const db = require('../config/database');
const axios = require('axios');

async function getAllDataBaseName(){
    try {
        const response = await axios.get(`https://logsuitedomainverify.dcctz.com/api/get-databases?access_token=${process.env.DEFAULT_DB_TOKEN}`, 
        {
            headers:{
                'Content-Type': 'application/json'
            }
        });
        //console.log("response database name ", response);
        const result = [];
        for(let val of response?.data?.data){
            if(val?.DBName){
                result.push({
                    name: val?.DBName, //database title name
                    config: {
                        type: process.env.DEFAULT_DB_TYPE || 'mssql',
                        host: process.env.DEFAULT_DB_HOST || 'localhost',
                        port: parseInt(process.env.DEFAULT_DB_PORT) || 1433,
                        database: val?.DBName,
                        user: process.env.DEFAULT_DB_USER,
                        password: process.env.DEFAULT_DB_PASSWORD,
                        options: {
                          encrypt: process.env.DEFAULT_DB_ENCRYPT === 'true',
                          trustServerCertificate: process.env.DEFAULT_DB_TRUST_CERT === 'true'
                        }
                    }
                })
            }
        }
        return result;
    }catch(error) {
    throw new Error('Error fetching database name from config API: ' + error?.message);
    }
}

/**
 * Get Filed formatting records from mowara test db
 * add those records which is not exist in other db
 * it will only add new records nothing else will fire
 */
async function fieldFormateSync(req, res) {
  try {
    const useApi = req.useApi || false;
    const databaseName = req.databaseName;

    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }

    // 1️ Get all records from source DB
    const query = `SELECT * FROM m_field_formatting`;
    const result = await db.executeQuery(databaseName, query, {}, useApi);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found',
      });
    }

    const dbList =  await getAllDataBaseName();
    //console.log("db list ", dbList);
    if (!dbList || dbList.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No DB found',
        });
    }

    // 2️ Prepare bulk values string
    const escape = (val) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      return val;
    };

    const formatDate = (date) => {
      return date.toISOString().replace('T', ' ').replace('Z', '');
    };

    const values = result.map(r => `
                  (
                    ${escape(r.form_type)},
                    ${escape(r.column_id)},        
                    ${escape(r.column_name)},
                    ${escape(r.column_type)},
                    ${escape(r.column_subtype)},
                    ${escape(r.is_required)},      
                    ${r.createdate ? `'${formatDate(r.createdate)}'` : 'NULL'},
                    ${r.updatedate ? `'${formatDate(r.updatedate)}'` : 'NULL'},
                    ${Number(r.createdby) || 'NULL'},
                    ${Number(r.updatedby) || 'NULL'},
                    ${Number(r.log_inst) || 1},
                    ${r.ValidFrom ? `'${formatDate(r.ValidFrom)}'` : 'NULL'},
                    ${r.ValidTo ? `'${formatDate(r.ValidTo)}'` : 'NULL'}
                  )
                  `).join(',');
    //console.log("values ", values);

    // 3 Track success/failure per target DB
    const successDBs = [];
    const failedDBs = [];

    // 4️ Sync in parallel for all target DBs
    const syncResults = await Promise.allSettled(
      dbList.map(async (targetDb) => {
        const pool = await db.createMSSQLPool(targetDb.config);

        /* const insertQuery = `
          INSERT INTO m_field_formatting
          (form_type, column_id, column_name, column_type, column_subtype,
           is_required, createdate, updatedate, createdby, updatedby,
           log_inst, ValidFrom, ValidTo)
          SELECT v.form_type, v.column_id, v.column_name, v.column_type, v.column_subtype,
                 v.is_required, v.createdate, v.updatedate, v.createdby, v.updatedby,
                 v.log_inst, v.ValidFrom, v.ValidTo
          FROM (VALUES ${values}) AS v
               (form_type, column_id, column_name, column_type, column_subtype,
                is_required, createdate, updatedate, createdby, updatedby,
                log_inst, ValidFrom, ValidTo)
          WHERE NOT EXISTS (
            SELECT 1 FROM m_field_formatting t
            WHERE t.form_type = v.form_type
              AND t.column_name = v.column_name
              AND ISNULL(t.column_id, 0) = ISNULL(v.column_id, 0)
          )
        `; */

        const insertQuery = `
                    INSERT INTO m_field_formatting
                    (
                      form_type,
                      column_id,
                      column_name,
                      column_type,
                      column_subtype,
                      is_required,
                      createdate,
                      updatedate,
                      createdby,
                      updatedby,
                      log_inst
                    )
                    SELECT 
                      source.form_type,
                      source.column_id,
                      source.column_name,
                      source.column_type,
                      source.column_subtype,
                      source.is_required,
                      source.createdate,
                      source.updatedate,
                      source.createdby,
                      source.updatedby,
                      source.log_inst
                    FROM (
                      SELECT 
                        v.form_type,
                        v.column_id,
                        v.column_name,
                        v.column_type,
                        v.column_subtype,
                        v.is_required,
                        v.createdate,
                        v.updatedate,
                        v.createdby,
                        v.updatedby,
                        v.log_inst
                      FROM (VALUES ${values}) AS v
                      (
                        form_type,
                        column_id,
                        column_name,
                        column_type,
                        column_subtype,
                        is_required,
                        createdate,
                        updatedate,
                        createdby,
                        updatedby,
                        log_inst,
                        ValidFrom,
                        ValidTo
                      )
                    ) AS source
                    WHERE NOT EXISTS (
                      SELECT 1
                      FROM m_field_formatting t
                      WHERE 
                        LTRIM(RTRIM(LOWER(ISNULL(t.form_type, '')))) = LTRIM(RTRIM(LOWER(ISNULL(source.form_type, ''))))
                        AND LTRIM(RTRIM(LOWER(ISNULL(t.column_name, '')))) = LTRIM(RTRIM(LOWER(ISNULL(source.column_name, ''))))
                        AND ISNULL(t.column_id, 0) = ISNULL(source.column_id, 0)
                    );
                    `;

        await pool.request().query(insertQuery);

        return targetDb?.name || 'Unknown DB';
      })
    );

    // Prepare summary
    syncResults.forEach((r, idx) => {
      const dbName = dbList?.[idx]?.name || 'Unknown DB';
      if (r.status === 'fulfilled') {
        successDBs.push(dbName);
      } else {
        failedDBs.push({ db: dbName, error: r.reason?.message || r.reason });
      }
    });

    return res.json({
      success: true,
      totalRecords: result.length,
      totalDatabases: dbList.length - 1,
      successCount: successDBs.length,
      failedCount: failedDBs.length,
      successDBs,
      failedDBs
    });

  } catch (error) {
    console.error('Sync API Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
    fieldFormateSync,
};