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
            type: 'text'
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
            type: 'text'
        },

        {
            header: 'Origin',
            key: 'origin_id',
            type: 'dropdown',

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

            dropdown: {
                sheetName: 'Destinations',
                query: `select id, name from m_fm_location`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Item',
            key: 'item_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Items',
                query: `select id, itemcode from m_item`,
                labelField: 'itemcode',
                valueField: 'id'
            }
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

            dropdown: {
                sheetName: 'Currencies',
                query: `select id, code from m_currency`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Revenue Account',
            key: 'revenue_account',
            type: 'text'
        },

        {
            header: 'Account',
            key: 'account_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Accounts',
                query: `select id, account_name from m_account`,
                labelField: 'account_name',
                valueField: 'id'
            }
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
            type: 'number'
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
            type: 'number'
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
        }

    ],

    childSheets: [

        {

            sheetName: 'Route Expenses',

            tableName: 'm_route_expenses',

            parentKey: 'parent_id',

            referenceColumn: 'Route Code',

            columns: [

                {
                    header: 'Route Code',
                    key: 'parent_code',
                    type: 'reference'
                },

                {
                    header: 'Vehicle Type',
                    key: 'vehicle_type',
                    type: 'number'
                },

                {
                    header: 'Commodity',
                    key: 'commodity',
                    type: 'number'
                },

                {
                    header: 'Border',
                    key: 'border',
                    type: 'number'
                },

                {
                    header: 'Expense',
                    key: 'expense_id',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'Expenses',
                        query: `select id, expense_name from m_expense`,
                        labelField: 'expense_name',
                        valueField: 'id'
                    }
                },

                {
                    header: 'Fund Account',
                    key: 'fund_account',
                    type: 'number'
                },

                {
                    header: 'Doc Type',
                    key: 'doctype',
                    type: 'text'
                },

                {
                    header: 'Quantity',
                    key: 'quantity',
                    type: 'number'
                },

                {
                    header: 'Unit Price',
                    key: 'unitprice',
                    type: 'number'
                },

                {
                    header: 'Currency',
                    key: 'currency',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'ExpenseCurrencies',
                        query: `select id, code from m_currency`,
                        labelField: 'code',
                        valueField: 'id'
                    }
                },

                {
                    header: 'Total Amount',
                    key: 'total_amount',
                    type: 'number'
                },

                {
                    header: 'Remarks',
                    key: 'remarks',
                    type: 'text'
                },

                {
                    header: 'Card Code',
                    key: 'cardcode',
                    type: 'text'
                },

                {
                    header: 'Card Name',
                    key: 'cardname',
                    type: 'text'
                },

                {
                    header: 'Account Type',
                    key: 'account_type',
                    type: 'text'
                },

                {
                    header: 'Employee',
                    key: 'employee_id',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'Employees',
                        query: `select id, employee_name from m_employee`,
                        labelField: 'employee_name',
                        valueField: 'id'
                    }
                }

            ]

        },

        {

            sheetName: 'Route Licenses',

            tableName: 'm_route_licenses',

            parentKey: 'parent_id',

            referenceColumn: 'Route Code',

            columns: [

                {
                    header: 'Route Code',
                    key: 'parent_code',
                    type: 'reference'
                },

                {
                    header: 'Sequence No',
                    key: 'sequence_no',
                    type: 'number'
                },

                {
                    header: 'Vehicle Class',
                    key: 'vehicle_class',
                    type: 'number'
                },

                {
                    header: 'License',
                    key: 'license_id',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'Licenses',
                        query: `select id, name from m_license`,
                        labelField: 'name',
                        valueField: 'id'
                    }
                },

                {
                    header: 'Paid From Account',
                    key: 'paidfrom_account',
                    type: 'number'
                },

                {
                    header: 'Quantity',
                    key: 'quantity',
                    type: 'number'
                },

                {
                    header: 'License Cost',
                    key: 'license_cost',
                    type: 'number'
                },

                {
                    header: 'Validity',
                    key: 'validity',
                    type: 'number'
                },

                {
                    header: 'Currency',
                    key: 'currency',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'LicenseCurrencies',
                        query: `select id, code from m_currency`,
                        labelField: 'code',
                        valueField: 'id'
                    }
                },

                {
                    header: 'Remarks',
                    key: 'remarks',
                    type: 'text'
                }

            ]

        },

        {

            sheetName: 'Route Stops',

            tableName: 'm_route_stops',

            parentKey: 'parent_id',

            referenceColumn: 'Route Code',

            columns: [

                {
                    header: 'Route Code',
                    key: 'parent_code',
                    type: 'reference'
                },

                {
                    header: 'Sequence No',
                    key: 'sequence_no',
                    type: 'number'
                },

                {
                    header: 'Location',
                    key: 'location_id',
                    type: 'dropdown',

                    dropdown: {
                        sheetName: 'StopLocations',
                        query: `select id, name from m_fm_location`,
                        labelField: 'name',
                        valueField: 'id'
                    }
                },

                {
                    header: 'Stop Type',
                    key: 'stop_type_id',
                    type: 'number'
                },

                {
                    header: 'Distance',
                    key: 'distance',
                    type: 'number'
                },

                {
                    header: 'Min Stop Hours',
                    key: 'min_stop_hrs',
                    type: 'number'
                },

                {
                    header: 'Max Stop Hours',
                    key: 'max_stop_hrs',
                    type: 'number'
                },

                {
                    header: 'Days To Reach',
                    key: 'days_to_reach',
                    type: 'number'
                }

            ]

        }

    ]

};