module.exports = {
    menuCode: 'item-master',
    sheetName: 'Items',
    tableName: 'm_item',
    primaryKey: 'id',
    uniqueKey: 'item_code',

    columns: [

        {
            header: 'Item Code',
            key: 'item_code',
            type: 'text',
            required: true
        },

        {
            header: 'Item Name',
            key: 'item_name',
            type: 'text'
        },

        {
            header: 'Item Foreign Name',
            key: 'item_foreign_name',
            type: 'text'
        },

        {
            header: 'Item Type',
            key: 'item_type',
            type: 'text'
        },

        {
            header: 'Is Inventory',
            key: 'is_inventory',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Sales',
            key: 'is_sales',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Purchase',
            key: 'is_purchase',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Is Active',
            key: 'is_active',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Manage Batch',
            key: 'manage_batch',
            type: 'text'
        },

        {
            header: 'Manage Serial',
            key: 'manage_serial',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Average Price',
            key: 'average_price',
            type: 'number'
        },

        {
            header: 'Last Purchase Currency',
            key: 'last_purchase_currency',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Currencies',
                query: `select id, cur_code from m_currencies`,
                labelField: 'cur_code',
                valueField: 'id'
            }
        },

        {
            header: 'Last Purchase Price',
            key: 'last_purchase_price',
            type: 'number'
        },

        {
            header: 'Default Warehouse',
            key: 'default_warehouse_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'Warehouses',
                query: `select id, name from m_warehouse`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'On Hand',
            key: 'on_hand',
            type: 'number'
        },

        {
            header: 'Group',
            key: 'group_id',
            type: 'dropdown',

            dropdown: {
                sheetName: 'ItemGroups',
                query: `select id, group_name from m_item_group`,
                labelField: 'group_name',
                valueField: 'id'
            }
        },

        {
            header: 'Tyre Original TD',
            key: 'tyre_original_td',
            type: 'number'
        },

        {
            header: 'Tyre Minimum TD',
            key: 'tyre_minimum_td',
            type: 'number'
        },

        {
            header: 'Tyre Projected KM',
            key: 'tyre_projected_km',
            type: 'number'
        },

        {
            header: 'Tyre Month',
            key: 'tyre_month',
            type: 'number'
        },

        {
            header: 'Tyre Model No',
            key: 'tyre_model_no',
            type: 'text'
        },

        {
            header: 'Tyre Status',
            key: 'tyre_status',
            type: 'number'
        },

        {
            header: 'Tyre Size',
            key: 'tyre_size',
            type: 'number'
        },

        {
            header: 'Manufacture By',
            key: 'manafacture_by',
            type: 'dropdown',

            dropdown: {
                sheetName: 'Manufacturers',
                query: `select id, name from m_manufacture`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'GL Account By',
            key: 'gl_account_by',
            type: 'text'
        },

        {
            header: 'External Code',
            key: 'external_code',
            type: 'text'
        },

        {
            header: 'Warranty Months',
            key: 'warranty_months',
            type: 'number'
        },

        {
            header: 'Warranty Start On Install',
            key: 'warranty_start_on_install',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Default Warranty Provider',
            key: 'default_warranty_provider',
            type: 'text'
        },

        {
            header: 'Replace After KM',
            key: 'replace_after_km',
            type: 'number'
        },

        {
            header: 'Replace After Months',
            key: 'replace_after_months',
            type: 'number'
        },

        {
            header: 'Track Warranty',
            key: 'track_warranty',
            type: 'checkbox',
            values: ['Y', 'N']
        },

        {
            header: 'Barcode',
            key: 'barcode',
            type: 'text'
        },

        {
            header: 'UOM Group',
            key: 'uom_group_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'UOMGroups',
                query: `select id, code from m_uom_group`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Inventory UOM',
            key: 'inventory_uom_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'InventoryUOM',
                query: `select id, code from m_uom`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Sales UOM',
            key: 'sales_uom_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'SalesUOM',
                query: `select id, code from m_uom`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'Purchase UOM',
            key: 'purchase_uom_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'PurchaseUOM',
                query: `select id, code from m_uom`,
                labelField: 'code',
                valueField: 'id'
            }
        },

        {
            header: 'HSN Code',
            key: 'hsn_code',
            type: 'text'
        },

        {
            header: 'Tax Group',
            key: 'tax_group_id',
            type: 'dropdown',
            data_type: 'number',
            dropdown: {
                sheetName: 'TaxGroups',
                query: `select id, name from m_tax`,
                labelField: 'name',
                valueField: 'id'
            }
        },

        {
            header: 'Standard Cost',
            key: 'standard_cost',
            type: 'number'
        },

        {
            header: 'List Price',
            key: 'list_price',
            type: 'number'
        },

        {
            header: 'Min Inventory',
            key: 'min_inventory',
            type: 'number'
        },

        {
            header: 'Max Inventory',
            key: 'max_inventory',
            type: 'number'
        },

        {
            header: 'Reorder Level',
            key: 'reorder_level',
            type: 'number'
        },

        {
            header: 'Reorder Qty',
            key: 'reorder_qty',
            type: 'number'
        },

        {
            header: 'Item Model',
            key: 'item_model',
            type: 'text'
        },

        {
            header: 'Item Brand',
            key: 'item_brand',
            type: 'text'
        },

        {
            header: 'Method Code',
            key: 'method_code',
            type: 'text'
        },

        {
            header: 'Spare Part Life',
            key: 'spare_part_life',
            type: 'number'
        },

        {
            header: 'Spare Part Life KM',
            key: 'spare_part_life_km',
            type: 'number'
        },

        {
            header: 'Inventory Weight',
            key: 'inventory_weight',
            type: 'number'
        }

    ]

};