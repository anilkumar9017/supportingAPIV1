
const ExcelJs = require('exceljs');
const configs = require('../../master-config/index');

const {validateDate, validateRequired, validateCheckbox, validateDuplicateExcel, mappedDropdown} = require('../excell/validation.service');
const {insertRecord,updateRecord} = require('../excell/bulk.service');
const mssql = require('mssql');

const db = require('../../config/database');
const axios = require('axios');
const moment = require('moment');





async function generateExcel({menuCode, mode, db, databaseName, useApi}) {

    const config = configs[menuCode];
    //console.log("configs ", configs);
    if (!config) {
        throw new Error('Invalid menu code.');
    }

    const workbook = new ExcelJs.Workbook();

    const worksheet = workbook.addWorksheet(config.sheetName);

    /*
    ===========================================================
    MAIN COLUMNS
    ===========================================================
    */

    worksheet.columns = config.columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 25
    }));

    worksheet.getRow(1).font = {
        bold: true
    };

    /*
    ===========================================================
    MODES
    ===========================================================
    */

    /*
    TEMPLATE MODE
    */

    if (mode === 'template') {

        // no data rows
    }

    /*
    DUMMY MODE
    */

    if (mode === 'dummy') {

        const sampleRow = {};

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
    }

    /*
    ACTUAL EXPORT MODE
    */

    if (mode === 'export') {
        const selectedColumns =  config.columns.map(c => c.key).join(', ');
        const query = `select ${selectedColumns} from ${config.tableName}`;
        const data = await db.executeQuery(databaseName, query, {}, useApi);
        //console.log("data ", data);
        
        data.forEach(row => {
            const formattedRow = {};
            config.columns.forEach(col => {
                let value = row[col.key];
                /*
                DATE FORMATTING
                */
                if (col.type === 'date') {
                    value = value ? new Date(value) : null;
                }
                /*
                NULL SAFETY
                */
                if (value === undefined) {
                    value = '';
                }
                formattedRow[col.key] = value;
            });
        
            worksheet.addRow(formattedRow);
        });
    }


    /*
    ===========================================================
    DROPDOWN SHEETS
    ===========================================================
    */

    for (const col of config.columns) {

        if (col.type === 'dropdown') {

            const dropdownResult = await db.executeQuery(
                databaseName,
                col.dropdown.query,
                {},
                useApi
            );

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

            for (let i = 2; i < 1000; i++) {

                const columnIndex =
                    config.columns.findIndex(
                        c => c.key === col.key
                    ) + 1;

                const excelColumn =
                    worksheet.getColumn(columnIndex).letter;

                worksheet.getCell(
                    `${excelColumn}${i}`
                ).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [
                        `=${col.dropdown.sheetName}!$A$2:$A$${totalRows}`
                    ]
                };
            }
        }

        /*
        =======================================================
        CHECKBOX VALIDATION
        =======================================================
        */

        if (col.type === 'checkbox') {

            for (let i = 2; i < 1000; i++) {

                const columnIndex =
                    config.columns.findIndex(
                        c => c.key === col.key
                    ) + 1;

                const excelColumn =
                    worksheet.getColumn(columnIndex).letter;

                worksheet.getCell(
                    `${excelColumn}${i}`
                ).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [
                        `"${col.values.join(',')}"`
                    ]
                };
            }
        }

        /* 
            Date Fields
        */
        if (col.type === 'date') {

            for (let i = 2; i < 1000; i++) {
        
                const columnIndex =
                    config.columns.findIndex(
                        c => c.key === col.key
                    ) + 1;
        
                const excelColumn =
                    worksheet.getColumn(columnIndex).letter;
        
                const cell =
                    worksheet.getCell(`${excelColumn}${i}`);
        
                cell.dataValidation = {
                    type: 'date',
                    operator: 'greaterThan',
                    allowBlank: true,
                    showErrorMessage: true,
                    errorTitle: 'Invalid Date',
                    error: 'Please enter a valid date.'
                };
        
                cell.numFmt = 'yyyy-mm-dd';
            }
        }
    }

    
    /*
    ===========================================================
    FREEZE HEADER
    ===========================================================
    */

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 1
        }
    ];

    /*
    ===========================================================
    AUTO FILTER
    ===========================================================
    */

    worksheet.autoFilter = {
        from: 'A1',
        to: `${worksheet.getColumn(worksheet.columnCount).letter}1`
    };

    console.log(
        'worksheet row count',
        worksheet.rowCount
     );

    return workbook;
}

