/**
 * Hierarchical Excel Service for Master-Detail Relationships
 * Handles complex objects with child arrays for Excel export/import
 */

const ExcelJS = require('exceljs');
const configs = require('../../master-config/index');
const { createLogger, getColumnIndexMap, getSmartRowRange, applyDropdownValidation } = require('./excell-utils');
const { getGlobalDropdownCache } = require('./excell-dropdown-cache');
const { insertRecord, updateRecord, bulkInsertRecords, bulkUpdateRecords } = require('./bulk.service');
const logger = createLogger('HierarchicalExcelService');
const mssql = require('mssql');

/**
 * Extract child array configurations from main config
 */
function extractHierarchicalConfig(menuCode) {
    if (!menuCode) {
        throw new Error(`menuCode is required`);
    }
    // Find main config
    const config = configs[menuCode];
    if (!config) {
        logger.error(`Config for menu code '${menuCode}' not found. Available configs:`, Object.keys(configs));
        throw new Error(`Config for menu code '${menuCode}' not found`);
    }
    // Separate main columns and child array configs
    const mainColumns = config.columns.filter(col => col.type !== 'child_array' && !col.hideColumn);
    const childConfigs = {};
    // Process child array columns
    config.columns
        .filter(col => col.type === 'child_array')
        .forEach(child => {
            childConfigs[child.key] = {
                sheetName: child.sheetName || child.header,
                tableName: child.tableName,
                parentKey: child.parentKey || 'parent_id',
                foreignKey: child.foreignKey || 'id',
                columns: (child.columns || []).filter(col => !col.hideColumn)
            };
        });

    
    return {
        menuCode: config.menuCode,
        sheetName: config.sheetName,
        tableName: config.tableName,
        primaryKey: config.primaryKey,
        uniqueKey: config.uniqueKey,
        columns: mainColumns,
        children: childConfigs
    };
}

/**
 * Generate hierarchical Excel file with main sheet and child sheets
 */
async function generateHierarchicalExcel(menuCode, mode = 'export', db, databaseName, useApi, filters = {}) {
    try {
        // Extract config and child array definitions
        const config = extractHierarchicalConfig(menuCode);
        if (!config) {
            throw new Error(`No hierarchical configuration found for menu code: ${menuCode}`);
        }
        // Create new workbook
        const workbook = new ExcelJS.Workbook();
        // Set workbook properties
        workbook.creator = 'Supporting API';
        workbook.created = new Date();

        // Prepare dropdown metadata for label mapping and validation
        const dropdownMeta = await prepareDropdownMetadata(workbook, config, db, databaseName, useApi);

        // Generate main sheet
        await generateMainSheet(workbook, config, mode, db, databaseName, useApi, filters, dropdownMeta);

        // Generate child sheets
        for (const [childKey, childConfig] of Object.entries(config.children)) {
            await generateChildSheet(workbook, config, childConfig, childKey, mode, db, databaseName, useApi, filters, dropdownMeta);
        }

        return workbook;
    } catch (error) {
        logger.error(`Error generating hierarchical Excel for ${menuCode}:`, error);
        throw error;
    }
}

/**
 * Generate main sheet with parent records
 * - mode: 'template' = headers only, 'dummy' = headers + 1 dummy row, 'export' = headers + all data
 * - filters: optional filters to apply to main data query
 * - dropdownMeta: pre-fetched dropdown label mappings and sheet info for validation
 * - Returns: { dataRowCount }
 * - Note: Child sheets will be generated separately, so only main data is queried here
 */
async function generateMainSheet(workbook, config, mode, db, databaseName, useApi, filters = {}, dropdownMeta = {}) {
    const worksheet = workbook.addWorksheet(config.sheetName);

    // Add headers
    const headers = config.columns.map(col => col.header);
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
    };

    // Set column widths
    config.columns.forEach((col, index) => {
        worksheet.getColumn(index + 1).width = col.width || 15;
    });

    let dataRowCount = 0;
    const dropdownValueMaps = dropdownMeta.valueMaps || {};
    // Only query and populate data if mode is 'export'
    if (mode === 'export') {
        // Build main query with optional filters
        const { query, params } = buildMainQuery(config, filters);
        try {
            // Execute main data query
            const mainData = await db.executeQuery(databaseName, query, params, useApi);

            // Add data rows
            for (const row of mainData) {
                const dataRow = config.columns.map(col => {
                    let value = row[col.key];
                    // Map dropdown values to labels for export
                    if (col.type === 'dropdown' && value !== null && value !== undefined) {
                        const map = dropdownValueMaps[col.key] || {};
                        value = map[String(value)] ?? value;
                    }
                    // Format cell value based on type (e.g. date, boolean)
                    return formatCellValue(value, col);
                });
                worksheet.addRow(dataRow);
            }

            dataRowCount = mainData.length;
            // Log main sheet generation details
            logger.info(`Generated main sheet '${config.sheetName}' with ${mainData.length} rows`);
        } catch (error) {
            // Log detailed error information for debugging
            logger.error(`Error executing main query: ${query}`, error);
            logger.error('Query parameters:', params);
            throw new Error(`Database error in main data query: ${error.message}`);
        }
    }
    // Apply dropdown validations after data is added to ensure correct row count for validation range
    const maxRowsForValidation = getSmartRowRange(dataRowCount);
    const columnIndexMap = getColumnIndexMap(config.columns);
    // Apply dropdown validations for main sheet columns
    config.columns.forEach(col => {
        if (col.type === 'dropdown' && col.dropdown) {
            const sheetInfo = dropdownMeta.sheetInfo?.[col.key];
            if (sheetInfo) {
                // Get column index for validation (1-based)
                const columnIndex = columnIndexMap.get(col.key);
                // Apply dropdown validation to the entire column starting from row 2 (below header)
                applyDropdownValidation(
                    worksheet,
                    columnIndex,
                    2,
                    maxRowsForValidation,
                    sheetInfo.sheetName,
                    sheetInfo.totalRows
                );
            }
        }
    });
}

