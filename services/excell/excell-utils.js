const logger = (() => {
    try {
        return require('../../config/logger');
    } catch (e) {
        return null;
    }
})();

/**
 * Logger wrapper with context
 * - moduleName: the name of the module or component for which the logger is being created, used to provide context in log messages
 * - Returns: an object with logging methods (info, error, warn, debug) that include the module name in the log messages for better traceability and debugging. If a logger instance is available from the configuration, it will also log messages using that instance; otherwise, it will default to console logging.
 * - Note: This function creates a logger that prefixes all log messages with the specified module name, making it easier to identify the source of log messages in a complex application. It also gracefully handles the absence of a configured logger by falling back to console logging, ensuring that log messages are still output even if a logger instance is not available.
 * - Future enhancements: Consider adding support for different log levels (e.g. verbose, critical) and allowing for dynamic configuration of the logger (e.g. enabling/disabling logging, changing log format) to provide more flexibility in logging behavior across different modules and environments.
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
 * - columns: the array of column configuration objects from the Excel configuration, which contains information about each column including its key and other properties
 * - Returns: a Map object that maps each column key to its corresponding 1-based index in the Excel sheet. This allows for efficient lookup of column indices during data processing without having to repeatedly search through the columns array, improving performance when handling large datasets.
 * - Note: This function creates a mapping of column keys to their respective indices based on the provided column configuration. It iterates through the columns array once and stores the index of each column in a Map for quick access later on. This is particularly useful during the import and export processes where we need to frequently access column indices based on their keys, as it avoids the overhead of searching through the columns array multiple times.
 * - Future enhancements: Consider adding error handling for cases where column keys are duplicated or missing, and providing options for case-insensitive key mapping to improve robustness and flexibility in handling different column configurations.
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
 * - columnIndex: the 1-based index of the column for which to calculate the corresponding Excel column letter (e.g. 1 for A, 2 for B, ..., 27 for AA)
 * - Returns: the corresponding Excel column letter for the given 1-based column index. This is used for constructing cell references and ranges in Excel, which require column letters rather than numeric indices.
 * - Note: This function converts a 1-based column index to its corresponding Excel column letter(s) by repeatedly calculating the remainder and quotient when dividing by 26 (the number of letters in the English alphabet). It handles cases where the column index exceeds 26, resulting in multiple letters (e.g. AA, AB, etc.). This is essential for correctly referencing columns in Excel formulas and data validation configurations.
 * - Future enhancements: Consider adding support for custom column naming conventions (e.g. using different alphabets or symbols) and providing options for zero-based indexing to improve flexibility in handling various Excel configurations.
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
 * - dataRowCount: the number of rows of actual data that need to be processed or validated in the Excel sheet, which is used to determine the appropriate range for applying data validation and other operations
 * - minRows: the minimum number of rows to include in the range, which ensures that there is a reasonable default range for data validation even if the actual data row count is low
 * - bufferRows: the additional number of rows to include as a buffer beyond the actual data row count, which allows for potential new entries or future data growth without needing to immediately adjust the range
 * - Returns: the calculated number of rows to include in the range for data validation and other operations, which is the maximum of the minimum rows and the actual data row count plus the buffer. This ensures that the range is appropriately sized based on the current data while also providing flexibility for future growth.
 * - Note: This function calculates a "smart" row range for applying data validation and other operations in Excel based on the actual number of data rows. It ensures that there is a minimum range to work with while also allowing for a buffer to accommodate potential new entries. This helps optimize performance by not applying validation to an excessively large range when there is only a small amount of data, while still providing enough room for growth without needing immediate adjustments.
 * - Future enhancements: Consider adding options for dynamic buffer sizing based on historical data growth patterns and providing more granular control over the minimum and maximum range limits to further optimize performance and usability in different scenarios.
 */
const getSmartRowRange = (dataRowCount, minRows = 100, bufferRows = 50) => {
    // Ensure minimum rows and add buffer for potential new entries
    return Math.max(minRows, dataRowCount + bufferRows);
};

