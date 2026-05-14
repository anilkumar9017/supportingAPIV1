module.exports = {

    menuCode: 'checklist-setup',

    sheetName: 'Checklist',

    tableName: 'm_checklist',

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
            header: 'Part',
            key: 'part_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Parts',
                query: `select id, name from m_part_type`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Maintenance',
            key: 'maintenance_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Maintenances',
                query: `select id, name from m_maintenance_type`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Measurement Required',
            key: 'measuremen_required',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Show In Return Checklist',
            key: 'show_in_return_checklist',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Applicable For',
            key: 'applicable_for',
            type: 'number'
        },

        {
            header: 'Show In CFS Maintenance',
            key: 'show_in_cfs_maintenance',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        /* {
            header: 'Job Time Required',
            key: 'job_time_required',
            type: 'time'
        } */

    ]

};