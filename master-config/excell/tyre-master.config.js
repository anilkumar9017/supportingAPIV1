module.exports = {
    menuCode: 'tyre-master',
    sheetName: 'Tyres',
    tableName: 'm_tyre',
    primaryKey: 'id',
    uniqueKey: 'part_serial_no',
  
    columns: [
      { header: 'Part Serial No', key: 'part_serial_no', type: 'text', width: 30, required: true },
      { header: 'Brand No', key: 'brand_no', type: 'text', width: 20 },
      { header: 'System Serial No', key: 'system_serial_no', type: 'number', width: 20 },
      { header: 'Manufacturing Serial No', key: 'manf_serial_no', type: 'text', width: 30 },
      { header: 'Company Brand No', key: 'company_brand_no', type: 'text', width: 30 },
      { header: 'Part Group', key: 'part_group', type: 'text', width: 20 },
      { header: 'Manufacturer', key: 'manufacturer', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Manufacturers',
          query: 'select id, name from m_manufacture',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Old Position Code', key: 'old_position_code', type: 'text', width: 20 },
      { header: 'Old Axle Number', key: 'old_axle_number', type: 'text', width: 20 },
      { header: 'Old Vehicle Code', key: 'old_vehiclecode', type: 'text', width: 30 },
      { header: 'Old Vehicle Type', key: 'old_vehicletype', type: 'text', width: 20 },
      { header: 'Tyre Status', key: 'tyre_status', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Tyre Status',
          query: 'select id, name from m_tyre_status',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Is Active', key: 'is_active', type: 'checkbox', values: ['Y', 'N'], width: 15 },
      { header: 'Procurement Method', key: 'procurement_method', type: 'text', width: 20 },
      { header: 'Currency', key: 'currency', type: 'dropdown', dataType: 'number', width: 15, dropdown: {
          sheetName: 'Currencies',
          query: 'select id, cur_code from m_currencies',
          labelField: 'cur_code',
          valueField: 'id'
        }
      },
      { header: 'Supplier', key: 'supplier_id', type: 'dropdown', dataType: 'number', width: 30, dropdown: {
          sheetName: 'Suppliers',
          query: "select id, card_code from m_customer where card_type = 'S'",
          labelField: 'card_code',
          valueField: 'id'
        }
      },
      { header: 'Supplier Code', key: 'supplier_code', type: 'text', width: 20 },
      { header: 'Supplier Name', key: 'supplier_name', type: 'text', width: 40 },
      { header: 'Scrap Reason', key: 'scrap_reason', type: 'number', width: 20 },
      { header: 'Scrap Date', key: 'scrap_date', type: 'date', width: 20 },
      { header: 'Disposed Date', key: 'date_disposed', type: 'date', width: 20 },
      { header: 'SIF No', key: 'sif_no', type: 'text', width: 20 },
      { header: 'GRPO No', key: 'grpo_no', type: 'text', width: 20 },
      { header: 'Tyre Model', key: 'tire_model', type: 'text', width: 30 },
      { header: 'Tyre Size', key: 'tire_size', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Tyre Sizes',
          query: 'select id, name from m_tyre_size',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Ply Rating', key: 'ply_rating', type: 'text', dataType: 'text', width: 20, dropdown: {
            sheetName: 'PlyRatings',
            labelField: 'name',
            valueField: 'id',
            options:[{"id": "1", "name": "1"},{"id": "2", "name": "2"},{"id": "3", "name": "3"},{"id": "4", "name": "4"},{"id": "5", "name": "5"},{"id": "6", "name": "6"},{"id": "7", "name": "7"},{"id": "8", "name": "8"},{"id": "9", "name": "9"},{"id": "10", "name": "10"}]
        }
     },
      { header: 'Warehouse', key: 'warehouse_id', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Warehouses',
          query: 'select id, name from m_warehouse',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Issued On', key: 'issued_on', type: 'date', width: 20 },
      { header: 'Manufacturing Date', key: 'mfrdate', type: 'date', width: 20 },
      { header: 'Expiry Date', key: 'expdate', type: 'date', width: 20 },
      { header: 'Buying Date', key: 'buying_date', type: 'date', width: 20 },
      { header: 'Item Cost', key: 'item_cost', type: 'number', width: 20 },
      { header: 'KM OB', key: 'km_ob', type: 'number', width: 15 },
      { header: 'Original Tread Depth', key: 'original_tread_depth', type: 'number', width: 20 },
      { header: 'Current Tread Depth', key: 'current_tread_depth', type: 'number', width: 20 },
      { header: 'Minimum Tread Depth', key: 'minimum_tread_depth', type: 'number', width: 20 },
      { header: 'Remaining TD', key: 'remaining_td', type: 'number', width: 15 },
      { header: 'Received TD', key: 'received_td', type: 'number', width: 15 },
      { header: 'Remarks', key: 'remark', type: 'text', width: 40 },
      { header: 'Scrap Remarks', key: 'scrap_remarks', type: 'text', width: 40 },
      { header: 'Projected KM', key: 'projected_km', type: 'number', width: 15 },
      { header: 'Part Code', key: 'part_code', type: 'text', width: 20 },
      { header: 'Part Name', key: 'part_name', type: 'text', width: 30 },
      { header: 'Lot No', key: 'lot_no', type: 'text', width: 20 },
      { header: 'Retread Code', key: 'retread_code', type: 'text', width: 20 },
      { header: 'Retread Name', key: 'retread_name', type: 'text', width: 30 },
      { header: 'Retread Supplier', key: 'retread_supplier_id', type: 'dropdown', dataType: 'number', width: 30, dropdown: {
          sheetName: 'Suppliers',
          query: "select id, card_code from m_customer where card_type = 'S'",
          labelField: 'card_code',
          valueField: 'id'
        }
      },
      { header: 'Retread Supplier Name', key: 'retread_supplier_name', type: 'text', width: 40 },

      // Child Arrays - Hierarchical Data
      {
        header: 'Tyre History',
        key: 'm_tyre_history',
        type: 'child_array',
        tableName: 'm_tyre_history',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Tyre History',
        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 10 },
          { header: 'Vehicle', key: 'vehicle_id', type: 'dropdown', dataType: 'number', width: 25, dropdown: {
              sheetName: 'Vehicles',
              query: 'select id, code from m_vehicle',
              labelField: 'code',
              valueField: 'id'
            }
          },
          { header: 'Position Code', key: 'position_code', type: 'text', width: 20 },
          { header: 'Axle Number', key: 'axle_number', type: 'text', width: 15 },
          { header: 'Fitted Date', key: 'fitted_date', type: 'date', width: 15 },
          { header: 'Removed Date', key: 'removed_date', type: 'date', width: 15 },
          { header: 'Opening Tread Depth', key: 'opening_tread_depth', type: 'number', width: 20 },
          { header: 'Closing Tread Depth', key: 'closing_tread_depth', type: 'number', width: 20 },
          { header: 'Opening KM', key: 'opening_km', type: 'number', width: 15 },
          { header: 'Closing KM', key: 'closing_km', type: 'number', width: 15 },
          { header: 'Total KM', key: 'total_km', type: 'number', width: 15 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Tyre Maintenance',
        key: 'm_tyre_maintenance',
        type: 'child_array',
        tableName: 'm_tyre_maintenance',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Tyre Maintenance',
        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 10 },
          { header: 'Maintenance Type', key: 'maintenance_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Maintenance Types',
              query: 'select id, name from m_maintenance_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Maintenance Date', key: 'maintenance_date', type: 'date', width: 15 },
          { header: 'Tread Depth Before', key: 'tread_depth_before', type: 'number', width: 20 },
          { header: 'Tread Depth After', key: 'tread_depth_after', type: 'number', width: 20 },
          { header: 'Cost', key: 'cost', type: 'number', width: 15 },
          { header: 'Service Provider', key: 'service_provider', type: 'text', width: 30 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Tyre Inspection',
        key: 'm_tyre_inspection',
        type: 'child_array',
        tableName: 'm_tyre_inspection',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Tyre Inspection',
        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 10 },
          { header: 'Inspection Date', key: 'inspection_date', type: 'date', width: 15 },
          { header: 'Tread Depth', key: 'tread_depth', type: 'number', width: 15 },
          { header: 'Condition', key: 'condition', type: 'text', width: 20 },
          { header: 'Inspection Result', key: 'inspection_result', type: 'dropdown', dataType: 'text', width: 15, dropdown: {
              sheetName: 'Inspection Results',
              labelField: 'name',
              valueField: 'code',
              options: [
                { name: 'Pass', code: 'PASS' },
                { name: 'Fail', code: 'FAIL' },
                { name: 'Conditional', code: 'CONDITIONAL' }
              ]
            }
          },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Tyre Movement',
        key: 'd_tm_tyremaster_movement',
        type: 'child_array',
        tableName: 'd_tm_tyremaster_movement',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Tyre Movement',
        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 10 },
          { header: 'Part ID', key: 'part_id', type: 'number', width: 12 },
          { header: 'Part Code', key: 'part_code', type: 'text', width: 20 },
          { header: 'Part Name', key: 'part_name', type: 'text', width: 30 },
          { header: 'Vehicle', key: 'vehicle_id', type: 'dropdown', dataType: 'number', width: 25, dropdown: {
              sheetName: 'Vehicles',
              query: 'select id, code from m_vehicle',
              labelField: 'code',
              valueField: 'id'
            }
          },
          { header: 'Fitted As', key: 'fitted_as', type: 'text', width: 15 },
          { header: 'Vehicle Name', key: 'vehicle_name', type: 'text', width: 30 },
          { header: 'Position Code', key: 'position_code', type: 'number', width: 15 },
          { header: 'Axle Number', key: 'axle_number', type: 'text', width: 15 },
          { header: 'Axle Config', key: 'axle_config', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Axle Config',
              query: 'select id, name from m_axle_conf',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Fitted On', key: 'fitted_on', type: 'date', width: 15 },
          { header: 'Fitment Tread Depth', key: 'fitment_td', type: 'number', width: 18 },
          { header: 'Fitment KM', key: 'fitment_km', type: 'number', width: 15 },
          { header: 'Removed On', key: 'removed_on', type: 'date', width: 15 },
          { header: 'Removed Tread Depth', key: 'removed_td', type: 'number', width: 18 },
          { header: 'Removed KM', key: 'removed_km', type: 'number', width: 15 },
          { header: 'Total KM', key: 'total_km', type: 'number', width: 15 },
          { header: 'GI Entry', key: 'gi_entry', type: 'number', width: 12 },
          { header: 'GR Entry', key: 'gr_entry', type: 'number', width: 12 },
          { header: 'Issue No JC', key: 'issueno_jc', type: 'text', width: 15 },
          { header: 'Receipt JC', key: 'receipt_jc', type: 'number', width: 15 },
          { header: 'Reason Code', key: 'reason_code', type: 'text', width: 15 },
          { header: 'GI Approved', key: 'gi_approved', type: 'checkbox', values: ['Y', 'N'], width: 12 },
          { header: 'GR Approved', key: 'gr_approved', type: 'checkbox', values: ['Y', 'N'], width: 12 },
          { header: 'GR Approved By', key: 'gr_approved_by', type: 'text', width: 20 },
          { header: 'GI Approved By', key: 'gi_approved_by', type: 'text', width: 20 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 },
          { header: 'Waiting Warehouse', key: 'waiting_warehouse', type: 'text', width: 20 },
          { header: 'Scrap Reason', key: 'scrap_reason', type: 'number', width: 15 },
          { header: 'Action', key: 'action', type: 'text', dataType: 'text', width: 20, dropdown: {
            sheetName: 'PlyRatings',
            labelField: 'name',
            valueField: 'id',
            options:[{"id": "1", "name": "Active"},{"id": "2", "name": "Remove for retreading"},{"id": "3", "name": "Remove for repair"},{"id": "4", "name": "Others"}, {"id": "5", "name": "Remove for Scrap/Diprosal"}]
            } 
        }
        ]
      }
    ]
  };