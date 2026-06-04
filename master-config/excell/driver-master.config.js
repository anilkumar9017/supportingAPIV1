module.exports = {
    menuCode: 'driver-master',
    sheetName: 'Drivers',
    tableName: 'm_driver',
    primaryKey: 'id',
    uniqueKey: 'driverid',

    columns: [

        {
            header: 'Driver ID',
            key: 'driverid',
            type: 'text',
            required: true
        },

        {
            header: 'Driver Name',
            key: 'driver_name',
            type: 'text'
        },

        {
            header: 'Default Vehicle',
            key: 'default_vehicle',
            type: 'dropdown',
            dropdown: {
                sheetName: 'Vehicles',
                query: `select id, code from m_vehicle`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Driver Phone1',
            key: 'driver_phone1',
            type: 'text'
        },

        {
            header: 'Driver Phone2',
            key: 'driver_phone2',
            type: 'text'
        },

        {
            header: 'Turn Boy',
            key: 'turn_boy_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'TurnBoys',
                query: `select id, name from m_turnboy`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Driver Type',
            key: 'driver_type',
            type: 'text'
        },

        {
            header: 'Status Remarks',
            key: 'status_remarks',
            type: 'text'
        },

        {
            header: 'Status',
            key: 'status',
            type: 'text'
        },

        {
            header: 'Status Date',
            key: 'status_date',
            type: 'date'
        },

        {
            header: 'Branch',
            key: 'branch',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Branches',
                query: `select id, code from m_branch`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Default Vehicle Code',
            key: 'default_vehicle_code',
            type: 'text'
        },

        {
            header: 'Driver Attachments',
            key: 'driver_attachments',
            type: 'child_array',
            sheetName: 'Driver Attachments',
            tableName: 'm_driver_attachment',
            parentKey: 'parent_id',
            columns: [
                { header: 'Template', key: 'template', type: 'text' },
                { header: 'Template Base64', key: 'templatebase64', type: 'text' },
                { header: 'Mime Type', key: 'mime_type', type: 'text' },
                { header: 'File Name', key: 'file_name', type: 'text' },
                { header: 'File Extension', key: 'file_extension', type: 'text' },
                { header: 'Attachment Date', key: 'attachment_date', type: 'date' },
                { header: 'CDN URL', key: 'cdn_url', type: 'text' },
                { header: 'Is Mobile', key: 'is_mobile', type: 'text' },
                { header: 'User Name', key: 'user_name', type: 'text' }
            ]
        },

        {
            header: 'Driver Licenses',
            key: 'driver_licenses',
            type: 'child_array',
            sheetName: 'Driver Licenses',
            tableName: 'm_driver_license',
            parentKey: 'parent_id',
            columns: [
                { header: 'License Number', key: 'license_number', type: 'text' },
                { header: 'License Type', key: 'license_type', type: 'dropdown', dataType: 'text', width: 20, dropdown: { sheetName: 'License Types', query: 'select id, name from m_license_type', labelField: 'name', valueField: 'id' } },
                { header: 'Remark', key: 'remark', type: 'text' },
                { header: 'Issuing Agency', key: 'issuing_agency', type: 'text' },
                { header: 'Country', key: 'country', type: 'dropdown', dropdown: { sheetName: 'Countries', query: `select id, code from m_country`, labelField: 'code', valueField: 'id' } },
                { header: 'Effective Date', key: 'effective_date', type: 'date' },
                { header: 'Expired Date', key: 'expired_date', type: 'date' }
            ]
        },

        {
            header: 'Driver Vehicles',
            key: 'driver_vehicles',
            type: 'child_array',
            sheetName: 'Driver Vehicles',
            tableName: 'm_driver_vehicle',
            parentKey: 'parent_id',
            columns: [
                { header: 'Vehicle', key: 'vehId', type: 'dropdown', dropdown: { sheetName: 'DriverVehicles', query: `select id, code from m_vehicle`, labelField: 'code', valueField: 'id' } },
                { header: 'Vehicle Name', key: 'vehName', type: 'text' }
            ]
        }

    ]

};