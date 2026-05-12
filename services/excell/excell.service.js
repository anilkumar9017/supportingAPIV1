
const ExcelJs = require('exceljs');
const configs = require('../../master-config/index');

const {validateDate, validateRequired, validateCheckbox, validateDuplicateExcel, mappedDropdown} = require('../excell/validation.service');
const {insertRecord, updateRecord} = require('../excell/bulk.service');
const mssql = require('mssql');

const db = require('../../config/database');
const axios = require('axios');
const moment = require('moment');

// Import utility modules
const {
    createLogger,
    getColumnIndexMap,
    getColumnLetter,
    getSmartRowRange,
    applyDropdownValidation,
    applyCheckboxValidation,
    applyDateValidation,
    extractRowData,
    formatRowForInsert,
    formatRowForUpdate,
    batchProcess,
    formatResult
} = require('./excell-utils');

const {
    validateConfig,
    validateExcelParams,
    validateImportParams
} = require('./excell-config-validator');

const {
    getGlobalDropdownCache
} = require('./excell-dropdown-cache');

// Create logger instance
const logger = createLogger('ExcelService');




/* 
    * Generates an Excel workbook based on the provided menu code and mode.
    * @param {string} menuCode - The code representing the menu configuration to use.
    * @param {string} mode - The mode of generation ('template', 'dummy', 'export').
    * @param {object} db - The database instance for executing queries.
    * @param {string} databaseName - The name of the database to connect to.
    * @param {boolean} useApi - Flag indicating whether to use API for database operations.
    * @returns {ExcelJs.Workbook} - The generated Excel workbook.
*/
async function generateExcel({menuCode, mode, db, databaseName, useApi}) {

    try {
        // Validate input parameters
        const paramValidation = validateExcelParams({menuCode, mode, db, databaseName, useApi});
        if (!paramValidation.valid) {
            logger.error('Invalid parameters', paramValidation.errors);
            throw new Error(`Invalid parameters: ${paramValidation.errors.join(', ')}`);
        }

        logger.info(`Generating Excel for menuCode: ${menuCode}, mode: ${mode}`);

        // Validate and get config
        const config = configs[menuCode];
        const configValidation = validateConfig(config, menuCode);
        
        if (!configValidation.valid) {
            logger.error(`Invalid config for ${menuCode}`, configValidation.errors);
            throw new Error(`Invalid menu code or configuration: ${configValidation.errors.join(', ')}`);
        }

        if (configValidation.warnings.length > 0) {
            configValidation.warnings.forEach(w => logger.warn(w));
        }

        const workbook = new ExcelJs.Workbook();
        const worksheet = workbook.addWorksheet(config.sheetName);

        /*
        ===========================================================
        MAIN COLUMNS
        ===========================================================
        */
        // Set up columns in the worksheet based on the configuration, including headers and widths. This defines the structure of the Excel sheet and ensures that the columns are properly formatted according to the specified configuration.
        worksheet.columns = config.columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 25
        }));
        // Style header row
        worksheet.getRow(1).font = {
            bold: true
        };
        
        // Initialize dropdown value maps for columns that have dropdown configurations. This involves querying the database for the dropdown options and caching the results to optimize performance. The dropdown value maps are used later during data export to convert stored values into their corresponding labels for better readability in the Excel file.
        const cache = getGlobalDropdownCache();
        const dropdownValueMaps = {};
        
        // Load dropdown options for columns with dropdown type, utilizing caching to avoid redundant database queries. For each dropdown column, the service checks if the dropdown options are already cached; if not, it queries the database to retrieve the options and then caches the results for future use. This approach improves performance by reducing the number of database queries needed when generating Excel files that include dropdowns.
        for (const col of config.columns) {
            if (col.type === 'dropdown') {
                let dropdownResult = cache.get(
                    databaseName,
                    col.dropdown.query,
                    col.dropdown.labelField,
                    col.dropdown.valueField
                );
                // If dropdown options are not in cache, query the database and cache the results
                if (!dropdownResult) {
                    dropdownResult = await db.executeQuery(
                        databaseName,
                        col.dropdown.query,
                        {},
                        useApi
                    );
                    // Cache the result for future use
                    cache.set(
                        databaseName,
                        col.dropdown.query,
                        col.dropdown.labelField,
                        col.dropdown.valueField,
                        dropdownResult
                    );
                }
                // Create a mapping of dropdown values to labels for export purposes, which will be used to convert stored values into human-readable labels in the Excel file. This mapping is essential for ensuring that the exported Excel file contains meaningful information that corresponds to the underlying data in the database, especially for columns that use dropdowns to represent relationships or enumerated values.
                dropdownValueMaps[col.key] = {};
                dropdownResult.forEach(item => {
                    const lookupKey = item[col.dropdown.valueField];
                    dropdownValueMaps[col.key][String(lookupKey)] = item[col.dropdown.labelField];
                });
            }
        }

        let dataRowCount = 0;

        /*
        ===========================================================
        MODES
        ===========================================================
        */

        /*
        TEMPLATE MODE
        */
        if (mode === 'template') {
            logger.debug('Generating template mode');
            // no data rows
        }

        /*
        DUMMY MODE
        */
        if (mode === 'dummy') {
            logger.debug('Generating dummy mode');
            
            const sampleRow = {};
            // Populate sample row with dummy data based on column types, which provides a template for users to understand the expected format and types of data for each column when filling out the Excel file. This is particularly useful for guiding users in providing the correct data and ensuring that the imported data can be processed successfully without validation errors.
            config.columns.forEach(col => {
                if (col.type === 'checkbox') {
                    sampleRow[col.key] = col.values[0];
                }
                else if (col.type === 'dropdown') {
                    sampleRow[col.key] = 'Select';
                }
                else {
                    sampleRow[col.key] = `Sample ${col.header}`;
                }
            });

            worksheet.addRow(sampleRow);
            dataRowCount = 1;
        }

        /*
        ACTUAL EXPORT MODE
        */
        if (mode === 'export') {
            logger.debug('Generating export mode');
            
            try {
                const selectedColumns = config.columns.map(c => c.key).join(', ');
                const query = `select ${selectedColumns} from ${config.tableName}`;
                
                logger.debug(`Executing query: ${query}`);
                const data = await db.executeQuery(databaseName, query, {}, useApi);
                
                logger.info(`Retrieved ${data.length} rows for export`);
                
                data.forEach(row => {
                    const formattedRow = {};
                    // Format each row of data for export, applying necessary transformations based on column types. This includes mapping dropdown values to their corresponding labels for better readability in the Excel file, formatting date fields appropriately, and ensuring that null or undefined values are handled gracefully. This step is crucial for ensuring that the exported Excel file contains data that is both accurate and user-friendly, reflecting the underlying data in a way that is meaningful to users.
                    config.columns.forEach(col => {
                        let value = row[col.key];
                        
                        // Dropdown label mapping
                        if (col.type === 'dropdown' && value !== null && value !== undefined) {
                            const map = dropdownValueMaps[col.key] || {};
                            value = map[String(value)] ?? value;
                        }
                        
                        // Date formatting
                        if (col.type === 'date' && value) {
                            value = new Date(value);
                        }
                        
                        // Null safety
                        if (value === undefined || value === null) {
                            value = '';
                        }
                        
                        formattedRow[col.key] = value;
                    });
                
                    worksheet.addRow(formattedRow);
                });

                dataRowCount = data.length;
            } catch (error) {
                logger.error('Error executing export query', error);
                throw new Error(`Failed to export data: ${error.message}`);
            }
        }

        /*
        ===========================================================
        DROPDOWN SHEETS & VALIDATIONS
        ===========================================================
        */

        const columnIndexMap = getColumnIndexMap(config.columns);
        const maxRowsForValidation = getSmartRowRange(dataRowCount);

        logger.debug(`Applying validations for ${maxRowsForValidation} rows`);

        for (const col of config.columns) {
            // Apply dropdown validations by creating hidden sheets for dropdown options and setting up data validation rules on the main worksheet. This ensures that users can only select valid options from the dropdowns when filling out the Excel file, which helps maintain data integrity and prevents invalid data from being entered during import.
            if (col.type === 'dropdown') {
                try {
                    logger.debug(`Processing dropdown for column: ${col.key}`);

                    // Check cache first
                    let dropdownResult = cache.get(
                        databaseName,
                        col.dropdown.query,
                        col.dropdown.labelField,
                        col.dropdown.valueField
                    );
                    // If dropdown options are not in cache, query the database and cache the results
                    if (!dropdownResult) {
                        logger.debug(`Cache miss for ${col.key}, querying database`);
                        dropdownResult = await db.executeQuery(
                            databaseName,
                            col.dropdown.query,
                            {},
                            useApi
                        );

                        // Cache the result
                        cache.set(
                            databaseName,
                            col.dropdown.query,
                            col.dropdown.labelField,
                            col.dropdown.valueField,
                            dropdownResult
                        );
                    } else {
                        logger.debug(`Cache hit for ${col.key}`);
                    }

                    const hiddenSheet = workbook.addWorksheet(
                        col.dropdown.sheetName
                    );

                    hiddenSheet.state = 'hidden';

                    hiddenSheet.columns = [
                        {
                            header: col.header,
                            key: 'value',
                            width: 30
                        }
                    ];

                    dropdownResult.forEach(item => {
                        hiddenSheet.addRow({
                            value: item[col.dropdown.labelField]
                        });
                    });

                    const totalRows = dropdownResult.length + 1;
                    const columnIndex = columnIndexMap.get(col.key);

                    // Apply dropdown validation
                    applyDropdownValidation(
                        worksheet,
                        columnIndex,
                        2,
                        maxRowsForValidation,
                        col.dropdown.sheetName,
                        totalRows
                    );

                } catch (error) {
                    logger.error(`Error processing dropdown for column ${col.key}`, error);
                    throw new Error(`Failed to process dropdown for ${col.key}: ${error.message}`);
                }
            }

            /*
            =======================================================
            CHECKBOX VALIDATION
            =======================================================
            */
            if (col.type === 'checkbox') {
                try {
                    const columnIndex = columnIndexMap.get(col.key);
                    applyCheckboxValidation(
                        worksheet,
                        columnIndex,
                        2,
                        maxRowsForValidation,
                        col.values
                    );
                } catch (error) {
                    logger.error(`Error applying checkbox validation for ${col.key}`, error);
                }
            }

            /* 
                Date Fields
            */
            if (col.type === 'date') {
                try {
                    const columnIndex = columnIndexMap.get(col.key);
                    applyDateValidation(
                        worksheet,
                        columnIndex,
                        2,
                        maxRowsForValidation
                    );
                } catch (error) {
                    logger.error(`Error applying date validation for ${col.key}`, error);
                }
            }
        }

        /*
        ===========================================================
        FREEZE HEADER & AUTO FILTER
        ===========================================================
        */

        worksheet.views = [
            {
                state: 'frozen',
                ySplit: 1
            }
        ];

        worksheet.autoFilter = {
            from: 'A1',
            to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
        };

        logger.info(`Successfully generated Excel with ${dataRowCount} data rows`);

        return workbook;

    } catch (error) {
        logger.error('Error in generateExcel', error);
        throw error;
    }
}