/**
 * Apply data validation to a range of cells
 * - worksheet: the ExcelJS worksheet object to which the data validation should be applied, which represents the specific sheet in the Excel file where the validation rules will be set up
 * - columnIndex: the 1-based index of the column for which to apply the data validation, used to determine the column letter and construct the cell range for validation
 * - startRow: the starting row number for the range of cells to which the validation should be applied, which defines the upper bound of the range
 * - endRow: the ending row number for the range of cells to which the validation should be applied, which defines the lower bound of the range
 * - validationType: the type of data validation to apply (e.g. 'dropdown', 'checkbox', 'date'), which determines the specific validation rules and configuration that will be set up for the specified range
 * - config: an object containing additional configuration options for the data validation, such as allowed values for dropdowns or error messages, which is used to customize the behavior of the validation based on the specific requirements of the column being processed
 * - Note: This function applies data validation rules to a specified range of cells in an Excel worksheet based on the provided column index, row range, validation type, and configuration. It constructs the appropriate cell range and validation configuration based on the inputs and uses ExcelJS's data validation features to enforce the specified rules. This is essential for ensuring that users enter valid data into the Excel sheet according
 */
const applyDataValidation = (worksheet, columnIndex, startRow, endRow, validationType, config) => {
    try {
        // Validate inputs
        if (!worksheet) {
            console.warn(`[applyDataValidation] Invalid worksheet`);
            return;
        }
        
        if (startRow > endRow) {
            console.warn(`[applyDataValidation] Invalid row range: ${startRow} > ${endRow}`);
            return;
        }

        // Ensure dataValidations exists
        if (!worksheet.dataValidations) {
            console.warn(`[applyDataValidation] worksheet.dataValidations not available`);
            return;
        }
        // Construct cell range (e.g. A2:A100) based on column index and row range
        const columnLetter = getColumnLetter(columnIndex);
        // Use the column letter and row numbers to define the range of cells to which the validation will be applied. This range is essential for correctly targeting the cells in Excel where the validation rules should be enforced.
        const cellRange = `${columnLetter}${startRow}:${columnLetter}${endRow}`;
        
        // Build complete validation config with required ExcelJS properties
        const validationObj = {
            type: config.type,
            allowBlank: config.allowBlank !== false,
            showErrorMessage: true,
            showInputMessage: true,
            ...config
        };

        worksheet.dataValidations.add(cellRange, validationObj);
    } catch (error) {
        console.warn(`[applyDataValidation] Error applying validation: ${error.message}`);
    }
};

/**
 * Apply dropdown validation efficiently
 * - sheetName: the name of the sheet where the dropdown list is located, which is used to construct the reference for the dropdown validation formula. This allows the validation to reference a range of cells in the specified sheet that contains the dropdown options, enabling dynamic and efficient dropdown validations in Excel.
 * - Note: This function applies dropdown validation to a specified range of cells in an Excel worksheet by constructing a reference to the dropdown options located in another sheet. It uses the applyDataValidation function to set up the validation rules based on the provided configuration. This approach allows for efficient management of dropdown options and ensures that the validation is correctly linked to the source of the dropdown values.
 * - Future enhancements: Consider adding support for more complex dropdown configurations (e.g. dependent dropdowns, multi-select dropdowns) and providing options for dynamic referencing of dropdown ranges based on the column configuration to further enhance the flexibility and usability of dropdown validations in Excel.
 */
