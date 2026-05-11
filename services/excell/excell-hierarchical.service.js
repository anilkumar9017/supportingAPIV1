/**
 * Hierarchical Excel Service for Master-Detail Relationships
 * Handles complex objects with child arrays for Excel export/import
 */

const ExcelJS = require('exceljs');
const configs = require('../../master-config/index');
const { createLogger } = require('./excell-utils');
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

    const mainColumns = config.columns.filter(col => col.type !== 'child_array');
    const childConfigs = {};

    config.columns
        .filter(col => col.type === 'child_array')
        .forEach(child => {
            childConfigs[child.key] = {
                sheetName: child.sheetName || child.header,
                tableName: child.tableName,
                parentKey: child.parentKey || 'parent_id',
                foreignKey: child.foreignKey || 'id',
                columns: child.columns || []
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

        // Generate main sheet
        await generateMainSheet(workbook, config, mode, db, databaseName, useApi, filters);

        // Generate child sheets
        for (const [childKey, childConfig] of Object.entries(config.children)) {
            await generateChildSheet(workbook, config, childConfig, childKey, mode, db, databaseName, useApi, filters);
        }

        // Generate dropdown sheets if needed
        await generateDropdownSheets(workbook, config, db, databaseName, useApi);

        return workbook;
    } catch (error) {
        logger.error(`Error generating hierarchical Excel for ${menuCode}:`, error);
        throw error;
    }
}

/**
 * Generate main sheet with parent records
 */
async function generateMainSheet(workbook, config, mode, db, databaseName, useApi, filters = {}) {
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

    if (mode === 'export') {
        const { query, params } = buildMainQuery(config, filters);
        try {
            const mainData = await db.executeQuery(databaseName, query, params, useApi);
            // Add data rows
            for (const row of mainData) {
                const dataRow = config.columns.map(col => formatCellValue(row[col.key], col));
                worksheet.addRow(dataRow);
            }

            logger.info(`Generated main sheet '${config.sheetName}' with ${mainData.length} rows`);
        } catch (error) {
            logger.error(`Error executing main query: ${query}`, error);
            logger.error('Query parameters:', params);
            throw new Error(`Database error in main data query: ${error.message}`);
        }
    } else {
        logger.info(`Generated template/dummy main sheet '${config.sheetName}' with headers only (mode=${mode})`);
    }
}

/**
 * Generate child sheet for a specific child relationship
 */
async function generateChildSheet(workbook, config, childConfig, childKey, mode, db, databaseName, useApi, filters = {}) {
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

    if (mode === 'export') {
        const { query, params } = buildChildQuery(config, childConfig, filters);
        try {
            const childData = await db.executeQuery(databaseName, query, params, useApi);

            // Add data rows
            for (const row of childData) {
                const dataRow = [row.parent_code]; // Parent identifier
                dataRow.push(...childConfig.columns.map(col => formatCellValue(row[col.key], col)));
                worksheet.addRow(dataRow);
            }

            logger.info(`Generated child sheet '${childConfig.sheetName}' with ${childData.length} rows`);
        } catch (error) {
            logger.error(`Error executing child query for ${childConfig.sheetName}: ${query}`, error);
            logger.error('Query parameters:', params);
            throw new Error(`Database error in child data query for ${childConfig.sheetName}: ${error.message}`);
        }
    } else {
        logger.info(`Generated template/dummy child sheet '${childConfig.sheetName}' with headers only (mode=${mode})`);
    }
}

/**
 * Generate dropdown sheets for validation
 */
async function generateDropdownSheets(workbook, config, db, databaseName, useApi) {
    const dropdownCache = new Map();

    // Collect all dropdown queries from main and child configs
    const allColumns = [...config.columns];
    Object.values(config.children).forEach(child => {
        allColumns.push(...child.columns);
    });

    for (const col of allColumns) {
        if (col.type === 'dropdown' && col.dropdown) {
            const cacheKey = `${col.dropdown.sheetName}_${col.dropdown.query}`;
            if (!dropdownCache.has(cacheKey)) {
                try {
                    const data = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
                    dropdownCache.set(cacheKey, data);

                    const sheet = workbook.addWorksheet(col.dropdown.sheetName);
                    sheet.addRow([col.dropdown.labelField, col.dropdown.valueField]);
                    data.forEach(row => {
                        sheet.addRow([row[col.dropdown.labelField], row[col.dropdown.valueField]]);
                    });
                    sheet.state = 'hidden';
                } catch (error) {
                    logger.error(`Error executing dropdown query for ${col.dropdown.sheetName}: ${col.dropdown.query}`, error);
                    throw new Error(`Database error in dropdown query for ${col.dropdown.sheetName}: ${error.message}`);
                }
            }
        }
    }
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

        const results = {
            main: { inserted: 0, updated: 0, errors: [] },
            children: {}
        };

        // Import main sheet
        results.main = await importMainSheet(workbook, config, db, databaseName, useApi, userObj);

        // Import child sheets
        for (const [childKey, childConfig] of Object.entries(config.children)) {
            results.children[childKey] = await importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj);
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
async function importMainSheet(workbook, config, db, databaseName, useApi, userObj) {
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
                    record[col.key] = parseCellValue(row.getCell(colIndex + 1).value, col);
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
async function importChildSheet(workbook, config, childConfig, childKey, db, databaseName, useApi, userObj) {
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
                    record[col.key] = parseCellValue(row.getCell(colIndex + 2).value, col);
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
    let query = `SELECT ${config.columns.map(col => col.key).join(', ')} FROM ${config.tableName}`;
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
