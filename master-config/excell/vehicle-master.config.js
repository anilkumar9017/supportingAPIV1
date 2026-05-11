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
  
      // Child Arrays
      /* {
        header: 'Vehicle Service History',
        key: 'm_vehicle_servicehistory',
        type: 'child_array',
        tableName: 'm_vehicle_servicehistory',
        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 20 },
          { header: 'Parent ID', key: 'parent_id', type: 'number', width: 20 },
          { header: 'Maintenance Type', key: 'maintenance_type', type: 'number', width: 20 },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 },
          { header: 'Effective From', key: 'effective_from', type: 'date', width: 20 },
          { header: 'Valid Upto', key: 'valid_upto', type: 'date', width: 20 },
          { header: 'Service Type', key: 'servicetype', type: 'number', width: 20 },
          { header: 'Odometer', key: 'odometer', type: 'number', width: 20 },
          { header: 'Jobcard ID', key: 'jobcard_id', type: 'number', width: 20 },
          { header: 'Next Odometer', key: 'next_odometer', type: 'number', width: 20 },
          { header: 'Next Service Date', key: 'next_servicedate', type: 'date', width: 20 },
          { header: 'Jobcard Line ID', key: 'jobcard_lineid', type: 'number', width: 20 },
          { header: 'Service Interval', key: 'service_interval', type: 'text', width: 20 },
          { header: 'UOM', key: 'uom', type: 'text', width: 20 },
          { header: 'KM', key: 'km', type: 'number', width: 20 }
        ]
      },
      { header: 'Vehicle License', key: 'm_vehicle_license', type: 'child_array', tableName: 'm_vehicle_license', columns: [] },
      { header: 'Vehicle Accessories', key: 'm_vehicle_accessories', type: 'child_array', tableName: 'm_vehicle_accessories', columns: [] },
      { header: 'Vehicle Attachments', key: 'm_vehicle_attachments', type: 'child_array', tableName: 'm_vehicle_attachments', columns: [] },
      { header: 'Vehicle Compartments', key: 'm_vehicle_compartments', type: 'child_array', tableName: 'm_vehicle_compartments', columns: [] },
      { header: 'Vehicle Preventive Maintenance', key: 'm_vehicle_preventive_maintenance', type: 'child_array', tableName: 'm_vehicle_preventive_maintenance', columns: [] } */
    ]
  };