/**
 * Generate child sheet for a specific child relationship
 */
async function generateChildSheet(workbook, config, childConfig, childKey, mode, db, databaseName, useApi, filters = {}, dropdownMeta = {}) {
    const worksheet = workbook.addWorksheet(childConfig.sheetName);

    // Add parent identifier column
    const headers = [config.columns.find(col => col.key === config.uniqueKey)?.header || 'Parent Code'];
    headers.push(...childConfig.columns.map(col => col.header));
    worksheet.addRow(headers);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
    };

    // Set column widths
    worksheet.getColumn(1).width = 20; // Parent identifier
    childConfig.columns.forEach((col, index) => {
        worksheet.getColumn(index + 2).width = col.width || 15;
    });

    let dataRowCount = 0;
    const dropdownValueMaps = dropdownMeta.valueMaps || {};
    // Only query and populate data if mode is 'export'
    if (mode === 'export') {
        const { query, params } = buildChildQuery(config, childConfig, filters);
        try {
            const childData = await db.executeQuery(databaseName, query, params, useApi);

            // Add data rows
            for (const row of childData) {
                // First column is parent identifier (e.g. unique key value from main sheet)
                const dataRow = [row.parent_code]; // Parent identifier
                // Add child columns
                dataRow.push(...childConfig.columns.map(col => {
                    let value = row[col.key];
                    // Map dropdown values to labels for export
                    if (col.type === 'dropdown' && value !== null && value !== undefined) {
                        const map = dropdownValueMaps[col.key] || {};
                        value = map[String(value)] ?? value;
                    }
                    // Format cell value based on type (e.g. date, boolean)
                    return formatCellValue(value, col);
                }));
                worksheet.addRow(dataRow);
            }
            // Log child sheet generation details
            dataRowCount = childData.length;
            logger.info(`Generated child sheet '${childConfig.sheetName}' with ${childData.length} rows`);
            logger.info(`Generated child query '${childConfig.sheetName}' '${query}'`);
        } catch (error) {
            logger.error(`Error executing child query for ${childConfig.sheetName}: ${query}`, error);
            logger.error('Query parameters:', params);
            throw new Error(`Database error in child data query for ${childConfig.sheetName}: ${error.message}`);
        }
    } else {
        logger.info(`Generated template/dummy child sheet '${childConfig.sheetName}' with headers only (mode=${mode})`);
    }

    // Apply dropdown validations for child sheet columns
    const maxRowsForValidation = getSmartRowRange(dataRowCount);
    childConfig.columns.forEach((col, index) => {
        if (col.type === 'dropdown' && col.dropdown) {
            const sheetInfo = dropdownMeta.sheetInfo?.[col.key];
            if (sheetInfo) {
                // Get column index for validation (1-based, +1 for parent identifier column)
                applyDropdownValidation(
                    worksheet,
                    index + 2,
                    2,
                    maxRowsForValidation,
                    sheetInfo.sheetName,
                    sheetInfo.totalRows
                );
            }
        }
    });
}

/**
 * Prepare dropdown metadata for label mapping and validation
 * - Caches dropdown query results to optimize performance when multiple columns use the same dropdown data
 * - Returns: { valueMaps: { [columnKey]: { [value]: label } }, sheetInfo: { [columnKey]: { sheetName, totalRows } } }
 * - Creates hidden sheets for dropdown lists and applies data validation to main/child sheets
 * - Note: This function is called before main/child sheets are populated to ensure dropdown sheets are created and validations can reference them
 * - Caching strategy: Cache is keyed by databaseName + query + labelField + valueField to ensure uniqueness across different dropdown configurations and databases. Cache entries include a timestamp for potential TTL-based invalidation in the future.
 */
async function prepareDropdownMetadata(workbook, config, db, databaseName, useApi) {
    // Get global cache instance
    const cache = getGlobalDropdownCache();
    const dropdownValueMaps = {};   // To store value-to-label mappings for each dropdown column for export and import processing
    const dropdownSheetInfo = {};   // To store sheet names and row counts for each dropdown column for validation setup
    const usedSheetNames = new Set();   // To track used sheet names and avoid duplicates
    const createdSheets = new Map();    // To track created dropdown sheets by their unique key to avoid creating multiple sheets for the same dropdown data

    const allColumns = [...config.columns];
    Object.values(config.children).forEach(child => {
        allColumns.push(...child.columns);
    });

    for (const col of allColumns) {
        if (col.type !== 'dropdown' || !col.dropdown) continue;
        
        let dropdownResult;
        let sheetKey;
        
        // Check if dropdown uses static options array or database query
        if (col.dropdown.options && Array.isArray(col.dropdown.options)) {
            // Static dropdown options: use options array directly
            dropdownResult = col.dropdown.options;
            sheetKey = `${col.dropdown.sheetName}:static:${col.key}`;
        } else {
            // Query-based dropdown: fetch from database
            sheetKey = `${col.dropdown.sheetName}:${col.dropdown.query}:${col.dropdown.labelField}:${col.dropdown.valueField}`;
            dropdownResult = cache.get(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField);
            // If not in cache, execute query and store in cache
            if (!dropdownResult) {
                dropdownResult = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
                cache.set(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField, dropdownResult);
            }
        }
        
        // Create value-to-label mapping for this dropdown column
        const valueMap = {};
        dropdownResult.forEach(item => {
            const label = item[col.dropdown.labelField];
            const value = item[col.dropdown.valueField];
            valueMap[String(value)] = label;
        });
        // Store mapping and sheet info for validation setup
        dropdownValueMaps[col.key] = valueMap;
        
        // Create hidden sheet for dropdown options if it doesn't already exist
        let hiddenSheetName = createdSheets.get(sheetKey);
        // If sheet for this dropdown data hasn't been created yet, create it
        if (!hiddenSheetName) {
            hiddenSheetName = col.dropdown.sheetName;
            // Ensure hidden sheet name is unique within the workbook to avoid conflicts
            if (usedSheetNames.has(hiddenSheetName)) {
                let suffix = 2;
                while (usedSheetNames.has(`${hiddenSheetName}_${suffix}`)) {
                    suffix += 1;
                }
                hiddenSheetName = `${hiddenSheetName}_${suffix}`;
            }

            // Create hidden sheet and populate with dropdown options
            const hiddenSheet = workbook.addWorksheet(hiddenSheetName);
            hiddenSheet.state = 'hidden';
            hiddenSheet.columns = [
                {
                    header: col.dropdown.labelField,
                    key: 'value',
                    width: 30
                }
            ];
            // Add dropdown options to hidden sheet
            dropdownResult.forEach(item => {
                const label = item[col.dropdown.labelField];
                hiddenSheet.addRow({ value: label });
            });
            // Track used sheet name and created sheet for this dropdown configuration
            usedSheetNames.add(hiddenSheetName);
            createdSheets.set(sheetKey, hiddenSheetName);
        }

        dropdownSheetInfo[col.key] = {
            sheetName: hiddenSheetName,
            totalRows: dropdownResult.length + 1
        };
    }

    return {
        valueMaps: dropdownValueMaps,
        sheetInfo: dropdownSheetInfo
    };
}