/* 
    * Imports data from an Excel file based on the provided menu code and user information.
    * @param {string} menuCode - The code representing the menu configuration to use.
    * @param {object} file - The Excel file object containing the data to import.
    * @param {object} db - The database instance for executing queries.
    * @param {string} databaseName - The name of the database to connect to.
    * @param {boolean} useApi - Flag indicating whether to use API for database operations.
    * @param {object} userObj - The user object containing information about the current user.
    * @returns {Promise<{success: boolean, errors: Array}>} - A promise resolving to the import results.

*/
async function importExcel({menuCode, file, db, databaseName, useApi, userObj, batchSize = 100}) {
  try {
    // Validate input parameters
    const paramValidation = validateImportParams({menuCode, file, db, databaseName, useApi});
    if (!paramValidation.valid) {
      logger.error('Invalid import parameters', paramValidation.errors);
      return formatResult(false, {
        errors: paramValidation.errors,
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0
      });
    }

    logger.info(`Starting import for menuCode: ${menuCode}`);

    /* CONFIG VALIDATION */
    const config = configs[menuCode];
    const configValidation = validateConfig(config, menuCode);
    
    if (!configValidation.valid) {
      logger.error(`Invalid config for ${menuCode}`, configValidation.errors);
      return formatResult(false, {
        errors: configValidation.errors,
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0
      });
    }

    /* LOAD WORKBOOK */
    try {
      var workbook = new ExcelJs.Workbook();
      await workbook.xlsx.load(file.buffer);
    } catch (error) {
      logger.error('Failed to load Excel file', error);
      return formatResult(false, {
        errors: [`Failed to load Excel file: ${error.message}`],
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0
      });
    }

    const worksheet = workbook.getWorksheet(config.sheetName);
    if (!worksheet) {
      const err = `Sheet '${config.sheetName}' not found in workbook`;
      logger.error(err);
      return formatResult(false, {
        errors: [err],
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0
      });
    }

    /* VARIABLES */
    const rows = [];
    const errors = [];
    const duplicateSet = new Set();
    const dropdownMappings = {};
    const cache = getGlobalDropdownCache();

    /* GET DROPDOWN MAPPINGS - WITH CACHING */
    logger.debug('Loading dropdown mappings');
    for (const col of config.columns) {
      if (col.type === 'dropdown') {
        try {
          // Check cache first
          let result = cache.get(
            databaseName,
            col.dropdown.query,
            col.dropdown.labelField,
            col.dropdown.valueField
          );

          if (!result) {
            logger.debug(`Cache miss for dropdown ${col.key}, querying database`);
            result = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
            cache.set(
              databaseName,
              col.dropdown.query,
              col.dropdown.labelField,
              col.dropdown.valueField,
              result
            );
          } else {
            logger.debug(`Cache hit for dropdown ${col.key}`);
          }

          dropdownMappings[col.key] = {};
          result.forEach(item => {
            const id = item[col.dropdown.valueField];
            const label = item[col.dropdown.labelField];
            dropdownMappings[col.key][label] = id;
          });
        } catch (error) {
          logger.error(`Error loading dropdown for ${col.key}`, error);
          errors.push(`Failed to load dropdown for column ${col.key}: ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      return formatResult(false, {
        errors,
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0
      });
    }

    /* READ & VALIDATE EXCEL ROWS */
    logger.debug('Reading and validating Excel rows');
    const columnIndexMap = getColumnIndexMap(config.columns);

    worksheet.eachRow((row, rowNumber) => {
      /* SKIP HEADER */
      if (rowNumber === 1) {
        return;
      }

      const rowData = {};
      let hasValue = false;

      try {
        /* READ COLUMNS WITH VALIDATION */
        config.columns.forEach((col) => {
          const cellIndex = columnIndexMap.get(col.key);
          const cell = row.getCell(cellIndex);
          let value = cell.value;

          /* DATE VALIDATION */
          value = validateDate({value, col, rowNumber, errors});

          /* DROPDOWN VALIDATION (IMPORTANT) */
          if (col.type === 'dropdown' && value) {
            value = mappedDropdown({value, col, rowNumber, errors}, dropdownMappings);
          }

          /* REQUIRED VALIDATION */
          validateRequired({value, col, rowNumber, errors});

          /* CHECKBOX VALIDATION */
          validateCheckbox({value, col, rowNumber, errors});

          /* UNDEFINED → NULL */
          if (value === undefined) {
            value = null;
          }

          rowData[col.key] = value;

          /* CHECK EMPTY ROW */
          if (value !== null && value !== "") {
            hasValue = true;
          }
        });

        /* DUPLICATE VALIDATION */
        if (config.uniqueKey && rowData[config.uniqueKey] && hasValue) {
          validateDuplicateExcel({
            duplicateSet,
            value: rowData[config.uniqueKey],
            rowNumber,
            errors,
          });
        }

        /* SKIP EMPTY ROWS */
        if (hasValue) {
          rows.push({...rowData, _rowNumber: rowNumber});
        }

      } catch (rowError) {
        logger.warn(`Error processing row ${rowNumber}`, rowError);
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
      }
    });

    /* VALIDATION ERRORS */
    if (errors.length > 0) {
      logger.warn(`Import validation failed with ${errors.length} errors`);
      return formatResult(false, {
        errors,
        totalRows: rows.length,
        created: 0,
        updated: 0,
        failed: rows.length
      });
    }

    if (rows.length === 0) {
      logger.warn('No valid rows found in Excel file');
      return formatResult(true, {
        totalRows: 0,
        created: 0,
        updated: 0,
        failed: 0,
        message: 'No data rows found in file'
      });
    }

    logger.info(`Validated ${rows.length} rows for import`);

    /* FETCH EXISTING RECORDS */
    const uniqueValues = rows.map((r) => r[config.uniqueKey]).filter(v => v);
    let existingMap = new Map();

    if (uniqueValues.length > 0 && config.uniqueKey) {
      try {
        logger.debug(`Fetching existing records for ${uniqueValues.length} unique values`);
        
        const inClause = uniqueValues.map((_, i) => `@p${i}`).join(",");
        const query = `
            SELECT
                ${config.primaryKey || "id"},
                ${config.uniqueKey}
            FROM ${config.tableName}
            WHERE ${config.uniqueKey}
            IN (${inClause})
        `;

        const params = {};
        uniqueValues.forEach((val, i) => {
          params[`p${i}`] = val;
        });

        const existingRows = await db.executeQuery(databaseName, query, params, useApi);
        existingMap = new Map(
          existingRows.map((item) => [item[config.uniqueKey], item])
        );

        logger.debug(`Found ${existingMap.size} existing records`);
      } catch (error) {
        logger.error('Error fetching existing records', error);
        return formatResult(false, {
          errors: [`Failed to fetch existing records: ${error.message}`],
          totalRows: rows.length,
          created: 0,
          updated: 0,
          failed: rows.length
        });
      }
    }

    /*
    =====================================================
    START TRANSACTION & INSERT/UPDATE
    =====================================================
    */
    let pool, transaction;
    let createdCount = 0;
    let updatedCount = 0;
    const failedRecords = [];

    try {
      pool = await db.getConnection(databaseName, useApi);
      transaction = new mssql.Transaction(pool);
      await transaction.begin();

      logger.info(`Starting batch import with batchSize: ${batchSize}`);

      /* PROCESS ROWS IN BATCHES */
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        for (const row of batch) {
          try {
            const uniqueValue = row[config.uniqueKey];
            const existing = existingMap.get(uniqueValue);
            const rowNum = row._rowNumber;
            delete row._rowNumber;

            /* UPDATE */
            if (existing) {
              const updateRow = formatRowForUpdate(row, userObj?.userid);
              
              await updateRecord({
                transaction,
                db,
                databaseName,
                tableName: config.tableName,
                row: updateRow,
                id: existing[config.primaryKey || "id"],
              });

              updatedCount++;
              logger.debug(`Updated row ${rowNum}`);

            } else {
              /* INSERT */
              const insertRow = formatRowForInsert(row, userObj?.userid);

              await insertRecord({
                transaction,
                db,
                databaseName,
                tableName: config.tableName,
                row: insertRow,
                useApi,
              });

              createdCount++;
              logger.debug(`Inserted row ${rowNum}`);
            }

          } catch (recordError) {
            logger.warn(`Error processing row ${row._rowNumber || i}`, recordError);
            failedRecords.push({
              rowNumber: row._rowNumber,
              error: recordError.message,
              data: row
            });
          }
        }

        // Log progress
        const processed = Math.min(i + batchSize, rows.length);
        logger.info(`Processed ${processed}/${rows.length} rows (${Math.round((processed/rows.length)*100)}%)`);
      }

      /* COMMIT TRANSACTION */
      await transaction.commit();
      logger.info('Transaction committed successfully');

    } catch (transactionError) {
      try {
        if (transaction) {
          await transaction.rollback();
          logger.warn('Transaction rolled back due to error');
        }
      } catch (rollbackError) {
        logger.error('Error rolling back transaction', rollbackError);
      }

      logger.error('Transaction failed', transactionError);
      return formatResult(false, {
        errors: [`Transaction failed: ${transactionError.message}`],
        totalRows: rows.length,
        created: createdCount,
        updated: updatedCount,
        failed: rows.length - createdCount - updatedCount,
        failedRecords: failedRecords.slice(0, 10) // Return first 10 failed records
      });

    } finally {
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          logger.warn('Error closing database pool', closeError);
        }
      }
    }

    logger.info(`Import completed: Created=${createdCount}, Updated=${updatedCount}, Total=${rows.length}`);

    return formatResult(true, {
      totalRows: rows.length,
      created: createdCount,
      updated: updatedCount,
      failed: failedRecords.length,
      failedRecords: failedRecords.length > 0 ? failedRecords.slice(0, 10) : undefined
    });

  } catch (error) {
    logger.error('Unexpected error in importExcel', error);
    return formatResult(false, {
      errors: [`Unexpected error: ${error.message}`],
      totalRows: 0,
      created: 0,
      updated: 0,
      failed: 0
    });
  }
}

module.exports = {
    generateExcel,
    importExcel
};