module.exports = {
	menuCode: 'import-stuffing',
	sheetName: 'Stuffing',
	tableName: 'd_fm_stuffing',
	primaryKey: 'id',
	uniqueKey: 'stuffing_c_seal_num',

	columns: [
		{ header: 'Stuffing Container Number', key: 'stuffing_container_number', type: 'text', width: 25 },
		{ header: 'Seal Number', key: 'reference_document', type: 'text', width: 25 },
		{ header: 'Reference 1', key: 'start_time', type: 'date', width: 20 },
		{ header: 'Document Date', key: 'document_date', type: 'date', width: 20 },
		{ header: 'Start Time', key: 'end_time', type: 'date', width: 20 },
		{ header: 'End Time', key: 'container', type: 'text', width: 20 },
		{ header: 'Container Location YARD/BAY', key: 'general_remarks', type: 'text', width: 30 },
		{ header: 'General Remarks', key: 'warehouse', type: 'text', width: 20 },
		{ header: 'Warehouse', key: 'warehouse_name', type: 'dropdown', width: 25,
            data_type: 'text',
            dropdown: {
                sheetName: 'Warehouses',
                query: `select id, name from m_warehouse`,
                labelField: 'name',
                valueField: 'id'
            }
        },
		{ header: 'Warehouse Bin', key: 'warehouse_bin', type: 'dropdown', width: 25,
            data_type: 'text',
            dropdown: {
                sheetName: 'WarehousesBin',
                query: `select id, description from m_warehouse_bin`,
                labelField: 'description',
                valueField: 'id'
        } },
		{ header: 'Booking Number', key: 'booking_no', type: 'text', width: 20 },
		{ header: 'Received By', key: 'received_by', type: 'dropdown', width: 25, data_type: 'text',
            dropdown: { 
                sheetName: 'Users', 
                query: `select id, username from m_user_master`, 
                labelField: 'username', valueField: 'id'
         }
        },
		{ header: 'Item Details Header', key: 'item_detail', type: 'text', width: 30 },
		{ header: 'Booking ID Reference', key: 'booking_id', type: 'number', width: 15 },
		{ header: 'Stripping Booking No', key: 'stripping', type: 'checkbox', values: ['Y', 'N'], width: 15 },
		{ header: 'Sub Booking Number', key: 'sub_booking', type: 'text', width: 20 },
		{ header: 'Item ID', key: 'item_id', type: 'number', width: 15 },
		{ header: 'Item Name', key: 'item_name', type: 'text', width: 25 },
		{ header: 'Stuffing Quantity To Load', key: 'stuffing_qty', type: 'number', width: 15 },
		{ header: 'Balance Qty', key: 'balance_qty', type: 'number', width: 15 },
		{ header: 'Stripped Qty Available', key: 'stripped_qty', type: 'number', width: 15 },
		{ header: 'Stuffed Weight', key: 'stuffed_weight', type: 'number', width: 18 },
		{ header: 'Unit of Measure', key: 'unit_of_measure', type: 'text', width: 20 },
		{ header: 'Commodity', key: 'commodity', type: 'text', width: 25 },
		{ header: 'Stock Item Entry', key: 'stock_item', type: 'text', width: 25 },
		{ header: 'Stock Item Line', key: 'stock_item_name', type: 'text', width: 25 },
		{ header: 'Goods Remarks', key: 'goods_received', type: 'checkbox', values: ['Y', 'N'], width: 18 },
		{ header: 'Stuffed By', key: 'stuffed_by', type: 'dropdown', width: 25, data_type: 'text',
            dropdown: { 
                sheetName: 'Users', 
                query: `select id, username from m_user_master`, 
                labelField: 'username', valueField: 'id'
         }},
		{ header: 'Verified By', key: 'verified_by', type: 'dropdown', width: 25, data_type: 'text',
            dropdown: { 
                sheetName: 'Users', 
                query: `select id, username from m_user_master`, 
                labelField: 'username', valueField: 'id'
         }},
		{ header: 'Weight Per Qty', key: 'weight_per', type: 'number', width: 15 },
		{ header: 'Line Total Weight', key: 'line_total', type: 'number', width: 15 },
		{ header: 'Line Remarks', key: 'line_remarks', type: 'text', width: 30 },
		{ header: 'Lot Number', key: 'lot_number', type: 'text', width: 20 },
		{ header: 'Bundle Number', key: 'bundle_number', type: 'text', width: 20 },
		{ header: 'Base Type', key: 'base_type', type: 'text', width: 20 }
	]
};
