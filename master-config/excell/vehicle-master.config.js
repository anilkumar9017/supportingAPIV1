module.exports = {
    menuCode: 'vehicle-master',
    sheetName: 'Vehicles',
    tableName: 'm_vehicle',
    primaryKey: 'id',
    uniqueKey: 'code',
  
    columns: [
      { header: 'Code', key: 'code', type: 'text', width: 30, required: true },
      { header: 'Name', key: 'name', type: 'text', width: 30 },
      { header: 'Category', key: 'category', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Vehicle Categories',
          query: 'select id, name from m_vehicle_group',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Vehicle Status', key: 'vehicle_status', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Vehicle Status',
          query: 'select id, name from m_vehicle_group',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Vehicle Group', key: 'vehicle_group', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Vehicle Groups',
          query: 'select id, name from m_vehicle_group',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Form Builder ID', key: 'form_builder_id', type: 'number', width: 20 },
      { header: 'Branch', key: 'branch', type: 'text', width: 20 },
      { header: 'Serial No', key: 'serialno', type: 'text', width: 20 },
      { header: 'Owner', key: 'owner_id', type: 'dropdown', dataType: 'number', width: 30, dropdown: {
          sheetName: 'Owners',
          query: 'select id, code from m_vehicle_group',
          labelField: 'code',
          valueField: 'id'
        }
      },
      { header: 'Manufacturer', key: 'manufacturer', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
          sheetName: 'Manufacturers',
          query: 'select id, name from m_vehicle_group',
          labelField: 'name',
          valueField: 'id'
        }
      },
      { header: 'Registered Under', key: 'registered_under', type: 'text', width: 30 },
      { header: 'Number of Compartments', key: 'noof_compartment', type: 'number', width: 20 },
      { header: 'Odometer Max', key: 'odo_max', type: 'number', width: 20 },
      { header: 'Odometer Current', key: 'odo_current', type: 'number', width: 20 },
      { header: 'Odometer Actual', key: 'odo_actual', type: 'number', width: 20 },
      { header: 'Odometer UOM', key: 'odo_uom', type: 'text', width: 20 },
      { header: 'Buying Date', key: 'buying_date', type: 'date', width: 20 },
      { header: 'Weight UOM', key: 'weight_uom', type: 'text', width: 20 },
      { header: 'Weight Empty', key: 'weight_empty', type: 'number', width: 20 },
      { header: 'Weight Capacity', key: 'weight_capacity', type: 'number', width: 20 },
      { header: 'Weight Max', key: 'weight_max', type: 'number', width: 20 },
      { header: 'Volume UOM', key: 'volume_uom', type: 'text', width: 20 },
      { header: 'Volume Empty', key: 'volume_empty', type: 'number', width: 20 },
      { header: 'Volume Capacity', key: 'volume_capacity', type: 'number', width: 20 },
      { header: 'Volume Max', key: 'volume_max', type: 'number', width: 20 },
      { header: 'Cube UOM', key: 'cube_uom', type: 'text', width: 20 },
      { header: 'Cube Capacity', key: 'cube_capacity', type: 'number', width: 20 },
      { header: 'Number of Axle', key: 'noofaxle', type: 'number', width: 20 },
      { header: 'Max Weight per Axle', key: 'max_weightcap_axle', type: 'number', width: 20 },
      { header: 'Dimensions 1', key: 'dimension1', type: 'text', width: 20 },
      { header: 'Dimensions 2', key: 'dimension2', type: 'text', width: 20 },
      { header: 'Dimensions 3', key: 'dimension3', type: 'text', width: 20 },
      { header: 'Dimensions 4', key: 'dimension4', type: 'text', width: 20 },
      { header: 'Dimensions 5', key: 'dimension5', type: 'text', width: 20 },
      { header: 'Remarks', key: 'remarks', type: 'text', width: 30 },
      //{ header: 'Class', key: '_class', type: 'number', width: 20 },
      { header: 'Model No', key: 'modelno', type: 'text', width: 20 },
      { header: 'Model Name', key: 'modelname', type: 'text', width: 20 },
      { header: 'Vehicle Series', key: 'vehicleseries', type: 'number', width: 20 },
      { header: 'Suspension Type', key: 'suspension_type', type: 'number', width: 20 },
      { header: 'Gearbox Type', key: 'gearbox_type', type: 'text', width: 20 },
      { header: 'Gearbox Speed', key: 'gearbox_speed', type: 'number', width: 20 },
      { header: 'Gearbox Category', key: 'gearbox_category', type: 'number', width: 20 },
      { header: 'Reduction', key: 'reduction', type: 'number', width: 20 },
      { header: 'Condition', key: 'condition', type: 'number', width: 20 },
      { header: 'Trailer Type', key: 'trailer_type', type: 'number', width: 20 },
      { header: 'Axle Config', key: 'axle_config', type: 'number', width: 20 },
      { header: 'Tyre Axle Config', key: 'tyre_axle_config', type: 'number', width: 20 },
      { header: 'Axle Weights', key: 'axle1_weight', type: 'number', width: 20 },
      { header: 'Axle2 Weight', key: 'axle2_weight', type: 'number', width: 20 },
      { header: 'Axle3 Weight', key: 'axle3_weight', type: 'number', width: 20 },
      { header: 'Axle4 Weight', key: 'axle4_weight', type: 'number', width: 20 },
      { header: 'Axle5 Weight', key: 'axle5_weight', type: 'number', width: 20 },
      { header: 'Axle6 Weight', key: 'axle6_weight', type: 'number', width: 20 },
      { header: 'Axle7 Weight', key: 'axle7_weight', type: 'number', width: 20 },
      { header: 'Gross Vehicle Weight', key: 'gross_vehicle_weight', type: 'number', width: 20 },
      { header: 'Maintank Cap', key: 'maintank_cap', type: 'number', width: 20 },
      { header: 'Second Tank Cap', key: 'secondtank_cap', type: 'number', width: 20 },
      { header: 'Third Tank Cap', key: 'thirdtank_cap', type: 'number', width: 20 },
      { header: 'Engine No', key: 'engineno', type: 'text', width: 20 },
      { header: 'Registration No', key: 'registration_no', type: 'text', width: 20 },
      { header: 'Registration Date', key: 'registration_date', type: 'date', width: 20 },
      { header: 'Fuel Ratio', key: 'fuel_ratio', type: 'number', width: 20 },
      { header: 'Trip Type', key: 'triptype', type: 'text', width: 20 },
      { header: 'Self Owned', key: 'self_owned', type: 'checkbox', values: ['Y', 'N'], width: 20 },
  
      // Child Arrays - Hierarchical Data
      {
        header: 'Vehicle Licenses',
        key: 'm_vehicle_license',
        type: 'child_array',
        tableName: 'm_vehicle_license',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Vehicle Licenses',
        columns: [
          { header: 'License ID', key: 'licenseid', type: 'text', width: 15, required: true },
          { header: 'License Type', key: 'license_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'License Types',
              query: 'select id, name from m_license_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'License Details', key: 'license_details', type: 'text', width: 30 },
          { header: 'Agency', key: 'agency', type: 'text', width: 25 },
          { header: 'Country', key: 'country', type: 'dropdown', dataType: 'number', width: 15, dropdown: {
              sheetName: 'Countries',
              query: 'select id, name from m_country',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Effective From', key: 'effective_from', type: 'date', width: 15 },
          { header: 'Valid Upto', key: 'valid_upto', type: 'date', width: 15 },
          { header: 'Currency', key: 'currency', type: 'dropdown', dataType: 'number', width: 10, dropdown: {
              sheetName: 'Currencies',
              query: 'select id, code from m_currency',
              labelField: 'code',
              valueField: 'id'
            }
          },
          { header: 'License Amount', key: 'license_amount', type: 'number', width: 15 },
          { header: 'Approved', key: 'approved', type: 'checkbox', values: ['Y', 'N'], width: 10 },
          { header: 'Approved By', key: 'approvedby', type: 'number', width: 15 },
          { header: 'JE ID', key: 'je_id', type: 'number', width: 15 }
        ]
      },
      {
        header: 'Service History',
        key: 'm_vehicle_servicehistory',
        type: 'child_array',
        tableName: 'm_vehicle_servicehistory',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Service History',
        columns: [
          { header: 'Maintenance Type', key: 'maintenance_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Maintenance Types',
              query: 'select id, name from m_maintenance_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 },
          { header: 'Effective From', key: 'effective_from', type: 'date', width: 15 },
          { header: 'Valid Upto', key: 'valid_upto', type: 'date', width: 15 },
          { header: 'Service Type', key: 'servicetype', type: 'dropdown', dataType: 'number', width: 15, dropdown: {
              sheetName: 'Service Types',
              query: 'select id, name from m_service_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Odometer', key: 'odometer', type: 'number', width: 15 },
          { header: 'Jobcard ID', key: 'jobcard_id', type: 'text', width: 20 },
          { header: 'Next Odometer', key: 'next_odometer', type: 'number', width: 15 },
          { header: 'Next Service Date', key: 'next_servicedate', type: 'date', width: 18 },
          { header: 'Jobcard Line ID', key: 'jobcard_lineid', type: 'number', width: 15 },
          { header: 'Service Interval', key: 'service_interval', type: 'text', width: 15 },
          { header: 'UOM', key: 'uom', type: 'text', width: 10 },
          { header: 'KM', key: 'km', type: 'number', width: 10 }
        ]
      },
      {
        header: 'Vehicle Connections',
        key: 'm_vehicle_connection',
        type: 'child_array',
        tableName: 'm_vehicle_connection',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Vehicle Connections',
        columns: [
          { header: 'Vehicle ID', key: 'vehicleid', type: 'number', width: 15 },
          { header: 'Vehicle Name', key: 'vehiclename', type: 'text', width: 25 },
          { header: 'Vehicle Type', key: 'vehicletype', type: 'dropdown', dataType: 'number', width: 15, dropdown: {
              sheetName: 'Vehicle Types',
              query: 'select id, name from m_vehicle_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Weight Max', key: 'weight_max', type: 'number', width: 15 },
          { header: 'Weight Capacity', key: 'weight_cap', type: 'number', width: 15 },
          { header: 'Cube Capacity', key: 'cube_cap', type: 'number', width: 15 },
          { header: 'From Date', key: 'fromdate', type: 'date', width: 15 },
          { header: 'To Date', key: 'todate', type: 'date', width: 15 },
          { header: 'Sequence Number', key: 'sequence_num', type: 'number', width: 15 },
          { header: 'Opening ODO', key: 'opening_odo', type: 'number', width: 15 },
          { header: 'Closing ODO', key: 'closing_odo', type: 'number', width: 15 },
          { header: 'Total KM', key: 'total_km', type: 'number', width: 15 }
        ]
      },
      {
        header: 'Vehicle Accessories',
        key: 'm_vehicle_accessories',
        type: 'child_array',
        tableName: 'm_vehicle_accessories',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Vehicle Accessories',
        columns: [
          { header: 'Part Type', key: 'part_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Part Types',
              query: 'select id, name from m_part_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Quantity', key: 'qty', type: 'number', width: 10 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Vehicle Attachments',
        key: 'm_vehicle_attachments',
        type: 'child_array',
        tableName: 'm_vehicle_attachments',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Vehicle Attachments',
        columns: [
          { header: 'Attachment Type', key: 'attachment_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Attachment Types',
              query: 'select id, name from m_attachment_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'File Name', key: 'file_name', type: 'text', width: 30 },
          { header: 'File Path', key: 'file_path', type: 'text', width: 40 },
          { header: 'File Size', key: 'file_size', type: 'number', width: 15 },
          { header: 'Upload Date', key: 'upload_date', type: 'date', width: 15 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Vehicle Compartments',
        key: 'm_vehicle_compartments',
        type: 'child_array',
        tableName: 'm_vehicle_compartments',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Vehicle Compartments',
        columns: [
          { header: 'Compartment Number', key: 'compartment_num', type: 'number', width: 15 },
          { header: 'Capacity', key: 'capacity', type: 'number', width: 15 },
          { header: 'UOM', key: 'uom', type: 'text', width: 10 },
          { header: 'Product Type', key: 'product_type', type: 'dropdown', dataType: 'number', width: 20, dropdown: {
              sheetName: 'Product Types',
              query: 'select id, name from m_product_type',
              labelField: 'name',
              valueField: 'id'
            }
          },
          { header: 'Is Active', key: 'is_active', type: 'checkbox', values: ['Y', 'N'], width: 10 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      },
      {
        header: 'Preventive Maintenance',
        key: 'm_vehicle_preventive_maintenance',
        type: 'child_array',
        tableName: 'm_vehicle_preventive_maintenance',
        parentKey: 'parent_id',
        foreignKey: 'id',
        sheetName: 'Preventive Maintenance',
        columns: [
          { header: 'Service ID', key: 'service_id', type: 'number', width: 12 },
          { header: 'From Date', key: 'fromdate', type: 'date', width: 15 },
          { header: 'To Date', key: 'todate', type: 'date', width: 15 },
          { header: 'Opening ODO', key: 'opening_odo', type: 'number', width: 12 },
          { header: 'Closing ODO', key: 'closing_odo', type: 'number', width: 12 },
          { header: 'Total KM', key: 'total_km', type: 'number', width: 12 },
          { header: 'Is Active', key: 'is_active', type: 'checkbox', values: ['Y', 'N'], width: 10 },
          { header: 'Jobcard ID', key: 'jobcard_id', type: 'text', width: 15 },
          { header: 'Jobcard No', key: 'jobcard_no', type: 'text', width: 15 },
          { header: 'Jobcard Detail ID', key: 'jobcard_detail_id', type: 'number', width: 15 },
          { header: 'ODO Next', key: 'odo_next', type: 'number', width: 12 },
          { header: 'Next Service Date', key: 'next_service_date', type: 'date', width: 18 },
          { header: 'UOM', key: 'uom', type: 'text', width: 8 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 }
        ]
      }
    ]
  };