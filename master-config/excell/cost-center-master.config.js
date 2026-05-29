module.exports = {

    menuCode: 'cost-center',

    sheetName: 'Cost Center',

    tableName: 'm_costcenters',

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
            header: 'Dimesion',
            key: 'dimension_id',
            type: 'dropdown',
            dropdown: {
                sheetName: 'Dimension',
                query: `select id, name from m_dimensions`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        }

    ]

};