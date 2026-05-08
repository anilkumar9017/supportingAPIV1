module.exports = {
    menuCode: 'vehicle-master',
    sheetName: 'Vehicle Master',
    tableName: 'm_vehicle',

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