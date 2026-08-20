const db = require('../../../config/database');

async function commit(databaseName, tableName, operation, id) {
  await db.executeQuery(
    databaseName,
    'EXEC [sp_subcon_commit] @tablename, @operation, @id',
    { tablename: tableName, operation, id },
    false
  );
}

module.exports = { commit };