/**
 * Import hierarchical Excel file with main data and child data
 * - filePath: path to the uploaded Excel file
 * - menuCode: to identify which config to use for import
 * - useApi: whether to use API for database operations (if false, uses direct DB connection)
 * - userObj: user information for audit fields during import
 * - Returns: { main: { inserted, updated, errors }, children: { [childKey]: { inserted, updated, errors } } }
 * - Note: This function processes the main sheet first to ensure parent records are created before processing child sheets that reference them. It uses transactions to ensure data integrity and rolls back if any errors occur during the import process.
 * - Dropdown value mapping: During import, if a column is of type 'dropdown', the function maps the label from the Excel file back to the corresponding value using the pre-fetched dropdown metadata. If a label doesn't have a corresponding value, it throws an error for that row.
 * - Error handling: Errors are collected for each row and returned in the result object. The import process continues even if some rows have errors, allowing for partial imports. However, if a critical error occurs (e.g. database connection issue), the entire transaction is rolled back to prevent partial data insertion.
 * - Performance considerations: The function minimizes database queries by pre-fetching dropdown data and using transactions for batch inserts/updates. It also processes rows sequentially to maintain the correct order of operations (main sheet before child sheets) and to handle dependencies between records.
 * - Data integrity: The function checks for the existence of parent records before inserting child records and uses the unique key from the main sheet to establish relationships. It also validates dropdown values against the pre-fetched metadata to ensure only valid data is imported.
 * - Scalability: For large Excel files, consider implementing batch processing and optimizing database queries (e.g. using bulk insert operations) to improve performance. Additionally, consider implementing a more robust error handling and reporting mechanism to provide detailed feedback on import results.
 * - Future enhancements: Implementing a more flexible mapping mechanism for parent-child relationships (e.g. allowing for different unique keys or multiple levels of hierarchy) and improving the handling of dropdown values (e.g. supporting multiple languages or dynamic dropdown options) could further enhance the functionality of this import process.
 */
async function importHierarchicalExcel(menuCode, file, db, databaseName, useApi, userObj) {
    let pool;
    let transaction;

    try {
        // Determine transaction mode based on environment variable
        // Default: ALL-OR-NOTHING (rollback on any error) unless EXCEL_PARTIAL_IMPORT is explicitly set to 'true'
        const partialImportAllowed = process.env.EXCEL_PARTIAL_IMPORT == 'true';
        logger.info(`Excel import mode: ${partialImportAllowed ? 'PARTIAL IMPORT' : 'ALL-OR-NOTHING (default)'}`);

        // Extract config and child array definitions
        const config = extractHierarchicalConfig(menuCode);
        if (!config) {
            throw new Error(`No hierarchical configuration found for menu code: ${menuCode}`);
        }

        // Load workbook from uploaded file buffer
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        // Prepare dropdown metadata for mapping labels to values during import and for validation
        const dropdownMappings = await prepareImportDropdownMappings(config, db, databaseName, useApi);

        // Start a shared transaction for hierarchical import
        pool = await db.getConnection(databaseName, useApi);
        transaction = new mssql.Transaction(pool);
        await transaction.begin();

        // Initialize results object to track inserted/updated records and errors for main and child sheets
        const results = {
            main: { inserted: 0, updated: 0, errors: [] },
            children: {},
            partialImportMode: partialImportAllowed,
            modeDescription: partialImportAllowed ? 'Partial import allowed - successful records saved' : 'All-or-nothing mode - any error causes full rollback'
        };

        // Import main sheet
        results.main = await importMainSheet(workbook, config, db, databaseName, useApi, userObj, dropdownMappings, transaction, partialImportAllowed);

        // Check if we should continue with child sheets based on mode
        const mainHasErrors = results.main.errors.length > 0;
        if (!partialImportAllowed && mainHasErrors) {
            throw new Error(`Main sheet import failed with ${mainHasErrors} errors. Rolling back transaction.`);
        }

        // Import child sheets
        for (const [childKey, childConfig] of Object.entries(config.children)) {
            results.children[childKey] = await importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj, dropdownMappings, transaction, partialImportAllowed);
            
            const childHasErrors = results.children[childKey]?.errors?.length > 0;
            if (!partialImportAllowed && childHasErrors) {
                throw new Error(`Child sheet '${childKey}' import failed with ${childHasErrors} errors. Rolling back transaction.`);
            }
        }

        const allErrors = [...results.main.errors];
        Object.values(results.children).forEach(childResult => {
            if (childResult?.errors?.length) {
                allErrors.push(...childResult.errors);
            }
        });

        results.errors = allErrors;
        results.totalErrors = allErrors.length;
        results.success = allErrors.length === 0;

        // Compute total inserted/updated counts across main and children
        const mainChanges = (results.main.inserted || 0) + (results.main.updated || 0);
        let childChanges = 0;
        Object.values(results.children).forEach(cr => {
            if (!cr) return;
            childChanges += (cr.inserted || 0) + (cr.updated || 0);
        });
        results.totalChanges = mainChanges + childChanges;

        // Decide commit/rollback:
        // - All-or-nothing (partialImportAllowed === false): commit only if no errors
        // - Partial import: commit if there was at least one successful change, otherwise rollback
        if (!partialImportAllowed) {
            if (results.totalErrors === 0) {
                await transaction.commit();
                results.committed = true;
                logger.info(`[Excel Import] All-or-nothing import committed. Errors: ${results.totalErrors}`);
            } else {
                // No commit in strict mode when errors exist; ensure rollback will occur in catch
                results.committed = false;
                throw new Error(`Import failed in all-or-nothing mode with ${results.totalErrors} errors`);
            }
        } else {
            if (results.totalChanges > 0) {
                await transaction.commit();
                results.committed = true;
                logger.info(`[Excel Import] Partial import committed. Changes: ${results.totalChanges}, Errors: ${results.totalErrors}`);
            } else {
                // Nothing was changed; rollback to avoid empty commits
                try {
                    await transaction.rollback();
                } catch (rbErr) {
                    logger.error('Error rolling back empty partial import transaction', rbErr);
                }
                results.committed = false;
                logger.info(`[Excel Import] No changes detected; rolled back transaction. Errors: ${results.totalErrors}`);
            }
        }

        return results;
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
                logger.info(`Transaction rolled back due to: ${error.message}`);
            } catch (rollbackError) {
                logger.error('Error rolling back hierarchical import transaction', rollbackError);
            }
        }
        logger.error(`Error importing hierarchical Excel for ${menuCode}:`, error);
        throw error;
    }
}

