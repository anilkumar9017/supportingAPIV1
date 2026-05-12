module.exports = {

    menuCode: 'chartof-account',

    sheetName: 'Chart Of Accounts',

    tableName: 'm_chartofaccounts',

    primaryKey: 'id',

    uniqueKey: 'account_code',

    columns: [

        {
            header: 'Account Code',
            key: 'account_code',
            type: 'text',
            required: true
        },

        {
            header: 'Account Name',
            key: 'account_name',
            type: 'text'
        },

        {
            header: 'Account Type',
            key: 'account_type',
            type: 'text'
        },

        {
            header: 'Account Currency',
            key: 'account_currency',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Currencies',
                query: `select id, code from m_currency`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Current Balance',
            key: 'current_balance',
            type: 'number'
        },

        {
            header: 'Opening Balance',
            key: 'opening_balance',
            type: 'number'
        },

        {
            header: 'Current Balance Account',
            key: 'current_balance_acct',
            type: 'number'
        },

        {
            header: 'Opening Balance Account',
            key: 'opening_balance_acct',
            type: 'number'
        },

        {
            header: 'Current Balance Sys',
            key: 'current_balance_sys',
            type: 'number'
        },

        {
            header: 'Opening Balance Sys',
            key: 'opening_balance_sys',
            type: 'number'
        },

        {
            header: 'Father Account',
            key: 'father_accountid',
            type: 'dropdown',

            dropdown: {
                sheetName: 'ParentAccounts',
                query: `select id, account_name from m_account`,
                labelField: 'account_name',
                valueField: 'id'
            }
        },

        {
            header: 'Levels',
            key: 'levels',
            type: 'number'
        },

        {
            header: 'Group Mask',
            key: 'groupmask',
            type: 'number'
        },

        {
            header: 'Cash Account',
            key: 'cash_account',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim1 Relevant',
            key: 'dim1_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim2 Relevant',
            key: 'dim2_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim3 Relevant',
            key: 'dim3_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim4 Relevant',
            key: 'dim4_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim5 Relevant',
            key: 'dim5_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Project Relevant',
            key: 'project_relevant',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Dim1 Code',
            key: 'dim1_code',
            type: 'text'
        },

        {
            header: 'Dim2 Code',
            key: 'dim2_code',
            type: 'text'
        },

        {
            header: 'Dim3 Code',
            key: 'dim3_code',
            type: 'text'
        },

        {
            header: 'Dim4 Code',
            key: 'dim4_code',
            type: 'text'
        },

        {
            header: 'Dim5 Code',
            key: 'dim5_code',
            type: 'text'
        },

        {
            header: 'Project Code',
            key: 'project_code',
            type: 'text'
        },

        {
            header: 'Is Protected',
            key: 'is_protected',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Postable',
            key: 'is_postable',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Default Tax Code',
            key: 'default_taxcode',
            type: 'text'
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        }

    ]

};