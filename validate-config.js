const {validateConfig} = require('./services/excell/excell-config-validator');
const config = require('./master-config/excell/project.config.js');

const result = validateConfig(config, 'project');

console.log('\n✅ CONFIG VALIDATION RESULT:');
console.log('Valid:', result.valid);
console.log('Errors:', result.errors.length > 0 ? result.errors : 'None');
console.log('Warnings:', result.warnings.length > 0 ? result.warnings : 'None');

console.log('\n📊 CONFIG STRUCTURE:');
console.log('Menu Code:', config.menuCode);
console.log('Sheet Name:', config.sheetName);
console.log('Table Name:', config.tableName);
console.log('Primary Key:', config.primaryKey);
console.log('Unique Key:', config.uniqueKey);
console.log('Total Columns:', config.columns.length);

console.log('\n📋 COLUMNS BREAKDOWN:');
config.columns.forEach((col, i) => {
  const width = col.width || 'default';
  console.log(`  [${i+1}] ${col.key}: type=${col.type}, header=${col.header}, width=${width}`);
  if (col.type === 'dropdown') {
    console.log(`      └─ Query: ${col.dropdown.query}`);
    console.log(`      └─ Label: ${col.dropdown.labelField}, Value: ${col.dropdown.valueField}`);
  }
  if (col.type === 'checkbox') {
    console.log(`      └─ Values: ${col.values.join(', ')}`);
  }
  if (col.required) {
    console.log(`      └─ Required: true`);
  }
});