/**
 * Import main sheet data
 * - Maps dropdown labels back to values using pre-fetched metadata
 * - Checks for existing records using unique key and performs insert or update accordingly
 * - Returns: { inserted, updated, errors }
 * - Note: This function processes the main sheet first to ensure parent records are created before processing child sheets that reference them. It uses transactions to ensure data integrity and rolls back if any errors occur during the import process.
 * - Dropdown value mapping: During import, if a column is of type 'dropdown', the function maps the label from the Excel file back to the corresponding value using the pre-fetched dropdown metadata. If a label doesn't have a corresponding value, it throws an error for that row.
 * - Error handling: Errors are collected for each row and returned in the result object. The import process continues even if some rows have errors, allowing for partial imports. However, if a critical error occurs (e.g. database connection issue), the entire transaction is rolled back to prevent partial data insertion.
 * - Performance considerations: The function minimizes database queries by pre-fetching dropdown data and using transactions for batch inserts/updates. It also processes rows sequentially to maintain the correct order of operations (main sheet before child sheets) and to handle dependencies between records.
 * - Data integrity: The function checks for the existence of parent records before inserting child records and uses the unique key from the main sheet to establish relationships. It also validates dropdown values against the pre-fetched metadata to ensure only valid data is imported.
 * - Scalability: For large Excel files, consider implementing batch processing and optimizing database queries (e.g. using bulk insert operations) to improve performance. Additionally, consider implementing a more robust error handling and reporting mechanism to provide detailed feedback on import results.
 * - Future enhancements: Implementing a more flexible mapping mechanism for parent-child relationships (e.g. allowing for different unique keys or multiple levels of hierarchy) and improving the handling of dropdown values (e.g. supporting multiple languages or dynamic dropdown options) could further enhance the functionality of this import process.
*/
async function importMainSheet(workbook, config, db, databaseName, useApi, userObj, dropdownMappings = {}, transaction, partialImportAllowed = true) {
    const worksheet = workbook.getWorksheet(config.sheetName);
    if (!worksheet) {
        throw new Error(`Main sheet '${config.sheetName}' not found in Excel file`);
    }
    // Initialize results object to track inserted/updated records and errors for main sheet
    const results = { inserted: 0, updated: 0, errors: [] };
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || []; // Skip header

    // Process each row in the main sheet sequentially to maintain order and handle dependencies for child records
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            const record = {};
            // Parse columns and map dropdown labels to values
            config.columns.forEach((col, colIndex) => {
                let cellValue = row.getCell(colIndex + 1).value; // ExcelJS columns are 1-based
                // If column is a dropdown, map the label back to the corresponding value using pre-fetched metadata
                if (col.type === 'dropdown' && cellValue != null && cellValue !== '') {
                    // Map dropdown label to value for import
                    cellValue = mapImportDropdownValue(cellValue, col, dropdownMappings, i + 2);
                }
                record[col.key] = parseCellValue(cellValue, col);
            });

            // Check if record exists
            const existingQuery = `SELECT ${config.primaryKey} FROM ${config.tableName} WHERE ${config.uniqueKey} = @uniqueValue`;
            const existing = await db.executeQuery(databaseName, existingQuery, { uniqueValue: record[config.uniqueKey] }, useApi);
            // If record exists, perform update; otherwise, perform insert
            if (existing && existing.length > 0) {
                // Update existing record
                record.updatedate = new Date(),
                record.updatedby = Number(userObj?.userid) || 0;
                //console.log("update record ", record);
                await updateRecord({
                    transaction,
                    db,
                    databaseName,
                    tableName: config.tableName,
                    row: record,
                    id: existing[0][config.primaryKey]
                });
                results.updated++;
            } else {
                // Insert new record
                record.createdate = new Date(),
                record.createdby = Number(userObj?.userid) || 0,
                record.updatedate = null,
                record.updatedby = null
                //console.log("insert record ", record);
                await insertRecord({
                    transaction,
                    db,
                    databaseName,
                    tableName: config.tableName,
                    row: record,
                    useApi
                });
                results.inserted++;
            }
        } catch (error) {
            const errorInfo = {
                row: i + 2,
                error: error.message,
                data: row.values
            };
            results.errors.push(errorInfo);
            
            // If all-or-nothing mode, throw error immediately
            if (!partialImportAllowed) {
                throw new Error(`Main sheet import failed at row ${i + 2}: ${error.message}`);
            }
            // Otherwise continue with next row in partial mode
            logger.warn(`[Partial Mode] Skipped row ${i + 2} in main sheet:`, error.message);
        }
    }

    return results;
}

