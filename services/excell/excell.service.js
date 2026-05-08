
const ExcelJs = require('exceljs');
const configs = require('../../master-config/index');

const db = require('../../config/database');
const axios = require('axios');

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
                    value: item[col.dropdown.valueField]
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

module.exports = {
    generateExcel
};