/* 

*/
async function importExcel({menuCode, file, db, databaseName, useApi, userObj}) {
  /* CONFIG */
  const config = configs[menuCode];

  if (!config) {
    throw new Error("Invalid menu code.");
  }

  /*
    LOAD WORKBOOK
  */
  const workbook = new ExcelJs.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.getWorksheet(config.sheetName);
  if (!worksheet) {
    throw new Error(`Sheet '${config.sheetName}' not found.`);
  }

  /* VARIABLES */
  const rows = [];
  const errors = [];
  const duplicateSet = new Set();
  const dropdownMappings = {};

    //get dropdown mappings
    for (const col of config.columns) {
        if (col.type === 'dropdown') {
            const result = await db.executeQuery(databaseName, col.dropdown.query, {}, useApi);
            dropdownMappings[col.key] = {};
            result.forEach(item => {
                const id = item[col.dropdown.valueField];
                const label = item[col.dropdown.labelField];
                dropdownMappings[col.key][label] = id;
            });
        }
    }


  /*  READ EXCEL ROWS */
  worksheet.eachRow((row, rowNumber) => {
    /* SKIP HEADER */
    if (rowNumber === 1) {
      return;
    }

    const rowData = {};
    let hasValue = false;
    
    /*
       READ COLUMNS
    */
    config.columns.forEach((col, index) => {
      const cell = row.getCell(index + 1);
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
    if (config.uniqueKey && rowData[config.uniqueKey]) {
      validateDuplicateExcel({
        duplicateSet,
        value: rowData[config.uniqueKey],
        rowNumber,
        errors,
      });
    }

    /* SKIP EMPTY ROWS */
    if (hasValue) {
      rows.push(rowData);
    }
  });

  /* VALIDATION ERRORS */
  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  /* FETCH EXISTING RECORDS*/
  const uniqueValues = rows.map((r) => r[config.uniqueKey]);
  let existingMap = new Map();
  if (uniqueValues.length > 0) {
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
  }

  /*
    =====================================================
    START TRANSACTION
    =====================================================
  */
  const pool = await db.getConnection(databaseName, useApi);
  const transaction = new mssql.Transaction(pool);
  await transaction.begin();

  /*
    =====================================================
    INSERT / UPDATE
    =====================================================
  */
  let createdCount = 0;
  let updatedCount = 0;
  try {
    for (const row of rows) {
      const uniqueValue = row[config.uniqueKey];
      const existing = existingMap.get(uniqueValue);

      /* UPDATE */
      if (existing) {
        row.updatedate = new Date();
        row.updatedby = Number(userObj?.userid) || 0;
        delete row.createdate;
        delete row.createdby;

        await updateRecord({transaction, db, databaseName, tableName: config.tableName, row, id: existing[config.primaryKey || "id"],});

        updatedCount++;
      } else {
        /* INSERT */
        row.createdate = new Date();
        row.createdby = Number(userObj?.userid) || 0;
        row.updatedate = null;
        row.updatedby = null;

        await insertRecord({ transaction, db, databaseName, tableName: config.tableName, row, useApi,});

        createdCount++;
      }
    }

    /*COMMIT*/
    await transaction.commit();
  } catch (error) {
    /* ROLLBACK */
    await transaction.rollback();
    console.log("error ", error);
    return {
        success: false,
        error: error,
    }
  }

  return {
    success: true,
    totalRows: rows.length,
    created: createdCount,
    updated: updatedCount,
    failed: errors.length,
  };
}

module.exports = {
    generateExcel,
    importExcel
};