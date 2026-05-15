module.exports = {
  menuCode: 'employee-master',
  sheetName: 'Employees',
  tableName: 'm_employee',
  primaryKey: 'id',
  uniqueKey: 'code',
  columns: [
    { header: 'Code', key: 'code', type: 'text', width: 30, required: true },
    { header: 'First Name', key: 'first_name', type: 'text', width: 30, required: true },
    { header: 'Middle Name', key: 'middle_name', type: 'text', width: 30 },
    { header: 'Last Name', key: 'last_name', type: 'text', width: 30, required: true },
    { header: 'Father Name', key: 'father_name', type: 'text', width: 30 },
    { header: 'Sex', key: 'sex', type: 'dropdown', width: 10, dropdown: { sheetName: 'Sex', labelField: 'name', valueField: 'value', options: [ { name: 'Male', value: 'M' }, { name: 'Female', value: 'F' }, { name: 'Other', value: 'O' } ] } },
    { header: 'Job Title', key: 'job_title', type: 'text', width: 30 },
    { header: 'Employee Type', key: 'emp_type', type: 'text', width: 20 },
    { header: 'Department', key: 'department', type: 'dropdown', dataType: 'number', width: 25, dropdown: { sheetName: 'Departments', query: 'select id, name from m_department', labelField: 'name', valueField: 'id' } },
    { header: 'Branch', key: 'branch', type: 'dropdown', dataType: 'number', width: 25, dropdown: { sheetName: 'Branch', query: "select id, name from m_branch", labelField: 'name', valueField: 'id' } },
    { header: 'Work Street', key: 'work_street', type: 'text', width: 30 },
    { header: 'Work Block', key: 'work_block', type: 'text', width: 20 },
    { header: 'Work Zip', key: 'work_zip', type: 'text', width: 20 },
    { header: 'Work City', key: 'work_city', type: 'text', width: 25 },
    { header: 'Work County', key: 'work_county', type: 'text', width: 20 },
    { header: 'Work Country', key: 'work_country', type: 'dropdown', width: 20, dropdown: { sheetName: 'Countries', query: "select id, code from m_country", labelField: 'code', valueField: 'id' } },
    { header: 'Work State', key: 'work_state', type: 'text', width: 20 },
    { header: 'Work Building', key: 'work_build', type: 'text', width: 20 },
    { header: 'Manager', key: 'manager_id', type: 'dropdown', dataType: 'number', width: 30, dropdown: { sheetName: 'Managers', query: 'select id, code from m_employee', labelField: 'code', valueField: 'id' } },
    { header: 'User', key: 'user_id', type: 'dropdown', dataType: 'number', width: 30, dropdown: { sheetName: 'Users', query: 'select id, user_name from m_users', labelField: 'user_name', valueField: 'id' } },
    { header: 'Sales Person', key: 'sales_person', type: 'text', width: 30 },
    { header: 'Office Telephone', key: 'office_telephone', type: 'text', width: 25 },
    { header: 'Office Extension', key: 'office_extension', type: 'text', width: 20 },
    { header: 'Mobile No', key: 'mobile_no', type: 'text', width: 20 },
    { header: 'Pager', key: 'pager', type: 'text', width: 20 },
    { header: 'Home Telephone', key: 'home_telephone', type: 'text', width: 25 },
    { header: 'Fax', key: 'fax', type: 'text', width: 20 },
    { header: 'Email', key: 'email', type: 'text', width: 40 },
    { header: 'Start Date', key: 'start_date', type: 'date', width: 20 },
    { header: 'Status', key: 'status', type: 'number', width: 15 },
    { header: 'Salary', key: 'salary', type: 'number', width: 20 },
    { header: 'Salary Unit', key: 'salary_unit', type: 'text', width: 15 },
    { header: 'Employee Cost', key: 'employee_cost', type: 'number', width: 20 },
    { header: 'Employee Cost Unit', key: 'employee_cost_unit', type: 'text', width: 15 },
    { header: 'Termination Date', key: 'termination_date', type: 'date', width: 20 },
    { header: 'Termination Reason', key: 'termination_reason', type: 'text', width: 30 },
    { header: 'Bank Code', key: 'bank_code', type: 'text', width: 20 },
    { header: 'Bank Branch', key: 'bank_branch', type: 'text', width: 25 },
    { header: 'Bank Branch No', key: 'bank_bran_no', type: 'text', width: 20 },
    { header: 'Bank Account', key: 'bank_acount', type: 'text', width: 30 },
    { header: 'Home Street', key: 'home_street', type: 'text', width: 30 },
    { header: 'Home Block', key: 'home_block', type: 'text', width: 20 },
    { header: 'Home Zip', key: 'home_zip', type: 'text', width: 20 },
    { header: 'Home City', key: 'home_city', type: 'text', width: 25 },
    { header: 'Home County', key: 'home_county', type: 'text', width: 20 },
    { header: 'Home Country', key: 'home_country', type: 'dropdown', width: 20, dropdown: { sheetName: 'Countries', query: "select id, code from m_country", labelField: 'code', valueField: 'id' } },
    { header: 'Home State', key: 'home_state', type: 'text', width: 20 },
    { header: 'Home Building', key: 'home_build', type: 'text', width: 20 },
    { header: 'Birth Date', key: 'birth_date', type: 'date', width: 20 },
    { header: 'Birth Country', key: 'brth_country', type: 'dropdown', width: 20, dropdown: { sheetName: 'Countries', query: "select id, code from m_country", labelField: 'code', valueField: 'id' } },
    { header: 'Marital Status', key: 'marital_status', type: 'text', width: 20 },
    { header: 'No of Children', key: 'no_children', type: 'number', width: 20 },
    { header: 'Government ID', key: 'government_id', type: 'text', width: 30 },
    { header: 'Citizenship', key: 'citizenship', type: 'dropdown', width: 20, dropdown: { sheetName: 'Countries', query: "select id, code from m_country", labelField: 'code', valueField: 'id' } },
    { header: 'Passport No', key: 'passport_no', type: 'text', width: 25 },
    { header: 'Passport Expiry', key: 'passport_expiry', type: 'date', width: 20 },
    { header: 'Picture', key: 'picture', type: 'text', width: 40 },
    { header: 'Remarks', key: 'remarks', type: 'text', width: 40 },
    { header: 'Attachment', key: 'attachment', type: 'text', width: 40 },
    { header: 'Salary Currency', key: 'salary_currency', type: 'dropdown', dataType: 'number', width: 20, dropdown: { sheetName: 'Currencies', query: "select id, code from m_currency", labelField: 'code', valueField: 'id' } },
    { header: 'Employee Cost Currency', key: 'emp_cost_currency', type: 'dropdown', dataType: 'number', width: 20, dropdown: { sheetName: 'Currencies', query: "select id, code from m_currency", labelField: 'code', valueField: 'id' } },
    { header: 'Position', key: 'position', type: 'dropdown', dataType: 'number', width: 25, dropdown: { sheetName: 'Positions', query: 'select id, name from m_position', labelField: 'name', valueField: 'id' } },
    { header: 'Cost Center', key: 'cost_center', type: 'dropdown', dataType: 'number', width: 25, dropdown: { sheetName: 'Cost Centers', query: 'select id, name from m_cost_center', labelField: 'name', valueField: 'id' } },
    { header: 'External Employee No', key: 'ext_emp_no', type: 'text', width: 25 },
    { header: 'Birth Place', key: 'birth_place', type: 'text', width: 30 },
    { header: 'Is Active', key: 'is_active', type: 'dropdown', width: 15, dropdown: { sheetName: 'IsActive', labelField: 'name', valueField: 'value', options: [ { name: 'Yes', value: 'Y' }, { name: 'No', value: 'N' } ] } },
    { header: 'Passport Issue', key: 'passport_issue', type: 'date', width: 20 },
    { header: 'Passport Issuer', key: 'passport_issuer', type: 'text', width: 30 },
    { header: 'Linked Vendor', key: 'linked_vendor', type: 'text', width: 30 },
    { header: 'Natural Person', key: 'natural_person', type: 'dropdown', width: 15, dropdown: { sheetName: 'NaturalPerson', labelField: 'name', valueField: 'value', options: [ { name: 'Yes', value: 'Y' }, { name: 'No', value: 'N' } ] } },
    { header: 'External Code', key: 'external_code', type: 'text', width: 25 },
    { header: 'External Employee Code', key: 'ext_emp_code', type: 'text', width: 25 },
    { header: 'Per Hour Rate', key: 'per_hour_rate', type: 'number', width: 20 },
    { header: 'Payable Account', key: 'payable_acct', type: 'text', width: 30 },
    { header: 'Down Payment Account', key: 'down_pymnt_acct', type: 'text', width: 30 },
    {
      header: 'Employee Absence',
      key: 'm_employee_absence',
      type: 'child_array',
      sheetName: 'Employee Absence',
      tableName: 'm_employee_absence',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Attachments',
      key: 'm_employee_attachment',
      type: 'child_array',
      sheetName: 'Employee Attachments',
      tableName: 'm_employee_attachment',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Education',
      key: 'm_employee_education',
      type: 'child_array',
      sheetName: 'Employee Education',
      tableName: 'm_employee_education',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Employer',
      key: 'm_employee_employer',
      type: 'child_array',
      sheetName: 'Employee Employers',
      tableName: 'm_employee_employer',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Reviews',
      key: 'm_employee_reviews',
      type: 'child_array',
      sheetName: 'Employee Reviews',
      tableName: 'm_employee_reviews',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Roles',
      key: 'm_employee_role',
      type: 'child_array',
      sheetName: 'Employee Roles',
      tableName: 'm_employee_role',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    },
    {
      header: 'Employee Teams',
      key: 'm_employee_team',
      type: 'child_array',
      sheetName: 'Employee Teams',
      tableName: 'm_employee_team',
      parentKey: 'parent_id',
      columns: [
        { header: 'ID', key: 'id', type: 'number', width: 10 }
      ]
    }
  ]
};
