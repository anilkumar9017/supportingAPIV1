const db = require('../config/database');
const axios = require('axios');
const ExcelJs = require('exceljs');

async function exportDummyExcell(req, res) {
    try {
        const useApi = req.useApi || false;
        const databaseName = req.databaseName;
        const query = `select id, code from m_vehicle`;
        const result = await db.executeQuery(databaseName, query, {}, useApi);
        if(result?.length==0 || !result){
            return res.status(400).json({
                success: false,
                message: 'Result not found.'
            });
        }

        const vehicles = result;
        
        const workBook = new ExcelJs.Workbook();

        // Main sheet
        const workSheet = workBook.addWorksheet('Projects');

        // Reference sheet
        const vehicleSheet = workBook.addWorksheet('Vehicles');

        // Hide reference sheet
        vehicleSheet.state = 'hidden';

        // Vehicle list
        vehicleSheet.columns = [
            { header: "Vehicle Name", key: 'name', width: 30 }
        ];

        //vehicle columns value
        vehicles.forEach((v) => {
            vehicleSheet.addRow({ name: v.code });
        });

        // Main sheet columns
        workSheet.columns = [
            { header: 'Code', key: 'code', width: 30 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Lock', key: 'lock', width: 20 },
            { header: 'Vehicle', key: 'vehicle_id', width: 30 }
        ];

        // Sample row
        workSheet.addRow({
            code: "TEMS",
            name: "Sample Sheet",
            lock: "Y",
            vehicle_id: "AUDI"
        });

        // Header style
        workSheet.getRow(1).font = { bold: true };

        const totalVehicles = vehicles.length + 1;

        // Dropdown validations
        for (let i = 2; i < 1000; i++) {
            // Lock dropdown (Column C)
            workSheet.getCell(`C${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"Y,N"']
            };

            // Vehicle dropdown (Column D)
            workSheet.getCell(`D${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`=Vehicles!$A$2:$A$${totalVehicles}`]
            };
        }

        // Response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="projects-template.xlsx"'
        );

        await workBook.xlsx.write(res);

        res.end();

    } catch (error) {
        console.error("error", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    exportDummyExcell
}