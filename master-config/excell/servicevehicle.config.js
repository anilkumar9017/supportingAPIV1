module.exports = {
        menuCode: 'service-vehicle',
        sheetName: 'Service History',
        tableName: 'm_vehicle_servicehistory',
        primaryKey: 'id',
        uniqueKey: 'id',

        columns: [
          { header: 'ID', key: 'id', type: 'number', width: 10 },
          { header: 'Parent ID', key: 'parent_id', type: 'number', width: 10 },
          { header: 'Service Type', key: 'servicetype', type: 'dropdown', dataType: 'number', width: 15, dropdown: {
            sheetName: 'Service Types',
            query: 'select id, name from m_routine_service_type',
            labelField: 'name',
            valueField: 'id'
           }
          },
          { header: 'Remarks', key: 'remarks', type: 'text', width: 30 },
          { header: 'Effective From', key: 'effective_from', type: 'date', width: 15 },
          { header: 'Valid Upto', key: 'valid_upto', type: 'date', width: 15 },
          { header: 'Odometer', key: 'odometer', type: 'number', width: 15 },
          { header: 'Jobcard ID', key: 'jobcard_id', type: 'text', width: 20 },
          { header: 'Next Odometer', key: 'next_odometer', type: 'number', width: 15 },
          { header: 'Next Service Date', key: 'next_servicedate', type: 'date', width: 18 },
          { header: 'JobCard Id', key: 'jobcard_lineid', type: 'number', width: 15 },
          { header: 'Service Interval', key: 'service_interval', type: 'text', width: 15},
          { header: 'UOM', key: 'uom', type: 'text', type: 'dropdown', dataType: 'text', width: 15, dropdown:{
            sheetName: 'UOMService',
            labelField: 'name',
            valueField: 'id',
            options: [{id : "K",name: "Kms"},{id : "D",name: "Days"},{id : "M",name: "Months"},{id : "H",name: "Hours"}]
          }
          }, 
          { header: 'KM', key: 'km', type: 'number', width: 10 }
        ]
}