
/* 
    * insert records
*/
async function insertRecord({transaction, db, databaseName, tableName, row, useApi}) {
  const query = db.buildInsertQuery("mssql", tableName, row);

  await db.executeTransactionQuery("mssql", transaction, query, row);
}


/* 
    * update records
*/
async function updateRecord({transaction, db, databaseName, tableName, row, id}) {
  const query = buildUpdateQuery("mssql", tableName, row, "id", id);
  await db.executeTransactionQuery("mssql", transaction, query, {
    ...row,
    id,
  });
}

/* generate build query */
function buildUpdateQuery(dbType, tableName, row, primaryKey = 'id', primaryValue) {

    const columns  = Object.keys(row).filter(col => col !== primaryKey);
    let query = '';
    switch (dbType) {
        case 'mssql':
            query = `
                UPDATE ${tableName}
                SET
                ${columns.map(
                    col => `${col} = @${col}`
                ).join(',')}
                WHERE ${primaryKey} = @id
            `;

            break;
    }

    return query;
}

module.exports = {
    insertRecord,
    updateRecord
}