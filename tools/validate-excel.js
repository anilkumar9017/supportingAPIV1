#!/usr/bin/env node
const path = require('path');
const db = require('../config/database');
const svc = require('../services/excell/excell-hierarchical.service');

// This script allows validating an Excel file against the expected format for a given menu code.
// Usage: node tools/validate-excel.js <menuCode> <filePath> [databaseName]
// Example: node tools/validate-excel.js project ./test-files/project-sample.xlsx my_database
// node tools/validate-excel.js vehicle "C:\\Users\\AST AFSR\\Downloads\\vehicle 16 8.xlsx" DCCBusinessSuite_mowara_test
async function main() {
  const [, , menuCode, filePath, databaseName] = process.argv;
  if (!menuCode || !filePath) {
    console.error('Usage: node tools/validate-excel.js <menuCode> <filePath> [databaseName]');
    process.exit(2);
  }
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  try {
    const result = await svc.validateExcelFile(menuCode, absPath, db, databaseName || process.env.DEFAULT_DB_NAME || 'default', false);
    console.log('Validation result:');
    console.log(JSON.stringify(result, null, 2));
    if (Array.isArray(result.fixes) && result.fixes.length > 0) {
      console.log('\nAuto-fixes applied:');
      console.log(JSON.stringify(result.fixes, null, 2));
    }
    process.exit(result.valid ? 0 : 3);
  } catch (err) {
    console.error('Error running validation:', err);
    process.exit(1);
  }
}

main();