/**
 * Import child sheet data
 * - Maps dropdown labels back to values using pre-fetched metadata
 * - Checks for existing records using parent identifier and unique field, performs insert or update accordingly
 * - Validates existence of parent record before inserting child record to maintain referential integrity
 * - bulk inserts/updates child records for better performance while processing rows sequentially to maintain correct order of operations
 * - Returns: { inserted, updated, errors }
 * - Note: This function processes child sheets after the main sheet has been processed to ensure parent records are created before processing child records that reference them. It uses transactions to ensure data integrity and rolls back if any errors occur during the import process.
 * - Dropdown value mapping: During import, if a column is of type 'dropdown', the function maps the label from the Excel file back to the corresponding value using the pre-fetched dropdown metadata. If a label doesn't have a corresponding value, it throws an error for that row.
 * - Error handling: Errors are collected for each row and returned in the result object. The import process continues even if some rows have errors, allowing for partial imports. However, if a critical error occurs (e.g. database connection issue), the entire transaction is rolled back to prevent partial data insertion.
 * - Performance considerations: The function minimizes database queries by pre-fetching dropdown data and using transactions for batch inserts/updates. It also processes rows sequentially to maintain the correct order of operations and to handle dependencies between records.
 * - Data integrity: The function checks for the existence of parent records before inserting child records and uses the unique key from the main sheet to establish relationships. It also validates dropdown values against the pre-fetched metadata to ensure only valid data is imported.
 * - Scalability: For large Excel files, consider implementing batch processing and optimizing database queries (e.g. using bulk insert operations) to improve performance. Additionally, consider implementing a more robust error handling and reporting mechanism to provide detailed feedback on import results.
 * - Future enhancements: Implementing a more flexible mapping mechanism for parent-child relationships (e.g. allowing for different unique keys or multiple levels of hierarchy) and improving the handling of dropdown values (e.g. supporting multiple languages or dynamic dropdown options) could further enhance the functionality of this import process.
 */
