module.exports = {

    menuCode: 'business-partner-master',
    sheetName: 'Business Partners',
    tableName: 'm_customer',
    primaryKey: 'id',
    uniqueKey: 'card_code',
    columns: [

        {
            header: 'Card Code',
            key: 'card_code',
            type: 'text',
            required: true
        },

        {
            header: 'Card Name',
            key: 'card_name',
            type: 'text'
        },

        {
            header: 'Card Full Name',
            key: 'card_fname',
            type: 'text'
        },

        {
            header: 'Card Type',
            key: 'card_type',
            type: 'text'
        },

        {
            header: 'BP Currency',
            key: 'bp_currency_id',
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
            header: 'Group',
            key: 'group_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Groups',
                query: `select id, group_name from m_customer_group`,
                labelField: 'group_name',
                valueField: 'id'
            }
        },

        {
            header: 'Phone1',
            key: 'phone1',
            type: 'text'
        },

        {
            header: 'Phone2',
            key: 'phone2',
            type: 'text'
        },

        {
            header: 'Mobile Phone',
            key: 'mobile_phone',
            type: 'text'
        },

        {
            header: 'Fax',
            key: 'fax',
            type: 'text'
        },

        {
            header: 'Email',
            key: 'email',
            type: 'text'
        },

        {
            header: 'Email 2',
            key: 'email_2',
            type: 'text'
        },

        {
            header: 'Website',
            key: 'website',
            type: 'text'
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'External Code',
            key: 'external_code',
            type: 'text'
        },

        {
            header: 'Account Payable',
            key: 'account_payable',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'AccountPayment',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'GLN',
            key: 'gln',
            type: 'text'
        },

        {
            header: 'Sales Employee',
            key: 'sales_employee',
            type: 'dropdown',

            dropdown: {
                sheetName: 'SalesEmployees',
                query: `select id, first_name +''+ last_name as name from m_employee`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Notes',
            key: 'notes',
            type: 'text'
        },

        {
            header: 'Balance',
            key: 'balance',
            type: 'number'
        },

        {
            header: 'Checks Balance',
            key: 'checks_balance',
            type: 'number'
        },

        {
            header: 'Orders Balance',
            key: 'orders_balance',
            type: 'number'
        },

        {
            header: 'DNotes Balance',
            key: 'dnotes_balance',
            type: 'number'
        },

        {
            header: 'Interest Rate',
            key: 'interest_rate',
            type: 'number'
        },

        {
            header: 'Commission',
            key: 'commission',
            type: 'number'
        },

        {
            header: 'City',
            key: 'city',
            type: 'text'
        },

        {
            header: 'State',
            key: 'state',
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
            header: 'Picture',
            key: 'picture',
            type: 'text'
        },

        {
            header: 'Default Account',
            key: 'dfl_account',
            type: 'text'
        },

        {
            header: 'Bank Code',
            key: 'bank_code',
            type: 'text'
        },

        {
            header: 'IBAN',
            key: 'iban',
            type: 'text'
        },

        {
            header: 'Swift Code',
            key: 'swift_code',
            type: 'text'
        },

        {
            header: 'Exemption No',
            key: 'exemption_no',
            type: 'text'
        },

        {
            header: 'Valid From',
            key: 'valid_from',
            type: 'date'
        },

        {
            header: 'Valid Until',
            key: 'valid_until',
            type: 'date'
        },

        {
            header: 'Frozen From',
            key: 'frozen_from',
            type: 'date'
        },

        {
            header: 'Frozen Until',
            key: 'frozen_until',
            type: 'date'
        },

        {
            header: 'Frozen For',
            key: 'frozen_for',
            type: 'text'
        },

        {
            header: 'Valid For',
            key: 'valid_for',
            type: 'text'
        },

        {
            header: 'Is Domestic',
            key: 'is_domestic',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Resident',
            key: 'is_resident',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Sales Channel',
            key: 'sales_channel',
            type: 'text'
        },

        {
            header: 'Territory',
            key: 'territory',
            type: 'text'
        },

        {
            header: 'Industry',
            key: 'industry',
            type: 'text'
        },

        {
            header: 'Profession',
            key: 'profession',
            type: 'text'
        },

        {
            header: 'Category Code',
            key: 'category_code',
            type: 'text'
        },

        {
            header: 'Category Name',
            key: 'category_name',
            type: 'text'
        },

        {
            header: 'Down Payment Account',
            key: 'down_pymnt_acct',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'AccountPayment',
                query: `select id, account_code from m_chartofaccounts where is_postable='Y'`,
                labelField: 'account_code',
                valueField: 'id'
            }
        },

        {
            header: 'Balance Sys',
            key: 'balance_sys',
            type: 'number'
        },

        {
            header: 'Balance FC',
            key: 'balance_fc',
            type: 'number'
        },

        {
            header: 'TIN No',
            key: 'tin_no',
            type: 'text'
        },

        {
            header: 'VRN No',
            key: 'vrn_no',
            type: 'text'
        },

        {
            header: 'Customer Addresses',
            key: 'customer_addresses',
            type: 'child_array',
            sheetName: 'Customer Addresses',
            tableName: 'm_customer_address',
            parentKey: 'parent_id',
            columns: [
                { header: 'Address Type', key: 'address_type', type: 'text' },
                { header: 'Is Default', key: 'is_default', type: 'checkbox', values: ['Y', 'N'] },
                { header: 'Address Name', key: 'address_name', type: 'text' },
                { header: 'Street', key: 'street', type: 'text' },
                { header: 'Block', key: 'block', type: 'text' },
                { header: 'Zip Code', key: 'zip_code', type: 'text' },
                { header: 'City', key: 'city', type: 'text' },
                { header: 'State', key: 'state', type: 'text' },
                { header: 'Country', key: 'country', type: 'dropdown', dropdown: { sheetName: 'AddressCountries', query: `select id, code from m_country`, labelField: 'code', valueField: 'id' } },
                { header: 'Landmark', key: 'landmark', type: 'text' },
                { header: 'Latitude', key: 'latitude', type: 'number' },
                { header: 'Longitude', key: 'longitude', type: 'number' },
                { header: 'Email', key: 'email', type: 'text' },
                { header: 'Phone', key: 'phone', type: 'text' },
                { header: 'Contact Person', key: 'contact_person', type: 'text' },
                { header: 'GSTIN', key: 'gstin', type: 'text' }
            ]
        },

        {
            header: 'Customer Contact Persons',
            key: 'customer_contact_persons',
            type: 'child_array',
            sheetName: 'Customer Contact Persons',
            tableName: 'm_customer_contact_person',
            parentKey: 'parent_id',
            columns: [
                { header: 'Contact Name', key: 'contact_name', type: 'text' },
                { header: 'Designation', key: 'designation', type: 'text' },
                { header: 'Phone', key: 'phone', type: 'text' },
                { header: 'Mobile', key: 'mobile', type: 'text' },
                { header: 'Email', key: 'email', type: 'text' },
                { header: 'Department', key: 'department', type: 'dropdown', data_type: 'number', dropdown: { sheetName: 'ParentADepartmentcounts', query: `select id, name from m_department`, labelField: 'account_code', valueField: 'id' } },
                { header: 'Is Primary', key: 'is_primary', type: 'checkbox', values: ['Y', 'N'] }
            ]
        },

        {
            header: 'Customer Attachments',
            key: 'customer_attachments',
            type: 'child_array',
            sheetName: 'Customer Attachments',
            tableName: 'm_customer_attachment',
            parentKey: 'parent_id',
            columns: [
                { header: 'Document Name', key: 'doc_name', type: 'text' },
                { header: 'Document Type', key: 'doc_type', type: 'text' },
                { header: 'File Path', key: 'file_path', type: 'text' },
                { header: 'Expiry Date', key: 'expiry_date', type: 'date' },
                { header: 'Remarks', key: 'remarks', type: 'text' },
                { header: 'Uploaded By', key: 'uploaded_by', type: 'dropdown', dropdown: { sheetName: 'Users', query: `select id, user_name from m_users`, labelField: 'user_name', valueField: 'id' } },
                { header: 'Uploaded On', key: 'uploaded_on', type: 'date' },
                { header: 'CDN URL', key: 'cdn_url', type: 'text' },
                { header: 'Mime Type', key: 'mime_type', type: 'text' }
            ]
        }

    ]

};