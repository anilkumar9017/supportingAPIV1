const logger = (() => {
    try {
        return require('../../config/logger');
    } catch (e) {
        return null;
    }
})();

/**
 * Logger wrapper with context
 */
const createLogger = (moduleName) => ({
    info: (msg, data = {}) => {
        console.log(`[${moduleName}] ℹ️  ${msg}`, data);
        logger?.info?.(`[${moduleName}] ${msg}`, data);
    },
    error: (msg, error = {}) => {
        console.error(`[${moduleName}] ❌ ${msg}`, error);
        logger?.error?.(`[${moduleName}] ${msg}`, error);
    },
    warn: (msg, data = {}) => {
        console.warn(`[${moduleName}] ⚠️  ${msg}`, data);
        logger?.warn?.(`[${moduleName}] ${msg}`, data);
    },
    debug: (msg, data = {}) => {
        if (process.env.DEBUG === 'true') {
            console.log(`[${moduleName}] 🔍 ${msg}`, data);
            logger?.debug?.(`[${moduleName}] ${msg}`, data);
        }
    }
});

/**
 * Find column index once and cache it
 */
const getColumnIndexMap = (columns) => {
    const map = new Map();
    columns.forEach((col, idx) => {
        map.set(col.key, idx + 1);
    });
    return map;
};

/**
 * Get column letter from index (A, B, C, etc.)
 */
const getColumnLetter = (columnIndex) => {
    let letter = '';
    let num = columnIndex;
    while (num > 0) {
        num--;
        letter = String.fromCharCode(65 + (num % 26)) + letter;
        num = Math.floor(num / 26);
    }
    return letter;
};

/**
 * Calculate smart row range based on data
 * Default: 1000, but limit to actual data + buffer if available
 */
const getSmartRowRange = (dataRowCount, minRows = 100, bufferRows = 50) => {
    // Ensure minimum rows and add buffer for potential new entries
    return Math.max(minRows, dataRowCount + bufferRows);
};

/**
 * Apply data validation to a range of cells
 */
const applyDataValidation = (worksheet, columnIndex, startRow, endRow, validationType, config) => {
    try {
        // Validate inputs
        if (!worksheet || !worksheet.dataValidations || startRow > endRow) {
            return;
        }

        const columnLetter = getColumnLetter(columnIndex);
        const cellRange = `${columnLetter}${startRow}:${columnLetter}${endRow}`;
        
        // Build complete validation config with required ExcelJS properties
        const validationObj = {
            type: config.type,
            allowBlank: config.allowBlank !== false,
            showErrorMessage: true,
            showInputMessage: true,
            sqref: cellRange,
            ...config
        };

        worksheet.dataValidations.add(validationObj);
    } catch (error) {
        console.warn(`[applyDataValidation] Error applying validation: ${error.message}`);
    }
};

/**
 * Apply dropdown validation efficiently
 */
const applyDropdownValidation = (worksheet, columnIndex, startRow, endRow, sheetName, totalRows) => {
    try {
        if (!worksheet || startRow > endRow || totalRows < 2) {
            return;
        }

        const validationConfig = {
            type: 'list',
            allowBlank: true,
            showErrorMessage: true,
            showInputMessage: true,
            formulae: [`=${sheetName}!$A$2:$A$${totalRows}`]
        };
        
        applyDataValidation(worksheet, columnIndex, startRow, endRow, 'dropdown', validationConfig);
    } catch (error) {
        console.warn(`[applyDropdownValidation] Error applying dropdown validation: ${error.message}`);
    }
};

/**
 * Apply checkbox validation efficiently
 */
const applyCheckboxValidation = (worksheet, columnIndex, startRow, endRow, values) => {
    try {
        if (!worksheet || !values || startRow > endRow) {
            return;
        }

        const validationConfig = {
            type: 'list',
            allowBlank: true,
            showErrorMessage: true,
            showInputMessage: true,
            formulae: [`"${values.join(',')}"`]
        };
        
        applyDataValidation(worksheet, columnIndex, startRow, endRow, 'checkbox', validationConfig);
    } catch (error) {
        console.warn(`[applyCheckboxValidation] Error applying checkbox validation: ${error.message}`);
    }
};

