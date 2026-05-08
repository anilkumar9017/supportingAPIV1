const excelService = require('../services/excell/excell.service');
const db = require('../config/database');

async function exportExcel(req, res) {
    try {
        const {menuCode, mode} = req.body;

        const useApi = req.useApi || false;
        const databaseName = req.databaseName;

        const workbook = await excelService.generateExcel({menuCode, mode, db, databaseName, useApi});
        
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${menuCode}-${mode}.xlsx"`
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    exportExcel
};