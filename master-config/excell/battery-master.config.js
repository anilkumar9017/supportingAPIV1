module.exports = {
    menuCode: 'battery-master',
    sheetName: 'Batteries',
    tableName: 'm_battery_master',
    primaryKey: 'id',
    uniqueKey: 'battery_no',

    columns: [
        {
            header: 'Vehicle',
            key: 'vehicle_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Vehicles',
                query: `select id, code from m_vehicle`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Vehicle Code',
            key: 'vehicle_code',
            type: 'text'
        },

        {
            header: 'Vehicle Name',
            key: 'vehicle_name',
            type: 'text'
        },

        {
            header: 'Vehicle Type',
            key: 'vehicle_type',
            type: 'number'
        },

        {
            header: 'Fitment Date',
            key: 'fitment_date',
            type: 'date'
        },

        {
            header: 'Technician',
            key: 'technician_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Technicians',
                query: `SELECT e.id, e.first_name+' '+e.middle_name+' '+e.last_name as name FROM m_employee e JOIN m_emp_position p ON e.position = p.id WHERE p.is_mechanic = 'Y'`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Technician Name',
            key: 'technician_name',
            type: 'text'
        },

        {
            header: 'Opening Kms',
            key: 'opening_kms',
            type: 'number'
        },

        {
            header: 'Battery Type',
            key: 'battery_type',
            type: 'text'
        },

        {
            header: 'Battery Capacity',
            key: 'battery_capicity',
            type: 'text'
        },

        {
            header: 'Remark',
            key: 'remark',
            type: 'text'
        },

        {
            header: 'Status',
            key: 'status',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Status',
                labelField: 'name',
                valueField: 'id',
                options: [{"id": "1", "name": "Active"},{"id": "2", "name": "In-Active"},{"id": "3", "name": "Disposed"}]
            }
        },

        {
            header: 'Battery No',
            key: 'battery_no',
            type: 'text',
            required: true
        },

        {
            header: 'Serial No',
            key: 'serial_no',
            type: 'text'
        },

        {
            header: 'Driver',
            key: 'driver_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Drivers',
                query: `select id, driver_name from m_driver`,
                labelField: 'driver_name',
                valueField: 'id'
            }
        },

        {
            header: 'Warranty Months',
            key: 'warranty_months',
            type: 'number'
        },

        {
            header: 'Purchase Date',
            key: 'purchase_date',
            type: 'date'
        },

        {
            header: 'Brand',
            key: 'brand',
            type: 'text'
        },

        {
            header: 'Vendor',
            key: 'vendor_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Vendors',
                query: `select id, card_code from m_customer where card_type = 'S'`,
                labelField: 'card_code',
                valueField: 'id'
            }
        },

        {
            header: 'Vendor Code',
            key: 'vendor_code',
            type: 'text'
        },

        {
            header: 'Vendor Name',
            key: 'vendor_name',
            type: 'text'
        },

        {
            header: 'Inspection Period',
            key: 'inspection_period',
            type: 'number'
        },

        {
            header: 'Item',
            key: 'item_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Items',
                query: `select id, item_code from m_item`,
                labelField: 'item_code',
                valueField: 'id'
            }
        },

        {
            header: 'log_inst',
            key: 'log_inst',
            type: 'number',
            width: 15
        }
    ]
};
