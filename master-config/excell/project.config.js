module.exports = {
    menuCode: 'project',
    sheetName: 'Projects',
    tableName: 'm_projects',

    columns: [
        {
            header: 'Code',
            key: 'code',
            type: 'text',
            width: 30,
            required: true
        },

        {
            header: 'Name',
            key: 'name',
            type: 'text',
            width: 30
        },

        {
            header: 'Valid From',
            key: 'valid_from',
            type: 'date',
            width: 30
        },

        {
            header: 'Valid To',
            key: 'valid_to',
            type: 'date',
            width: 30
        },

        {
            header: 'Lock',
            key: 'locked',
            type: 'checkbox',
            values: ['Y', 'N'],
            width: 20
        },

        {
            header: 'File',
            key: 'file_id',
            type: 'dropdown',
            width: 30,
            dropdown: {
                sheetName: 'File',
                query: `select id, doc_num from d_cf_filemaster`,
                valueField: 'doc_num'
            }
        },

        {
            header: 'Shipment',
            key: 'shipment_order_id',
            type: 'dropdown',
            width: 30,
            dropdown: {
                sheetName: 'Shipment',
                query: `select id, doc_num from d_fm_shipmentorder`,
                valueField: 'doc_num'
            }
        },

        {
            header: 'Vehicle',
            key: 'vehicle_id',
            type: 'dropdown',
            width: 30,

            dropdown: {
                sheetName: 'Vehicles',
                query: `select id, code from m_vehicle`,
                valueField: 'code'
            }
        }
    ]
};