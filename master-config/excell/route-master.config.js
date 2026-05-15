module.exports = {
    menuCode: 'route-master',
    sheetName: 'Routes',
    tableName: 'm_route',
    primaryKey: 'id',
    uniqueKey: 'code',
    columns: [
        {
            header: 'Code',
            key: 'code',
            type: 'text',
            required: true
        },
        {
            header: 'Name',
            key: 'name',
            type: 'text'
        },
        {
            header: 'Cost Center',
            key: 'costcenter',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'CostCenter',
                query: `select id, name from m_costcenters`,
                labelField: 'name',
                valueField: 'id'
            }
        },
        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Trip Type',
            key: 'triptype',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'TripType',
                labelField: 'name',
                valueField: 'code',
                options: [
                    {code: 'T', name: 'Transit' },
                    {code: 'L', name: 'Local' },
                    {code: 'U', name: 'UpCountry' },
                    {code: 'A', name: 'All' },
                ]
            } 
        },

        {
            header: 'Origin',
            key: 'origin_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Origins',
                query: `select id, name from m_fm_location`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Destination',
            key: 'destination_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Origins',
                query: `select id, name from m_fm_location`,
                labelField: 'name',
                valueField: 'id'
            }
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
            header: 'Item Code',
            key: 'itemcode',
            type: 'text',
        },

        {
            header: 'Trip Rate',
            key: 'triprate',
            type: 'number'
        },

        {
            header: 'Currency',
            key: 'currency',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Currencies',
                query: `select id, cur_code from m_currencies`,
                labelField: 'cur_code',
                valueField: 'id'
            }
        },
        {
            header: 'Account',
            key: 'account_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },
        {
            header: 'Revenue Account',
            key: 'revenue_account',
            type: 'text'
        },

        {
            header: 'Return Load Bonus',
            key: 'return_load_bonus',
            type: 'number'
        },

        {
            header: 'Distance',
            key: 'distance',
            type: 'number'
        },

        {
            header: 'Estimated Trip Days',
            key: 'estimated_tripdays',
            type: 'number'
        },

        {
            header: 'Estimated Trip Hours',
            key: 'estimated_triphours',
            type: 'number'
        },

        {
            header: 'Road Type',
            key: 'road_type',
            type: 'text'
        },

        {
            header: 'Via',
            key: 'via',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Origins',
                query: `select id, name from m_fm_location`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Fuel Ratio',
            key: 'fuel_ratio',
            type: 'number'
        },

        {
            header: 'Base Rate',
            key: 'baserate',
            type: 'number'
        },

        {
            header: 'Exit Point',
            key: 'exit_point',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Origins',
                query: `select id, name from m_fm_location`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Additional Fuel',
            key: 'additional_fuel',
            type: 'number'
        },

        {
            header: 'KM Check',
            key: 'km_check',
            type: 'text'
        },

        {
            header: 'Hours Per Day',
            key: 'hours_perday',
            type: 'number'
        },

        {
            header: 'Tolerance Limit',
            key: 'tolerance_limit',
            type: 'number'
        },

        {
            header: 'Route Expenses',
            key: 'route_expenses',
            type: 'child_array',
            sheetName: 'Route Expenses',
            tableName: 'm_route_expenses',
            parentKey: 'parent_id',
            columns: [
                { header: 'ID', key: 'id', type: 'number', width: 10 },
                { header: 'Vehicle Type', key: 'vehicle_type', type: 'dropdown', dataType: 'number', width: 15, dropdown: { sheetName: 'Vehicle Types', query: 'select id, name from m_vehicle_type', labelField: 'name', valueField: 'id' } },
                { header: 'Commodity', key: 'commodity', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Commodity', query: `select id, name from m_commodity_type`, labelField: 'name', valueField: 'id' } },
                { header: 'Border', key: 'border', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Origins', query: `select id, name from m_fm_location`, labelField: 'name', valueField: 'id' } },
                { header: 'Expense', key: 'expense_id', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Expenses', query: `select id, expense_name from m_trip_expenses`, labelField: 'expense_name', valueField: 'id' } },
                { header: 'Expense Details', key: 'expense_name', type: 'text' },
                { header: 'Fund Account', key: 'fund_account', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'TripFundAccount', query: `select id, name from m_fm_trip_fund_account`, labelField: 'name', valueField: 'id' } },
                { header: 'Doc Type', key: 'doctype', type: 'dropdown', data_type: 'text', dropdown: { sheetName: 'TargetDocument', labelField: 'name', valueField: 'id', options: [{"id": "17", "name": "Sales Order"},{"id": "22", "name": "Purchase Order"},{"id": "20", "name": "Goods Receipt PO"},{"id": "18", "name": "A/P Invoice"},{"id": "46", "name": "Outgoing Payment"},{"id": "24", "name": "Incoming Payment"},{"id": "60", "name": "Goods Issue"},{"id": "59", "name": "Goods Receipt"},{"id": "19", "name": "A/P Credit Memo"},{"id": "30", "name": "Journal Entry"},{"id": "1200", "name": "Fuel Log Book"}] } },
                { header: 'Quantity', key: 'quantity', type: 'number' },
                { header: 'Unit Price', key: 'unitprice', type: 'number' },
                { header: 'Currency', key: 'currency', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Currencies', query: `select id, cur_code from m_currencies`, labelField: 'cur_code', valueField: 'id' } },
                { header: 'Total Amount', key: 'total_amount', type: 'number' },
                { header: 'Remarks', key: 'remarks', type: 'text' },
                { header: 'Account Type', key: 'account_type', type: 'dropdown', data_type: 'text', dropdown: { sheetName: 'AccountType', labelField: 'name', valueField: 'code', options: [{name: 'BP', code: '1'}, {name: 'GL', code: '2'}] } },
                { header: 'Supplier', key: 'cardcode', type: 'dropdown', dataType: 'text', width: 30, dropdown: { sheetName: 'Supplier', query: "select id, card_code from m_customer where card_type = 'S'", labelField: 'card_code', valueField: 'id' } },
                { header: 'Supplier Name', key: 'cardname', type: 'text' },
                { header: 'Employee', key: 'employee_id', type: 'dropdown', dropdown: { sheetName: 'Employees', query: `SELECT e.id, e.first_name +' '+e.last_name as name FROM m_employee e JOIN m_emp_position p ON e.position = p.id WHERE p.is_driver = 'Y'`, labelField: 'name', valueField: 'id' } }
            ]
        },

        {
            header: 'Route Licenses',
            key: 'route_licenses',
            type: 'child_array',
            sheetName: 'Route Licenses',
            tableName: 'm_route_licenses',
            parentKey: 'parent_id',
            columns: [
                { header: 'ID', key: 'id', type: 'number', width: 10 },
                { header: 'Vehicle Class', key: 'vehicle_class', type: 'dropdown', dataType: 'number', width: 20, dropdown: { sheetName: 'VehicleClass', query: 'select id, name from m_fm_vehicle_class', labelField: 'name', valueField: 'id' } },
                { header: 'License', key: 'license_id', type: 'dropdown', dataType: 'number', width: 20, dropdown: { sheetName: 'License Types', query: 'select id, name from m_license_type', labelField: 'name', valueField: 'id' } },
                { header: 'Paid From Account', key: 'paidfrom_account', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'TripFundAccount', query: `select id, name from m_fm_trip_fund_account`, labelField: 'name', valueField: 'id' } },
                { header: 'Quantity', key: 'quantity', type: 'number' },
                { header: 'License Cost', key: 'license_cost', type: 'number' },
                { header: 'Validity', key: 'validity', type: 'number' },
                { header: 'Currency', key: 'currency', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Currencies', query: `select id, cur_code from m_currencies`, labelField: 'cur_code', valueField: 'id' } },
                { header: 'Remarks', key: 'remarks', type: 'text' }
            ]
        },

        {
            header: 'Route Stops',
            key: 'route_stops',
            type: 'child_array',
            sheetName: 'Route Stops',
            tableName: 'm_route_stops',
            parentKey: 'parent_id',
            columns: [
                { header: 'ID', key: 'id', type: 'number', width: 10 },
                { header: 'Sequence No', key: 'sequence_no', type: 'number' },
                { header: 'Location', key: 'location_id', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'Origins', query: `select id, name from m_fm_location`, labelField: 'name', valueField: 'id' } },
                { header: 'Stop Type', key: 'stop_type_id', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'StopsType', query: `select id, name from m_fm_stoptypes`, labelField: 'name', valueField: 'id' } },
                { header: 'Distance', key: 'distance', type: 'number' },
                { header: 'Min Stop Hours', key: 'min_stop_hrs', type: 'number' },
                { header: 'Max Stop Hours', key: 'max_stop_hrs', type: 'number' },
                { header: 'Days To Reach', key: 'days_to_reach', type: 'number' }
            ]
        }

    ]

};