module.exports = {
    menuCode: 'trip-expense-setup',
    sheetName: 'Trip Expenses',
    tableName: 'm_trip_expense',
    primaryKey: 'id',
    uniqueKey: 'expense_name',

    columns: [

        {
            header: 'Expense Name',
            key: 'expense_name',
            type: 'text',
            required: true
        },

        {
            header: 'Expense Category',
            key: 'expense_category',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'ExpenseCategories',
                query: `select id, name from m_expense_category`,
                labelField: 'name',
                valueField: 'id',
            }
        },

        {
            header: 'User',
            key: 'user_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Users',
                query: `select id, first_name +' '+ last_name as name from m_user_master`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Revenue Account',
            key: 'revenue_account',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'Expense Account',
            key: 'expense_account',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
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
            header: 'BP',
            key: 'bp_id',
            type: 'dropdown',
            dropdown: {
                sheetName: 'BusinessPartners',
                query: `select id, card_code from m_customer`,
                labelField: 'card_code',
                valueField: 'id'
            }
        },

        {
            header: 'Expense Type',
            key: 'expense_type',
            type: 'number'
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Accrual Account',
            key: 'accrual_account',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'Document Type',
            key: 'document_type',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'DocumentType',
                labelField: 'name',
                valueField: 'code',
                options: [{"id" : "S", "name" : "Service"}, {"id" : "I", "name" : "Item"}],
            }
        },

        {
            header: 'Trip Type',
            key: 'trip_type',
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
            header: 'Vehicle Class',
            key: 'vehicle_class',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'VehicleClass',
                query: `select id, name from m_fm_vehicle_class`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Commodity',
            key: 'commodity',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'Commodity',
                query: `select id, name from m_commodity_type`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Border Code',
            key: 'border_code',
            type: 'text'
        },

        {
            header: 'Fund Account',
            key: 'fund_account',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'TripFundAccount',
                query: `select id, name from m_fm_trip_fund_account`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Quantity',
            key: 'quantity',
            type: 'number'
        },

        {
            header: 'Unit Price',
            key: 'unit_price',
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
            header: 'Total Amount',
            key: 'total_amount',
            type: 'number'
        },

        {
            header: 'Account Type',
            key: 'account_type',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountType',
                labelField: 'name',
                valueField: 'code',
                options: [
                    { name: 'BP', code: '1' },
                    { name: 'GL', code: '2' }
                ]
            }
        },

        {
            header: 'Card',
            key: 'card_id',
            type: 'dropdown',
            dropdown: {
                sheetName: 'Cards',
                query: `select id, card_code from m_customer`,
                labelField: 'card_code',
                valueField: 'id'
            }
        },

        {
            header: 'Card Code',
            key: 'card_code',
            type: 'text'
        },

        {
            header: 'Card Name',
            key: 'card_name',
            type: 'text'
        },

        {
            header: 'Employee',
            key: 'employee_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Employees',
                query: `select id, first_name +''+ last_name as name from m_employee`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Employee Name',
            key: 'employee_name',
            type: 'text'
        },

        {
            header: 'WIP Account LC',
            key: 'wipact_lc',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'WIP Account SC',
            key: 'wipact_sc',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'Extra Link With',
            key: 'extralinkwith',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'ExtraLinkWith',
                labelField: 'name',
                valueField: 'id',
                options: [{"id" : "T", "name" : "Truck"}, {"id" : "D", "name" : "Driver"}, {"id" : "O", "name" : "Other"}],
            }
        },

        {
            header: 'Target Document',
            key: 'target_document',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'TargetDocument',
                labelField: 'name',
                valueField: 'id',
                options: [{"id": "17", "name": "Sales Order"},{"id": "22", "name": "Purchase Order"},{"id": "20", "name": "Goods Receipt PO"},{"id": "18", "name": "A/P Invoice"},{"id": "46", "name": "Outgoing Payment"},{"id": "24", "name": "Incoming Payment"},{"id": "60", "name": "Goods Issue"},{"id": "59", "name": "Goods Receipt"},{"id": "19", "name": "A/P Credit Memo"},{"id": "30", "name": "Journal Entry"},{"id": "1200", "name": "Fuel Log Book"}]
            }
            
        },

        {
            header: 'Cost Center',
            key: 'cost_center',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, name from m_costcenters`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Is IOU',
            key: 'is_iou',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'IOU Account',
            key: 'iou_account_id',
            type: 'dropdown',
            data_type: 'text',
            dropdown: {
                sheetName: 'AccountMaster',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        }

    ]

};