async function importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj, dropdownMappings = {}, transaction, partialImportAllowed = true) {
    // Check if child sheet exists in the workbook
    const worksheet = workbook.getWorksheet(childConfig.sheetName);
    if (!worksheet) {
        logger.warn(`Child sheet '${childConfig.sheetName}' not found, skipping`);
        return { inserted: 0, updated: 0, errors: [] };
    }

    // Initialize results object to track inserted/updated records and errors for this child sheet
    const results = { inserted: 0, updated: 0, errors: [] };
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || []; // Skip header

    // Cache for parent IDs to avoid repeated queries for the same parent code
    const parentIdCache = new Map();

    try {
        // Phase 1: Collect and prepare all records
        const recordsToInsert = [];
        const recordsToUpdate = [];
        const rowData = []; // Store row data for error reporting

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // First column is parent identifier (e.g. unique key value from main sheet)
                const parentCode = row.getCell(1).value; // Parent identifier
                const record = {};

                // Find parent ID (use cache if available)
                let parentId;
                if (parentIdCache.has(parentCode)) {
                    parentId = parentIdCache.get(parentCode);
                } else {
                    const parentQuery = `SELECT ${config.primaryKey} FROM ${config.tableName} WHERE ${config.uniqueKey} = @parentCode`;
                    const parentResult = await db.executeQuery(databaseName, parentQuery, { parentCode }, useApi);
                    // If parent record is not found, throw an error for this row and skip processing child record
                    if (!parentResult || parentResult.length === 0) {
                        throw new Error(`Parent record not found for code: ${parentCode}`);
                    }
                    parentId = parentResult[0][config.primaryKey];
                    parentIdCache.set(parentCode, parentId);
                }
                // Set foreign key in child record to establish relationship with parent record
                record[childConfig.parentKey] = parentId;

                // Parse child columns (starting from column 3: parent code, then child columns including ID)
                childConfig.columns.forEach((col, colIndex) => {
                    // Map dropdown labels to values for import
                    let cellValue = row.getCell(colIndex + 2).value; // +2 because column 1 is parent code
                    if (col.type === 'dropdown' && cellValue != null && cellValue !== '') {
                        // Map dropdown label to value for import
                        cellValue = mapImportDropdownValue(cellValue, col, dropdownMappings, i + 2);
                    }
                    // Format cell value based on type (e.g. date, boolean) and assign to record
                    record[col.key] = parseCellValue(cellValue, col);
                });

                // Store row data for error reporting (before removing id)
                const originalRecord = { ...record };
                rowData.push({
                    rowNumber: i + 2,
                    sheet: childConfig.sheetName,
                    data: originalRecord,
                    rawRow: row.values
                });

                // Determine insert vs update based on ID column
                const recordId = record.id;
                delete record.id; // Remove id from data to insert/update

                // Set foreign key in child record to establish relationship with parent record
                record[childConfig.parentKey] = parentId;

                // Categorize records for bulk operations. Include rowNumber with each entry so
                // individual fallbacks can report the correct row when errors occur.
                if (!recordId || recordId === 0) {
                    // INSERT: New record (id is 0, null, or empty)
                    recordsToInsert.push({ row: record, rowNumber: i + 2 });
                } else {
                    // UPDATE: Existing record (id has a value)
                    recordsToUpdate.push({ id: recordId, row: record, rowNumber: i + 2 });
                }

            } catch (error) {
                // Log error for this row and add to failed records
                logger.error(`Error preparing row ${i + 2} in child sheet '${childConfig.sheetName}':`, error);
                results.errors.push({
                    row: i + 2,
                    sheet: childConfig.sheetName,
                    error: error.message,
                    data: row.values
                });
            }
        }

        // Phase 2: Tier 1 - Attempt bulk operations
        let bulkInsertSuccess = false;
        let bulkUpdateSuccess = false;

        try {
            if (recordsToInsert.length > 0) {
                const insertRows = recordsToInsert.map(r => r.row);
                //console.log("bulk insert records ", insertRows);
                await bulkInsertRecords({
                    transaction,
                    db,
                    databaseName,
                    tableName: childConfig.tableName,
                    rows: insertRows
                });
                results.inserted += insertRows.length;
                bulkInsertSuccess = true;
                logger.info(`Bulk inserted ${insertRows.length} records in '${childConfig.sheetName}'`);
            }
        } catch (bulkInsertError) {
            logger.warn(`Bulk insert failed for '${childConfig.sheetName}', falling back to individual inserts:`, bulkInsertError.message);
            
            // If all-or-nothing mode, throw error immediately
            if (!partialImportAllowed) {
                throw new Error(`Bulk insert failed for child sheet '${childConfig.sheetName}': ${bulkInsertError.message}`);
            }
        }

        try {
            if (recordsToUpdate.length > 0) {
                await bulkUpdateRecords({
                    transaction,
                    db,
                    databaseName,
                    tableName: childConfig.tableName,
                    updates: recordsToUpdate
                });
                results.updated += recordsToUpdate.length;
                bulkUpdateSuccess = true;
                logger.info(`Bulk updated ${recordsToUpdate.length} records in '${childConfig.sheetName}'`);
            }
        } catch (bulkUpdateError) {
            logger.warn(`Bulk update failed for '${childConfig.sheetName}', falling back to individual updates:`, bulkUpdateError.message);
            
            // If all-or-nothing mode, throw error immediately
            if (!partialImportAllowed) {
                throw new Error(`Bulk update failed for child sheet '${childConfig.sheetName}': ${bulkUpdateError.message}`);
            }
        }

        // Phase 3: Tier 2 - Individual processing for failed bulk operations
        if (!bulkInsertSuccess && recordsToInsert.length > 0) {
            logger.info(`Processing ${recordsToInsert.length} inserts individually for '${childConfig.sheetName}'`);
            for (let i = 0; i < recordsToInsert.length; i++) {
                const insertEntry = recordsToInsert[i];
                try {
                    await insertRecord({
                        transaction,
                        db,
                        databaseName,
                        tableName: childConfig.tableName,
                        row: insertEntry.row,
                        useApi
                    });
                    results.inserted++;
                } catch (error) {
                    const rowNumber = insertEntry.rowNumber || (rowData.find(r => r.data === insertEntry.row)?.rowNumber) || 'unknown';
                    logger.error(`Error inserting row ${rowNumber} in '${childConfig.sheetName}':`, error);
                    results.errors.push({
                        row: rowNumber,
                        sheet: childConfig.sheetName,
                        error: error.message,
                        data: insertEntry.row
                    });
                    
                    // If all-or-nothing mode, throw error immediately
                    if (!partialImportAllowed) {
                        throw new Error(`Insert failed at row ${rowNumber} in '${childConfig.sheetName}': ${error.message}`);
                    }
                    // Otherwise continue with next row in partial mode
                    logger.warn(`[Partial Mode] Skipped insert at row ${rowNumber}`);
                }
            }
        }

        if (!bulkUpdateSuccess && recordsToUpdate.length > 0) {
            logger.info(`Processing ${recordsToUpdate.length} updates individually for '${childConfig.sheetName}'`);
            for (let i = 0; i < recordsToUpdate.length; i++) {
                const update = recordsToUpdate[i];
                try {
                    await updateRecord({
                        transaction,
                        db,
                        databaseName,
                        tableName: childConfig.tableName,
                        row: update.row,
                        id: update.id
                    });
                    results.updated++;
                } catch (error) {
                    logger.error(`Error updating row ${update.rowNumber} in '${childConfig.sheetName}':`, error);
                    results.errors.push({
                        row: update.rowNumber,
                        sheet: childConfig.sheetName,
                        error: error.message,
                        data: update.row
                    });
                    
                    // If all-or-nothing mode, throw error immediately
                    if (!partialImportAllowed) {
                        throw new Error(`Update failed at row ${update.rowNumber} in '${childConfig.sheetName}': ${error.message}`);
                    }
                    // Otherwise continue with next row in partial mode
                    logger.warn(`[Partial Mode] Skipped update at row ${update.rowNumber}`);
                }
            }
        }

    } catch (error) {
        logger.error(`Error importing child sheet '${childConfig.sheetName}':`, error);
        throw new Error(`Error importing child sheet '${childConfig.sheetName}': ${error.message}`);
    }

    return results;
}

