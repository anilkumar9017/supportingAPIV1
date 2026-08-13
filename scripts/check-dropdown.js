const db = require('./config/database');
(async () => {
  try {
    const databaseName = process.argv[2] || '';
    const rows = await db.executeQuery(databaseName, 'select id, name from m_department', {}, false);
    console.log('rows.length =', rows.length);
    console.log(JSON.stringify(rows.slice(0,10), null, 2));
    if (rows.length) console.log('firstRowKeys =', Object.keys(rows[0]));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

/* node check-dropdown.js <databaseName> */