const quoteSheetName = (sheetName) => {
    if (!sheetName || typeof sheetName !== 'string') {
        return sheetName;
    }
    const escaped = sheetName.replace(/'/g, "''");
    return `'${escaped}'`;
};

/* 
    * Apply checkbox validation efficiently
    * - values: an array of allowed values for the checkbox (e.g. ['Yes', 'No'] or [true, false]) that will be used to construct the dropdown list for validation. This allows for flexible checkbox configurations where the valid options can be defined as needed. The function will create a dropdown validation with these values, which effectively enforces that only the specified values can be entered in the cell, simulating checkbox behavior in Excel.
    * Note: Since Excel does not have a native checkbox data validation type, we use a dropdown list with specified values to simulate checkbox functionality. This allows us to enforce that only the defined values can be entered in the cell, providing a way to implement checkbox-like behavior in Excel. The function takes care of constructing the appropriate validation configuration based on the provided values and applies it to the specified range of cells.
    * Future enhancements: Consider adding support for more complex checkbox configurations (e.g. multi-select checkboxes, dependent checkboxes) and providing more flexible validation options based on the column configuration to improve the handling of checkbox-like behavior in Excel.
    * 
*/
const applyDropdownValidation = (worksheet, columnIndex, startRow, endRow, sheetName, totalRows) => {
    try {
        if (!worksheet) {
            console.warn(`[applyDropdownValidation] Invalid worksheet`);
            return;
        }

        if (!sheetName || !sheetName.trim()) {
            console.warn(`[applyDropdownValidation] Invalid sheetName: "${sheetName}"`);
            return;
        }

        if (startRow > endRow) {
            console.warn(`[applyDropdownValidation] Invalid row range: ${startRow} > ${endRow}`);
            return;
        }

        if (totalRows < 2) {
            console.warn(`[applyDropdownValidation] Invalid totalRows: ${totalRows} < 2`);
            return;
        }

        if (!worksheet.dataValidations) {
            console.warn(`[applyDropdownValidation] worksheet.dataValidations not available`);
            return;
        }
        // Construct the reference for the dropdown validation formula using the provided sheet name and total rows. This reference points to the range of cells in the specified sheet that contains the dropdown options, allowing the validation to dynamically pull values from that range.
        const quotedSheetName = quoteSheetName(sheetName);
        const validationConfig = {
            type: 'list',
            allowBlank: true,
            showErrorMessage: true,
            showInputMessage: true,
            formulae: [`=${quotedSheetName}!$A$2:$A$${totalRows}`]
        };
        // Apply the dropdown validation to the specified range of cells in the worksheet using the constructed validation configuration. This sets up the data validation rules in Excel to enforce that only values from the specified dropdown list can be entered in the target cells.
        applyDataValidation(worksheet, columnIndex, startRow, endRow, 'dropdown', validationConfig);
    } catch (error) {
        console.warn(`[applyDropdownValidation] Error applying dropdown validation for sheet "${sheetName}": ${error.message}`);
    }
};

/**
 * Apply checkbox validation efficiently
 * - values: an array of allowed values for the checkbox (e.g. ['Yes', 'No'] or [true, false]) that will be used to construct the dropdown list for validation. This allows for flexible checkbox configurations where the valid options can be defined as needed. The function will create a dropdown validation with these values, which effectively enforces that only the specified values can be entered in the cell, simulating checkbox behavior in Excel.
 * - Note: Since Excel does not have a native checkbox data validation type, we use a dropdown list with specified values to simulate checkbox functionality. This allows us to enforce that only the defined values can be entered in the cell, providing a way to implement checkbox-like behavior in Excel. The function takes care of constructing the appropriate validation configuration based on the provided values and applies it to the specified range of cells.
 * - Future enhancements: Consider adding support for more complex checkbox configurations (e.g. multi-select checkboxes, dependent checkboxes) and providing more flexible validation options based on the column configuration to improve the handling of checkbox-like behavior in Excel.
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
 * - Note: This function applies date validation to a specified range of cells in an Excel worksheet by constructing the appropriate validation configuration for date type and applying it using the applyDataValidation function. It also sets the number format for the cells in the range to ensure that dates are displayed correctly in Excel. This is essential for ensuring that users enter valid date values into the Excel sheet and that those values are properly formatted for display.
 * - Future enhancements: Consider adding support for custom date formats based on the column configuration and providing options for different date validation rules (e.g. date range, specific date) to further enhance the flexibility and usability of date validations in Excel.
 */
const applyDateValidation = (worksheet, columnIndex, startRow, endRow) => {
    try {
        if (!worksheet || startRow > endRow) {
            return;
        }

        const columnLetter = getColumnLetter(columnIndex);
        const cellRange = `${columnLetter}${startRow}:${columnLetter}${endRow}`;
        // Apply date validation to the specified range of cells using the applyDataValidation function with the appropriate configuration for date type. This sets up the data validation rules in Excel to enforce that only valid date values can be entered in the target cells.
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
 * - row: the ExcelJS row object from which to extract data, representing a single row in the Excel sheet that contains cell values corresponding to the defined columns
 * - columns: the array of column configuration objects that define the expected structure and types of data for each column, which is used to guide the extraction and formatting of cell values from the row
 * - columnIndexMap: a Map object that maps column keys to their corresponding 1-based indices in the Excel sheet, which is used to efficiently locate the correct cells in the row based on the column configuration
 * - validationFunctions: an optional array of custom validation functions that can be applied to each cell value during extraction, allowing for additional checks and transformations based on specific column requirements
 * - Returns: an object containing the formatted row data as a key-value pair (where keys are column keys and values are the extracted and formatted cell values), a boolean indicating whether the row has any non-empty values, and an array of any errors encountered during extraction and validation. This allows for robust handling of row data with proper formatting and error tracking, ensuring that the extracted data is ready for further processing or insertion into the database.
 * - Note: This function extracts data from an Excel row based on the defined column configuration and applies any necessary formatting (e.g. date conversion) and custom validation functions. It also tracks whether the row contains any non-empty values and collects any errors that occur during the extraction and validation process. This is essential for ensuring that the data extracted from the Excel sheet is correctly formatted and validated before being processed further, such as for database insertion or updates.
 * - Future enhancements: Consider adding support for more complex data types (e.g. nested objects, arrays) and providing more flexible error handling options (e.g. error severity levels, error aggregation) to further improve the robustness and usability of row data extraction in different scenarios.
 */
const extractRowData = (row, columns, columnIndexMap, validationFunctions = []) => {
    const formattedRow = {};
    let hasValue = false;
    const rowErrors = [];
    // Iterate through each column configuration and extract the corresponding cell value from the row using the column index mapping. This allows for efficient access to the correct cells based on the defined column keys and their respective indices in the Excel sheet.
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
 * - row: the original row data object that contains the values to be inserted into the database, which may include fields defined in the column configuration as well as any additional fields required for insertion
 * - userId: the ID of the user performing the insertion, which is used to populate the audit fields (createdby and updatedby) in the formatted row. This allows for tracking of who created or updated the record in the database for auditing purposes.
 * - Returns: a new object that includes all the original row data along with additional audit fields (createdate, createdby, updatedate, updatedby) that are set appropriately for a new record insertion. The createdate is set to the current date and time, createdby is set to the provided userId, and updatedate and updatedby are set to null since this is a new record. This ensures that the row data is properly formatted for insertion into the database with all necessary audit information included.
 * - Note: This function formats a row of data for insertion into the database by adding audit fields that track when the record was created and by whom. It ensures that all necessary information is included in the formatted row for proper
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
 * - row: the original row data object that contains the values to be updated in the database, which may include fields defined in the column configuration as well as any additional fields required for updating
 * - userId: the ID of the user performing the update, which is used to populate the updatedby field in the formatted row. This allows for tracking of who updated the record in the database for auditing purposes.
 * - Returns: a new object that includes all the original row data along with updated audit fields (updatedate, updatedby) that are set appropriately for an update operation. The updatedate is set to the current date and time, and updatedby is set to the provided userId. This ensures that the row data is properly formatted for updating in the database with all necessary audit information included.
 * - Note: This function formats a row of data for updating in the database by adding audit fields that track when the record was updated and by whom. It ensures that all necessary information is included in the formatted row for proper handling during the update operation, allowing for accurate tracking of changes in the database.
 * - Future enhancements: Consider adding support for tracking previous values of updated fields for more comprehensive audit trails and providing options for conditional updates based on specific column configurations to further enhance the flexibility and robustness of update operations in the database.
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
 * - rows: an array of row data objects that need to be processed in batches, which may represent records to be inserted or updated in the database based on the defined column configurations and processing requirements
 * - batchSize: the number of rows to process in each batch, which helps manage memory usage and improve performance when handling large datasets by breaking the processing into smaller, more manageable chunks
 * - processor: an asynchronous function that takes a single row as input and performs the necessary processing (e.g. database insertion or update) for that row. This function should return a result indicating the success or failure of the processing for that row.
 * - onProgress: an optional callback function that is called after each batch is processed, providing information about the progress of the batch processing (e.g. number of rows processed, total rows, percentage completed). This allows for real-time feedback on the processing status, which can be useful for long-running operations.
 * - Returns: an object containing arrays of successful and failed results from processing the rows, as well as a count of the total number of rows processed. This allows for comprehensive tracking of the outcomes of the batch processing, enabling error handling and reporting
 * based on the results of each row's processing. The successful array contains the results of rows that were processed successfully, while the failed array contains details of rows that encountered errors during processing, including the error message and the index of the row in the original dataset. This structure provides a clear overview of the processing outcomes and allows for further analysis or retry logic based on the results.
 * - Note: This function processes an array of rows in batches, applying the provided processor function to each row while tracking successes and failures. It also provides progress updates through the onProgress callback, allowing for real-time feedback during long-running operations. The function is designed to handle large datasets efficiently while providing robust error tracking and reporting for each row processed.
 * - Future enhancements: Consider adding support for configurable retry logic for failed rows, allowing for automatic reprocessing of rows that encountered transient errors. Additionally, providing options for parallel processing of batches could further improve performance when handling very large datasets, while still maintaining comprehensive error tracking and progress reporting.
 */
const batchProcess = async (rows, batchSize, processor, onProgress) => {
    // Initialize results object to track successful and failed processing outcomes, as well as the total number of rows processed. This structure allows for comprehensive tracking of the processing results, enabling error handling and reporting based on the outcomes of each row's processing.
    const results = {
        successful: [],
        failed: [],
        totalProcessed: 0
    };

    // Process rows in batches to manage memory usage and improve performance. The function iterates through the rows array in increments of batchSize, creating batches of rows to be processed together. This approach helps to avoid overwhelming the system with too many operations at once, especially when dealing with large datasets.
    for (let i = 0; i < rows.length; i += batchSize) {
        // Create a batch of rows to process in the current iteration based on the defined batch size. This batch will be passed to the processor function for processing, allowing for efficient handling of the rows while maintaining manageable memory usage.
        const batch = rows.slice(i, i + batchSize);
        // Process each row in the batch using the provided processor function, which is expected to be asynchronous. The function uses a try-catch block to handle any errors that may occur during processing, allowing for robust error tracking and reporting for each row.
        for (const item of batch) {
            try {
                // Call the processor function for the current row and await its result. If the processing is successful, the result is added to the successful array in the results object. If an error occurs during processing, it is caught in the catch block, and details of the failure (including the original item, error message, and index) are added to the failed array in the results object. This allows for comprehensive tracking of both successful and failed processing outcomes for each row.
                const result = await processor(item);
                results.successful.push(result);
            } catch (error) {
                // Log the error for debugging purposes and add the failure details to the results object. This includes the original item that was being processed, the error message, and the index of the item in the original dataset. This information is crucial for analyzing failures and implementing retry logic or other error handling strategies based on the specific issues encountered during processing.
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
            // Provide progress updates through the onProgress callback, allowing for real-time feedback during long-running operations. The callback is called after each batch is processed, providing information about the number of rows processed, total rows, and percentage completed. This feedback can be useful for monitoring the status of the processing and providing user feedback in a UI or logging system.
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
 * - success: a boolean indicating whether the operation was successful or not, which is used to determine the overall status of the result being formatted
 * - data: an optional object containing any additional data or information related to the result, which can be included in the formatted result for further processing or reporting
 * - Returns: a standardized result object that includes the success status, a timestamp of when the result was generated, and any additional data provided. This format allows for consistent handling of results across different operations and provides useful metadata (such as the timestamp) for tracking and debugging purposes.
 * - Note: This function provides a generic way to format results from various operations in a consistent manner. By including a success flag, a timestamp, and any relevant data, it allows for easy integration with logging systems, APIs, or other components that need to consume and process results in a standardized format. This can help improve the maintainability and readability of code by providing a clear structure for result handling.
 * - Future enhancements: Consider adding support for additional metadata fields (e.g. error codes, user information) and providing options for customizing the result format
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
