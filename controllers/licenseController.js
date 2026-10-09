const db = require('../config/database');

async function getLicenseExpire(req, res) {
    try {
        const useApi = req.useApi || false;
        
        // Get database name from middleware (already resolved)
        const databaseName = req.databaseName;
        if (!databaseName) {
        return res.status(400).json({
            success: false,
            message: 'Database name not resolved'
        });
        }

        const query = `
        SELECT license_expiry_date, license_activated_at, license_status
        FROM m_initialize_company
        `;

        const result = await db.executeQuery(databaseName, query, {}, useApi);
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'License information not found'
            });
        }else {
            return res.status(200).json({
                success: true,
                data: result[0]
            });
        }
    }catch (error) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Internal server error'
        });
    }
}

module.exports = {
    getLicenseExpire
};