/**
 * Build query for main data
 * - filters: optional filters to apply to the main data query, expected to be an object where keys are column names and values are the filter values
 * - Returns: { query, params } where query is the SQL query string with parameter placeholders and params is an object containing the parameter values to be used in the query execution
 * - Note: This function constructs a SQL query based on the provided configuration and filters. It selects all columns defined in the configuration and applies WHERE conditions based on the filters provided. The filters are expected to be in the format of { columnName: value }, and the function will generate parameterized queries to prevent SQL injection. If no filters are provided, it will return a query that selects all records from the specified table.
 * - Future enhancements: Consider adding support for more complex filter conditions (e.g. range filters, multiple values for a column) and implementing pagination support for large datasets to improve performance during export operations. Additionally, consider implementing a more flexible query builder that can handle different types of relationships and joins for more complex data structures.
 */
function buildMainQuery(config, filters) {
    // For simplicity, we are selecting all columns defined in the configuration. If you want to select specific columns, you can modify this to use config.columns and map to their keys.
    //let query = `SELECT ${config?.column.map((col)=> col.key).join(',')} FROM ${config.tableName}`;
    let query = `SELECT * FROM ${config.tableName}`;
    
    // Build WHERE clause based on filters
    const conditions = [];
    const params = {};

    // Add filters
    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            // Only add condition if value is not undefined or null to avoid filtering out records unintentionally
            if (value !== undefined && value !== null) {
                conditions.push(`${key} = @${key}`);
                params[key] = value;
            }
        });
    }
    // If there are any conditions, append them to the query
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { query, params };
}

/**
 * Build query for child data with parent relationship
 * - filters: optional filters to apply to the child data query, expected to be an object where keys are column names from the parent table and values are the filter values
 * - Returns: { query, params } where query is the SQL query string with parameter placeholders and params is an object containing the parameter values to be used in the query execution
 * - Note: This function constructs a SQL query to retrieve child records along with their parent identifiers based on the provided configuration and filters. It performs an INNER JOIN between the child table and the parent table using the defined parent key and primary key. The filters are applied to the parent table to allow for filtering child records based on parent attributes. The function generates parameterized queries to prevent SQL injection. If no filters are provided, it will return all child records along with their parent identifiers.
 * - Future enhancements: Consider adding support for more complex filter conditions (e.g. range filters, multiple values for a column) and implementing pagination support for large datasets to improve performance during export operations. Additionally, consider implementing a more flexible query builder that can handle different types of relationships and joins for more complex data structures. 
 */
function buildChildQuery(config, childConfig, filters) {
    // Determine the parent unique key to select for the child query. This is used to establish the relationship between child records and their corresponding parent records in the main sheet. The function checks if there is a column defined in the configuration that matches the uniqueKey; if not, it falls back to using the primaryKey as the parent identifier in the query.
    const parentUniqueKey = config.columns.find(col => col.key === config.uniqueKey)?.key || config.primaryKey;
    // Build the SQL query to select child records along with their parent identifiers. The query performs an INNER JOIN between the child table and the parent table using the defined parent key and primary key. The filters are applied to the parent table to allow for filtering child records based on parent attributes. The function generates parameterized queries to prevent SQL injection.
    let query = `
        SELECT p.${parentUniqueKey} as parent_code, c.*
        FROM ${childConfig.tableName} c
        INNER JOIN ${config.tableName} p ON c.${childConfig.parentKey} = p.${config.primaryKey}
    `;
    // Build WHERE clause based on filters applied to the parent table
    const conditions = [];
    const params = {};

    // Add filters for parent records
    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            // Only add condition if value is not undefined or null to avoid filtering out records unintentionally
            if (value !== undefined && value !== null) {
                conditions.push(`p.${key} = @${key}`);
                params[key] = value;
            }
        });
    }
    // If there are any conditions, append them to the query
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { query, params };
}

/**
 * Prepare dropdown mappings for hierarchical import
 * - Caches dropdown query results to optimize performance when multiple columns use the same dropdown data
 * - Returns: { [columnKey]: { [label]: value } } mapping for each dropdown column to be used during import to map labels from Excel back to stored values in the database
 * - Note: This function is called before processing the main and child sheets during import to ensure that we have the necessary mappings to convert dropdown labels from the Excel file back to their corresponding values in the database. The function retrieves dropdown data from the database based on the queries defined in the configuration and constructs a mapping of labels to values for each dropdown column. It uses a global cache to store results of dropdown queries to avoid redundant database calls when multiple columns use the same dropdown data, improving performance during the import process.
 * - Caching strategy: Cache is keyed by databaseName + query + labelField + valueField to ensure uniqueness across different dropdown configurations and databases. Cache entries include a timestamp for potential TTL-based invalidation in the future.
 * - Future enhancements: Consider implementing a more robust caching mechanism with TTL-based invalidation to ensure that dropdown data is refreshed periodically, especially if the underlying data changes frequently. Additionally, consider adding error handling for database query failures and providing fallback mechanisms in case dropdown data cannot be retrieved during import.
 */
async function prepareImportDropdownMappings(config, db, databaseName, useApi) {
    // Get global cache instance
    const cache = getGlobalDropdownCache();
    const dropdownMappings = {};

    // Collect all columns from main and child configurations to find all dropdown columns that require mappings
    const allColumns = [...config.columns];
    Object.values(config.children).forEach(child => {
        allColumns.push(...child.columns);
    });

    // For each dropdown column, retrieve the dropdown data and construct a mapping of labels to values for use during import
    for (const col of allColumns) {
        if (col.type !== 'dropdown' || !col.dropdown) continue;

        let result;
        
        // Check if dropdown uses static options array or database query
        if (col.dropdown.options && Array.isArray(col.dropdown.options)) {
            // Static dropdown options: use options array directly
            result = col.dropdown.options;
        } else {
            // Query-based dropdown: fetch from database with caching
            result = cache.get(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField);
            if (!result) {
                // If dropdown data is not in cache, execute the query to retrieve it and store it in the cache for future use
                result = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
                cache.set(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField, result);
            }
        }

        // Construct a mapping of labels to values for this dropdown column using labelField and valueField
        const map = {};
        result.forEach(item => {
            const label = item[col.dropdown.labelField];
            const value = item[col.dropdown.valueField];
            map[String(label)] = value;
        });
        // Store the mapping for this column key to be used during import processing
        dropdownMappings[col.key] = map;
    }
    // Return the constructed dropdown mappings for use during import processing
    return dropdownMappings;
}

