/**
 * Hierarchical Excel Service for Master-Detail Relationships
 * Handles complex objects with child arrays for Excel export/import
 */

const ExcelJS = require('exceljs');
const configs = require('../../master-config/index');
const { createLogger, getColumnIndexMap, getSmartRowRange, applyDropdownValidation } = require('./excell-utils');
const { getGlobalDropdownCache } = require('./excell-dropdown-cache');
const { insertRecord, updateRecord } = require('./bulk.service');
const logger = createLogger('HierarchicalExcelService');

/**
 * Extract child array configurations from main config
 */
function extractHierarchicalConfig(menuCode) {
    if (!menuCode) {
        throw new Error(`menuCode is required`);
    }
    
    const config = configs[menuCode];
    if (!config) {
        logger.error(`Config for menu code '${menuCode}' not found. Available configs:`, Object.keys(configs));
        throw new Error(`Config for menu code '${menuCode}' not found`);
    }

    const mainColumns = config.columns.filter(col => col.type !== 'child_array' && !col.hideColumn);
    const childConfigs = {};

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
        const config = extractHierarchicalConfig(menuCode);
        if (!config) {
            throw new Error(`No hierarchical configuration found for menu code: ${menuCode}`);
        }

        const workbook = new ExcelJS.Workbook();
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

    if (mode === 'export') {
        const { query, params } = buildMainQuery(config, filters);
        try {
            const mainData = await db.executeQuery(databaseName, query, params, useApi);

            // Add data rows
            for (const row of mainData) {
                const dataRow = config.columns.map(col => {
                    let value = row[col.key];
                    if (col.type === 'dropdown' && value !== null && value !== undefined) {
                        const map = dropdownValueMaps[col.key] || {};
                        value = map[String(value)] ?? value;
                    }
                    return formatCellValue(value, col);
                });
                worksheet.addRow(dataRow);
            }

            dataRowCount = mainData.length;
            logger.info(`Generated main sheet '${config.sheetName}' with ${mainData.length} rows`);
        } catch (error) {
            logger.error(`Error executing main query: ${query}`, error);
            logger.error('Query parameters:', params);
            throw new Error(`Database error in main data query: ${error.message}`);
        }
    }

    const maxRowsForValidation = getSmartRowRange(dataRowCount);
    const columnIndexMap = getColumnIndexMap(config.columns);

    config.columns.forEach(col => {
        if (col.type === 'dropdown' && col.dropdown) {
            const sheetInfo = dropdownMeta.sheetInfo?.[col.key];
            if (sheetInfo) {
                const columnIndex = columnIndexMap.get(col.key);
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

    if (mode === 'export') {
        const { query, params } = buildChildQuery(config, childConfig, filters);
        try {
            const childData = await db.executeQuery(databaseName, query, params, useApi);

            // Add data rows
            for (const row of childData) {
                const dataRow = [row.parent_code]; // Parent identifier
                dataRow.push(...childConfig.columns.map(col => {
                    let value = row[col.key];
                    if (col.type === 'dropdown' && value !== null && value !== undefined) {
                        const map = dropdownValueMaps[col.key] || {};
                        value = map[String(value)] ?? value;
                    }
                    return formatCellValue(value, col);
                }));
                worksheet.addRow(dataRow);
            }

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

    const maxRowsForValidation = getSmartRowRange(dataRowCount);
    childConfig.columns.forEach((col, index) => {
        if (col.type === 'dropdown' && col.dropdown) {
            const sheetInfo = dropdownMeta.sheetInfo?.[col.key];
            if (sheetInfo) {
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
 */
async function prepareDropdownMetadata(workbook, config, db, databaseName, useApi) {
    const cache = getGlobalDropdownCache();
    const dropdownValueMaps = {};
    const dropdownSheetInfo = {};
    const usedSheetNames = new Set();
    const createdSheets = new Map();

    const allColumns = [...config.columns];
    Object.values(config.children).forEach(child => {
        allColumns.push(...child.columns);
    });

    for (const col of allColumns) {
        if (col.type !== 'dropdown' || !col.dropdown) continue;

        const cacheKey = `${databaseName}:${col.dropdown.query}:${col.dropdown.labelField}:${col.dropdown.valueField}`;
        let dropdownResult = cache.get(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField);

        if (!dropdownResult) {
            dropdownResult = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
            cache.set(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField, dropdownResult);
        }

        const valueMap = {};
        dropdownResult.forEach(item => {
            valueMap[String(item[col.dropdown.valueField])] = item[col.dropdown.labelField];
        });

        dropdownValueMaps[col.key] = valueMap;

        const sheetKey = `${col.dropdown.sheetName}:${col.dropdown.query}:${col.dropdown.labelField}:${col.dropdown.valueField}`;
        let hiddenSheetName = createdSheets.get(sheetKey);

        if (!hiddenSheetName) {
            hiddenSheetName = col.dropdown.sheetName;
            if (usedSheetNames.has(hiddenSheetName)) {
                let suffix = 2;
                while (usedSheetNames.has(`${hiddenSheetName}_${suffix}`)) {
                    suffix += 1;
                }
                hiddenSheetName = `${hiddenSheetName}_${suffix}`;
            }

            const hiddenSheet = workbook.addWorksheet(hiddenSheetName);
            hiddenSheet.state = 'hidden';
            hiddenSheet.columns = [
                {
                    header: col.dropdown.labelField,
                    key: 'value',
                    width: 30
                }
            ];

            dropdownResult.forEach(item => {
                hiddenSheet.addRow({ value: item[col.dropdown.labelField] });
            });

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
 */
async function importHierarchicalExcel(menuCode, filePath, db, databaseName, useApi, userObj) {
    try {
        const config = extractHierarchicalConfig(menuCode);
        if (!config) {
            throw new Error(`No hierarchical configuration found for menu code: ${menuCode}`);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const dropdownMappings = await prepareImportDropdownMappings(config, db, databaseName, useApi);

        const results = {
            main: { inserted: 0, updated: 0, errors: [] },
            children: {}
        };

        // Import main sheet
        results.main = await importMainSheet(workbook, config, db, databaseName, useApi, userObj, dropdownMappings);

        // Import child sheets
        for (const [childKey, childConfig] of Object.entries(config.children)) {
            results.children[childKey] = await importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj, dropdownMappings);
        }

        return results;
    } catch (error) {
        logger.error(`Error importing hierarchical Excel for ${menuCode}:`, error);
        throw error;
    }
}

/**
 * Import main sheet data
 */
async function importMainSheet(workbook, config, db, databaseName, useApi, userObj, dropdownMappings = {}) {
    const worksheet = workbook.getWorksheet(config.sheetName);
    if (!worksheet) {
        throw new Error(`Main sheet '${config.sheetName}' not found in Excel file`);
    }

    const results = { inserted: 0, updated: 0, errors: [] };
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || []; // Skip header

    const transaction = await db.createTransaction('mssql');

    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const record = {};
                config.columns.forEach((col, colIndex) => {
                    let cellValue = row.getCell(colIndex + 1).value;
                    if (col.type === 'dropdown' && cellValue != null && cellValue !== '') {
                        cellValue = mapImportDropdownValue(cellValue, col, dropdownMappings, i + 2);
                    }
                    record[col.key] = parseCellValue(cellValue, col);
                });

                // Check if record exists
                const existingQuery = `SELECT ${config.primaryKey} FROM ${config.tableName} WHERE ${config.uniqueKey} = @uniqueValue`;
                const existing = await db.executeQuery(databaseName, existingQuery, { uniqueValue: record[config.uniqueKey] }, useApi);

                if (existing && existing.length > 0) {
                    // Update existing record
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
                results.errors.push({
                    row: i + 2,
                    error: error.message,
                    data: row.values
                });
            }
        }

        await db.commitTransaction('mssql', transaction);
    } catch (error) {
        await db.rollbackTransaction('mssql', transaction);
        throw error;
    }

    return results;
}

/**
 * Import child sheet data
 */
async function importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj, dropdownMappings = {}) {
    const worksheet = workbook.getWorksheet(childConfig.sheetName);
    if (!worksheet) {
        logger.warn(`Child sheet '${childConfig.sheetName}' not found, skipping`);
        return { inserted: 0, updated: 0, errors: [] };
    }

    const results = { inserted: 0, updated: 0, errors: [] };
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || []; // Skip header

    const transaction = await db.createTransaction('mssql');

    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const parentCode = row.getCell(1).value; // Parent identifier
                const record = {};

                // Find parent ID
                const parentQuery = `SELECT ${config.primaryKey} FROM ${config.tableName} WHERE ${config.uniqueKey} = @parentCode`;
                const parentResult = await db.executeQuery(databaseName, parentQuery, { parentCode }, useApi);
                if (!parentResult || parentResult.length === 0) {
                    throw new Error(`Parent record not found for code: ${parentCode}`);
                }
                record[childConfig.parentKey] = parentResult[0][config.primaryKey];

                // Parse child columns
                childConfig.columns.forEach((col, colIndex) => {
                    let cellValue = row.getCell(colIndex + 2).value;
                    if (col.type === 'dropdown' && cellValue != null && cellValue !== '') {
                        cellValue = mapImportDropdownValue(cellValue, col, dropdownMappings, i + 2);
                    }
                    record[col.key] = parseCellValue(cellValue, col);
                });

                // Check if child record exists (using parent_id + unique field)
                const uniqueField = childConfig.columns.find(col => col.required)?.key;
                let existing = null;
                if (uniqueField) {
                    const existingQuery = `SELECT id FROM ${childConfig.tableName} WHERE ${childConfig.parentKey} = @parentId AND ${uniqueField} = @uniqueValue`;
                    const existingResult = await db.executeQuery(databaseName, existingQuery, {
                        parentId: record[childConfig.parentKey],
                        uniqueValue: record[uniqueField]
                    }, useApi);
                    existing = existingResult && existingResult.length > 0 ? existingResult[0] : null;
                }

                if (existing) {
                    // Update existing child record
                    await updateRecord({
                        transaction,
                        db,
                        databaseName,
                        tableName: childConfig.tableName,
                        row: record,
                        id: existing.id
                    });
                    results.updated++;
                } else {
                    // Insert new child record
                    await insertRecord({
                        transaction,
                        db,
                        databaseName,
                        tableName: childConfig.tableName,
                        row: record,
                        useApi
                    });
                    results.inserted++;
                }
            } catch (error) {
                results.errors.push({
                    row: i + 2,
                    sheet: childConfig.sheetName,
                    error: error.message,
                    data: row.values
                });
            }
        }

        await db.commitTransaction('mssql', transaction);
    } catch (error) {
        await db.rollbackTransaction('mssql', transaction);
        throw error;
    }

    return results;
}

/**
 * Build query for main data
 */
function buildMainQuery(config, filters) {
    //let query = `SELECT ${config?.column.map((col)=> col.key).join(',')} FROM ${config.tableName}`;
    let query = `SELECT * FROM ${config.tableName}`;
    
    const conditions = [];
    const params = {};

    // Add filters
    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                conditions.push(`${key} = @${key}`);
                params[key] = value;
            }
        });
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { query, params };
}

/**
 * Build query for child data with parent relationship
 */
function buildChildQuery(config, childConfig, filters) {
    const parentUniqueKey = config.columns.find(col => col.key === config.uniqueKey)?.key || config.primaryKey;
    let query = `
        SELECT p.${parentUniqueKey} as parent_code, c.*
        FROM ${childConfig.tableName} c
        INNER JOIN ${config.tableName} p ON c.${childConfig.parentKey} = p.${config.primaryKey}
    `;

    const conditions = [];
    const params = {};

    // Add filters for parent records
    if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                conditions.push(`p.${key} = @${key}`);
                params[key] = value;
            }
        });
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { query, params };
}

/**
 * Prepare dropdown mappings for hierarchical import
 */
async function prepareImportDropdownMappings(config, db, databaseName, useApi) {
    const cache = getGlobalDropdownCache();
    const dropdownMappings = {};

    const allColumns = [...config.columns];
    Object.values(config.children).forEach(child => {
        allColumns.push(...child.columns);
    });

    for (const col of allColumns) {
        if (col.type !== 'dropdown' || !col.dropdown) continue;

        let result = cache.get(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField);
        if (!result) {
            result = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
            cache.set(databaseName, col.dropdown.query, col.dropdown.labelField, col.dropdown.valueField, result);
        }

        const map = {};
        result.forEach(item => {
            map[String(item[col.dropdown.labelField])] = item[col.dropdown.valueField];
        });

        dropdownMappings[col.key] = map;
    }

    return dropdownMappings;
}

/**
 * Map import dropdown label to stored value
 */
function mapImportDropdownValue(value, col, dropdownMappings, rowNumber) {
    if (value === null || value === undefined || value === '') {
        return value;
    }

    const map = dropdownMappings[col.key] || {};
    const stringValue = String(value).trim();

    if (Object.prototype.hasOwnProperty.call(map, stringValue)) {
        return map[stringValue];
    }

    const numericValue = Number(stringValue);
    if (!Number.isNaN(numericValue) && String(numericValue) === stringValue) {
        return numericValue;
    }

    throw new Error(`Invalid dropdown value '${value}' for ${col.header} on row ${rowNumber}`);
}

/**
 * Format cell value for Excel export
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
