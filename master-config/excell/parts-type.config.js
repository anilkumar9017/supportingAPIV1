module.exports = {

    menuCode: 'parts-type',

    sheetName: 'Parts Types',

    tableName: 'm_part_type',

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
        },

        {
            header: 'Is Position Required',
            key: 'is_position_req',
            type: 'checkbox',
            values: ['Y', 'N']
        }

    ]

};