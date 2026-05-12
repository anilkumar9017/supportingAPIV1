module.exports = {

    menuCode: 'maintenance-type',

    sheetName: 'Maintenance Type',

    tableName: 'm_maintenance',

    primaryKey: 'id',

    uniqueKey: 'name',

    columns: [

        {
            header: 'Name',
            key: 'name',
            type: 'text',
            required: true
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        }

    ]

};