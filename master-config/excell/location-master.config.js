module.exports = {
    menuCode: 'location-master',
    sheetName: 'Locations',
    tableName: 'm_fm_location',
    primaryKey: 'id',
    uniqueKey: 'code',
    columns: [
        { header: 'Code', key: 'code', type: 'text', required: true },

        { header: 'Name', key: 'name', type: 'text' },

        { header: 'Location Type', key: 'location_type', type: 'number' },

        {
            header: 'Organization Name',
            key: 'organization_name',
            type: 'text'
        },

        {
            header: 'Location Alias',
            key: 'location_alias',
            type: 'text'
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Address',
            key: 'address',
            type: 'text'
        },

        {
            header: 'Street',
            key: 'street',
            type: 'text'
        },

        {
            header: 'Block',
            key: 'block',
            type: 'text'
        },

        {
            header: 'Zipcode',
            key: 'zipcode',
            type: 'text'
        },

        {
            header: 'City',
            key: 'city',
            type: 'text'
        },

        {
            header: 'County',
            key: 'county',
            type: 'text'
        },

        {
            header: 'Country',
            key: 'country',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Countries',
                query: `select id, code from m_country`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'State',
            key: 'state',
            type: 'text'
        },

        {
            header: 'Longitude',
            key: 'longitude',
            type: 'text'
        },

        {
            header: 'Latitude',
            key: 'latitude',
            type: 'text'
        },

        {
            header: 'Border',
            key: 'border',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Zone',
            key: 'zone',
            type: 'text'
        },

        {
            header: 'Is Geo Fence',
            key: 'is_geo_fence',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is CFS',
            key: 'is_cfs',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is ICD',
            key: 'is_icd',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is WHS',
            key: 'is_whs',
            type: 'checkbox',
            values: ['Y', 'N']
        }

    ],

    childSheets: [

        {

            sheetName: 'Location Contacts',

            tableName: 'm_fm_location_contacts',

            parentKey: 'parent_id',

            referenceColumn: 'Location Code',

            columns: [

                {
                    header: 'Location Code',
                    key: 'parent_code',
                    type: 'reference'
                },
                { header: 'ID', key: 'id', type: 'number', width: 10 },
                {
                    header: 'Title',
                    key: 'title',
                    type: 'dropdown',
                    data_type: 'text',
                    dropdown: {
                        sheetName: 'Title',
                        labelField: 'name',
                        valueField: 'id',
                        options: [{id: 'Mr', name: 'Mr'}, {id: 'Mrs', name: 'Mrs'}, {id: 'Ms', name: 'Ms'}, {id: 'Mx', name: 'Mx'}],
                    } 
                },

                {
                    header: 'Name',
                    key: 'name',
                    type: 'text'
                },

                {
                    header: 'Position',
                    key: 'position',
                    type: 'text'
                },

                {
                    header: 'Tel1',
                    key: 'tel1',
                    type: 'text'
                },

                {
                    header: 'Tel2',
                    key: 'tel2',
                    type: 'text'
                },

                {
                    header: 'Mobile',
                    key: 'mobile',
                    type: 'text'
                },

                {
                    header: 'Fax',
                    key: 'fax',
                    type: 'text'
                },

                {
                    header: 'E Mail',
                    key: 'e_mail',
                    type: 'text'
                },

                {
                    header: 'Remarks',
                    key: 'remarks',
                    type: 'text'
                }

            ]

        },

        {

            sheetName: 'Location User Groups',

            tableName: 'm_fm_location_user_group',

            parentKey: 'parent_id',

            referenceColumn: 'Location Code',

            columns: [

                {
                    header: 'Location Code',
                    key: 'parent_code',
                    type: 'reference'
                },
                { header: 'ID', key: 'id', type: 'number', width: 10 },
                {
                    header: 'User Group',
                    key: 'user_group_id',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'UserGroups',
                        query: `select id, code from m_user_groups`,
                        labelField: 'code',
                        valueField: 'id'
                    }
                }

            ]

        }

    ]

};