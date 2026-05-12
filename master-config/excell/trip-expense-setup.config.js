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
            type: 'text'
        },

        {
            header: 'User',
            key: 'user_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Users',
                query: `select id, user_name from m_users`,
                labelField: 'user_name',
                valueField: 'id'
            }
        },

        {
            header: 'Revenue Account',
            key: 'revenue_account',
            type: 'text'
        },

        {
            header: 'Expense Account',
            key: 'expense_account',
            type: 'text'
        },

        {
            header: 'Item',
            key: 'item_id',
            type: 'dropdown',

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
                query: `select id, card_code from m_business_partner`,
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
            type: 'text'
        },

        {
            header: 'Document Type',
            key: 'document_type',
            type: 'text'
        },

        {
            header: 'Trip Type',
            key: 'trip_type',
            type: 'text'
        },

        {
            header: 'Vehicle Class',
            key: 'vehicle_class',
            type: 'text'
        },

        {
            header: 'Commodity',
            key: 'commodity',
            type: 'text'
        },

        {
            header: 'Border Code',
            key: 'border_code',
            type: 'text'
        },

        {
            header: 'Fund Account',
            key: 'fund_account',
            type: 'text'
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

            dropdown: {
                sheetName: 'Currencies',
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
            header: 'Account Type',
            key: 'account_type',
            type: 'text'
        },

        {
            header: 'Card',
            key: 'card_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Cards',
                query: `select id, card_code from m_card`,
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
                query: `select id, employee_name from m_employee`,
                labelField: 'employee_name',
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
            type: 'text'
        },

        {
            header: 'WIP Account SC',
            key: 'wipact_sc',
            type: 'text'
        },

        {
            header: 'Extra Link With',
            key: 'extralinkwith',
            type: 'text'
        },

        {
            header: 'Target Document',
            key: 'target_document',
            type: 'text'
        },

        {
            header: 'Cost Center',
            key: 'cost_center',
            type: 'text'
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

            dropdown: {
                sheetName: 'IOUAccounts',
                query: `select id, account_name from m_account`,
                labelField: 'account_name',
                valueField: 'id'
            }
        }

    ]

};