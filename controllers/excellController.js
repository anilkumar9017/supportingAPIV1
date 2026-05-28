const excelService = require('../services/excell/excell.service');
const generateHierarchicalExcel = require('../services/excell/excell-hierarchical.service');

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

/* 
    
*/
async function importExcel(req, res) {
    try {
        const { menuCode } = req.body;
        const useApi = req.useApi || false;
        const userObj = req?.user;
        const databaseName = req.databaseName;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required.'
            });
        }

        const result = await excelService.importExcel({menuCode, file, db, databaseName: databaseName, useApi: useApi, userObj});
        if(result?.errors){
            return res.status(200).json({
                success: false,
                message: 'Import faild.',
                errors: result?.errors
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Import completed.',
            data: result,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function exportHierarchicalExcel(req, res) {
    try {
        const { menuCode, mode, filters} = req.body;
        const useApi = req.useApi || false;
        const databaseName = req.databaseName;
        const workbook = await generateHierarchicalExcel.generateHierarchicalExcel(menuCode, mode, db, databaseName, useApi, filters);
        
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

async function importHierarchicalExcel(req, res) {
    try {
        const { menuCode } = req.body;
        const useApi = req.useApi || false;
        const userObj = req?.user;
        const databaseName = req.databaseName;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required.'
            });
        }

        const result = await generateHierarchicalExcel.importHierarchicalExcel(menuCode, file, db, databaseName, useApi, userObj);
        const mainErrors = result?.main?.errors || [];
        const childErrors = [];
        if (result?.children && typeof result.children === 'object') {
            Object.values(result.children).forEach(childResult => {
                if (childResult && Array.isArray(childResult.errors) && childResult.errors.length > 0) {
                    childErrors.push(...childResult.errors);
                }
            });
        }
        if (mainErrors.length > 0 || childErrors.length > 0 || result?.success === false) {
            const errors = mainErrors.length > 0 ? mainErrors : childErrors.length > 0 ? childErrors : result.errors || [{ message: 'Import failed' }];
            return res.status(400).json({
                success: false,
                message: 'Import failed.',
                errors
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Import completed.',
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    exportExcel,
    importExcel,
    exportHierarchicalExcel,
    importHierarchicalExcel
};