/**
 * Map import dropdown label to stored value
 * - value: the label value from the Excel file that needs to be mapped back to the corresponding stored value in the database
 * - col: the column configuration object for the dropdown column being processed, which contains information about the dropdown query and fields
 * - dropdownMappings: the pre-fetched mapping of labels to values for all dropdown columns, used to look up the corresponding value for the given label
 * - rowNumber: the current row number being processed in the Excel file, used for error reporting if the label cannot be mapped to a value
 * - Returns: the corresponding stored value from the database for the given label, or throws an error if the label cannot be mapped to a value in the dropdown mappings
 * - Note: This function is called during the import process for each cell in a dropdown column to convert the label from the Excel file back to the corresponding value that is stored in the database. It uses the pre-fetched dropdown mappings to look up the value based on the label. If the label does not have a corresponding value in the mapping, it throws an error indicating that there is an invalid dropdown value for that cell, which helps ensure data integrity during the import process.
 * - Future enhancements: Consider adding support for more flexible mapping strategies (e.g. case-insensitive matching, partial matching) and providing more detailed error messages (e.g. suggesting valid options) when a label cannot be mapped to a value in the dropdown mappings to improve user experience during import.
 */
function mapImportDropdownValue(value, col, dropdownMappings, rowNumber) {
    if (value === null || value === undefined || value === '') {
        return value;
    }
    // Look up the mapping for this column key to find the corresponding value for the given label from the Excel file. This mapping is essential for ensuring that the imported data is correctly interpreted and stored in the database according to the defined dropdown options. If the label does not have a corresponding value in the mapping, it indicates that there is an invalid dropdown value in the Excel file, which could lead to data integrity issues if not handled properly.
    const map = dropdownMappings[col.key] || {};
    const stringValue = String(value).trim();
    // First, try to find a direct match for the label in the mapping. If a match is found, return the corresponding value from the database.
    if (Object.prototype.hasOwnProperty.call(map, stringValue)) {
        return map[stringValue];
    }
    // If no direct match is found, check if the value can be interpreted as a number and if the mapping contains a matching numeric value (as a string). This allows for cases where the dropdown values are numeric but may be represented as strings in the Excel file.
    const numericValue = Number(stringValue);
    if (!Number.isNaN(numericValue) && String(numericValue) === stringValue) {
        return numericValue;
    }
    // If no match is found in the mapping, throw an error indicating that there is an invalid dropdown value for this cell. This helps ensure data integrity during the import process by preventing invalid values from being imported into the database.
    throw new Error(`Invalid dropdown value '${value}' for ${col.header} on row ${rowNumber}`);
}

/**
 * Format cell value for Excel export
 * - value: the original value from the database that needs to be formatted for export to Excel
 * - column: the column configuration object for the cell being processed, which contains information about the column type and dropdown configuration
 * - Returns: the formatted value that should be written to the Excel cell, based on the column type and dropdown configuration. For example, dates are converted to Date objects, numbers are parsed as floats, and dropdown values are converted to their corresponding labels for export.
 * - Note: This function is called during the export process for each cell to format the value based on the column configuration before writing it to the Excel file. It handles different data types (e.g. date, number, checkbox) and also converts dropdown values to their corresponding labels for export. This ensures that the exported Excel file contains human-readable values that correspond to the underlying data in the database.
 * - Future enhancements: Consider adding support for additional data types (e.g. currency, percentage) and implementing more flexible formatting options (e.g. custom date formats) based on the column configuration to improve the presentation of exported data in Excel.
 */
function formatCellValue(value, column) {
    if (value === null || value === undefined) return '';

    switch (column.type) {
        case 'date':
            return value instanceof Date ? value : new Date(value);
        case 'number':
            return typeof value === 'number' ? value : parseFloat(value) || 0;
        case 'checkbox':
            return column.values ? (value === column.values[0] ? true : false) : !!value;
        default:
            return String(value);
    }
}

/**
 * Parse cell value from Excel import
 * - value: the value read from the Excel cell that needs to be parsed and converted to the appropriate type for storage in the database
 * - column: the column configuration object for the cell being processed, which contains information about the column type and dropdown configuration
 * - Returns: the parsed value that should be stored in the database, based on the column type and dropdown configuration. For example, date strings are converted to Date objects, numeric strings are parsed as floats, and checkbox values are converted to their corresponding boolean or defined values for import.
 * - Note: This function is called during the import process for each cell to parse the value read from the Excel file based on the column configuration before storing it in the database. It handles different data types (e.g. date, number, checkbox) and also maps dropdown labels back to their corresponding values for import. This ensures that the imported data is correctly interpreted and stored in the database according to the defined column configurations.
 * - Future enhancements: Consider adding support for additional data types (e.g. currency, percentage) and implementing more flexible parsing options based on the column configuration to improve the handling of imported data from Excel.
 */
function parseCellValue(value, column) {
    if (value === null || value === undefined || value === '') return null;

    switch (column.type) {
        case 'date':
            return value instanceof Date ? value : new Date(value);
        case 'number':
            return typeof value === 'number' ? value : parseFloat(value) || 0;
        case 'checkbox':
            if (column.values) {
                return value === true || value === column.values[0] ? column.values[0] : column.values[1];
            }
            return value ? 'Y' : 'N';
        default:
            return String(value).trim();
    }
}

module.exports = {
    generateHierarchicalExcel,
    importHierarchicalExcel,
    extractHierarchicalConfig
};
