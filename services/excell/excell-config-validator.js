/**
 * Validates Excel configuration structure
 */

const REQUIRED_CONFIG_FIELDS = [
    'menuCode',
    'sheetName',
    'tableName',
    'columns'
];

const REQUIRED_COLUMN_FIELDS = [
    'header',
    'key',
    'type'
];

const VALID_COLUMN_TYPES = [
    'text',
    'date',
    'checkbox',
    'dropdown',
    'number',
    'currency'
];

const VALID_DROPDOWN_FIELDS = [
    'sheetName',
    'query',
    'labelField',
    'valueField'
];

/**
 * Validate column structure
 */
const validateColumn = (column, columnIndex) => {
    const errors = [];
    
    // Check required fields
    REQUIRED_COLUMN_FIELDS.forEach(field => {
        if (!(field in column)) {
            errors.push(`Column ${columnIndex}: Missing required field '${field}'`);
        }
    });
    
    // Validate column type
    if (column.type && !VALID_COLUMN_TYPES.includes(column.type)) {
        errors.push(`Column ${columnIndex}: Invalid type '${column.type}'. Valid types: ${VALID_COLUMN_TYPES.join(', ')}`);
    }
    
    // Dropdown validation
    if (column.type === 'dropdown') {
        if (!column.dropdown) {
            errors.push(`Column ${columnIndex}: Dropdown type requires 'dropdown' configuration`);
        } else {
            VALID_DROPDOWN_FIELDS.forEach(field => {
                if (!(field in column.dropdown)) {
                    errors.push(`Column ${columnIndex}: Dropdown missing required field '${field}'`);
                }
            });
        }
    }
    
    // Checkbox validation
    if (column.type === 'checkbox') {
        if (!column.values || !Array.isArray(column.values) || column.values.length < 2) {
            errors.push(`Column ${columnIndex}: Checkbox type requires 'values' array with at least 2 items`);
        }
    }
    
    // Width should be positive if provided
    if (column.width && (typeof column.width !== 'number' || column.width <= 0)) {
        errors.push(`Column ${columnIndex}: Invalid width value. Must be a positive number`);
    }
    
    return errors;
};

/**
 * Validate entire config structure
 */
const validateConfig = (config, menuCode) => {
    const errors = [];
    const warnings = [];
    
    if (!config) {
        errors.push(`Config for menu code '${menuCode}' not found`);
        return { valid: false, errors, warnings };
    }
    
    // Check required fields
    REQUIRED_CONFIG_FIELDS.forEach(field => {
        if (!(field in config)) {
            errors.push(`Missing required field: '${field}'`);
        }
    });
    
    // Validate columns array
    if (!Array.isArray(config.columns)) {
        errors.push(`'columns' must be an array`);
    } else if (config.columns.length === 0) {
        errors.push(`'columns' array cannot be empty`);
    } else {
        // Validate each column
        config.columns.forEach((col, idx) => {
            const columnErrors = validateColumn(col, idx);
            errors.push(...columnErrors);
        });
    }
    
    // Validate table name format
    if (config.tableName && typeof config.tableName !== 'string') {
        errors.push(`'tableName' must be a string`);
    }
    
    // Validate sheet name format
    if (config.sheetName) {
        if (typeof config.sheetName !== 'string') {
            errors.push(`'sheetName' must be a string`);
        } else if (config.sheetName.length > 31) {
            warnings.push(`'sheetName' exceeds 31 characters (Excel limit). It will be truncated.`);
        }
    }
    
    // Validate unique key if provided
    if (config.uniqueKey) {
        const hasColumn = config.columns.some(col => col.key === config.uniqueKey);
        if (!hasColumn) {
            errors.push(`'uniqueKey' '${config.uniqueKey}' doesn't exist in columns`);
        }
    }
    
    // Validate primary key if provided
    if (config.primaryKey) {
        if (typeof config.primaryKey !== 'string') {
            errors.push(`'primaryKey' must be a string`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Validate runtime parameters
 */
const validateExcelParams = (params) => {
    const errors = [];
    
    if (!params.menuCode || typeof params.menuCode !== 'string') {
        errors.push('menuCode is required and must be a string');
    }
    
    if (!params.mode || !['template', 'dummy', 'export'].includes(params.mode)) {
        errors.push('mode is required and must be one of: template, dummy, export');
    }
    
    if (!params.db) {
        errors.push('db instance is required');
    }
    
    if (!params.databaseName || typeof params.databaseName !== 'string') {
        errors.push('databaseName is required and must be a string');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Validate import parameters
 */
const validateImportParams = (params) => {
    const errors = [];
    
    if (!params.menuCode || typeof params.menuCode !== 'string') {
        errors.push('menuCode is required and must be a string');
    }
    
    if (!params.file) {
        errors.push('file is required');
    } else if (!params.file.buffer) {
        errors.push('file must have a buffer property (multipart upload)');
    }
    
    if (!params.db) {
        errors.push('db instance is required');
    }
    
    if (!params.databaseName || typeof params.databaseName !== 'string') {
        errors.push('databaseName is required and must be a string');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

module.exports = {
    validateConfig,
    validateColumn,
    validateExcelParams,
    validateImportParams,
    VALID_COLUMN_TYPES,
    REQUIRED_CONFIG_FIELDS
};