/**
 * Apply date validation efficiently
 */
const applyDateValidation = (worksheet, columnIndex, startRow, endRow) => {
    try {
        if (!worksheet || startRow > endRow) {
            return;
        }

        const columnLetter = getColumnLetter(columnIndex);
        const cellRange = `${columnLetter}${startRow}:${columnLetter}${endRow}`;
        
        worksheet.dataValidations.add({
            sqref: cellRange,
            type: 'date',
            operator: 'greaterThan',
            allowBlank: true,
            showErrorMessage: true,
            showInputMessage: true,
            errorTitle: 'Invalid Date',
            error: 'Please enter a valid date.'
        });

        // Apply number format to range
        for (let i = startRow; i <= endRow; i++) {
            const cellRef = `${columnLetter}${i}`;
            const cell = worksheet.getCell(cellRef);
            cell.numFmt = 'yyyy-mm-dd';
        }
    } catch (error) {
        console.warn(`[applyDateValidation] Error applying date validation: ${error.message}`);
    }
};

/**
 * Safe row data extraction with formatting
 */
const extractRowData = (row, columns, columnIndexMap, validationFunctions = []) => {
    const formattedRow = {};
    let hasValue = false;
    const rowErrors = [];
    
    columns.forEach(col => {
        const cellIndex = columnIndexMap.get(col.key);
        const cell = row.getCell(cellIndex);
        let value = cell.value;
        
        // Apply custom validation functions
        for (const validate of validationFunctions) {
            const result = validate(value, col);
            if (result.error) {
                rowErrors.push(result.error);
            }
            value = result.value;
        }
        
        // Type-specific formatting
        if (col.type === 'date' && value) {
            value = new Date(value);
        }
        
        // Handle null/undefined
        if (value === undefined) {
            value = null;
        }
        
        formattedRow[col.key] = value;
        
        if (value !== null && value !== '') {
            hasValue = true;
        }
    });
    
    return { formattedRow, hasValue, rowErrors };
};

/**
 * Format row for insertion with audit fields
 */
const formatRowForInsert = (row, userId = 0) => {
    return {
        ...row,
        createdate: new Date(),
        createdby: Number(userId) || 0,
        updatedate: null,
        updatedby: null
    };
};

/**
 * Format row for update with audit fields
 */
const formatRowForUpdate = (row, userId = 0) => {
    return {
        ...row,
        updatedate: new Date(),
        updatedby: Number(userId) || 0
    };
};

/**
 * Batch process rows with error tracking
 */
const batchProcess = async (rows, batchSize, processor, onProgress) => {
    const results = {
        successful: [],
        failed: [],
        totalProcessed: 0
    };
    
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        for (const item of batch) {
            try {
                const result = await processor(item);
                results.successful.push(result);
            } catch (error) {
                results.failed.push({
                    item,
                    error: error.message,
                    index: results.totalProcessed
                });
            }
            results.totalProcessed++;
        }
        
        // Call progress callback
        if (onProgress) {
            onProgress({
                processed: results.totalProcessed,
                total: rows.length,
                percentage: Math.round((results.totalProcessed / rows.length) * 100)
            });
        }
    }
    
    return results;
};

/**
 * Generic result formatter
 */
const formatResult = (success, data = {}) => {
    return {
        success,
        timestamp: new Date().toISOString(),
        ...data
    };
};

module.exports = {
    createLogger,
    getColumnIndexMap,
    getColumnLetter,
    getSmartRowRange,
    applyDataValidation,
    applyDropdownValidation,
    applyCheckboxValidation,
    applyDateValidation,
    extractRowData,
    formatRowForInsert,
    formatRowForUpdate,
    batchProcess,
    formatResult
};
