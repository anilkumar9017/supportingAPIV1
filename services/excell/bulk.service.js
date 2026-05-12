
/* 
    * insert records
    * This function is responsible for inserting a new record into the specified table within a transaction. It builds an insert query based on the provided row data and executes it using the database connection. The use of transactions ensures that the operation is atomic, allowing for rollback in case of any errors during the insertion process, which helps maintain data integrity in the database.
    * Parameters:
    * - transaction: The database transaction object to ensure atomicity of the operation.
    * - db: The database connection instance used to execute the query.
    * databaseName: The name of the database where the table is located, which is used for logging and cache management purposes.
    * - tableName: The name of the table where the record will be inserted.
    * - row: An object representing the data to be inserted, where keys are column names and values are the corresponding values for those columns.
    * - useApi: A boolean flag indicating whether to use API-based database access or direct database connection, which can affect how the query is executed and how the database connection is managed.
*/
async function insertRecord({transaction, db, databaseName, tableName, row, useApi}) {
  const query = db.buildInsertQuery("mssql", tableName, row);

  await db.executeTransactionQuery("mssql", transaction, query, row);
}


/* 
    * update records
    * This function is responsible for updating an existing record in the specified table within a transaction. It builds an update query based on the provided row data and the primary key value, and executes it using the database connection. Similar to the insert function, using transactions ensures that the update operation is atomic, allowing for rollback in case of any errors during the update process, which helps maintain data integrity in the database.
    * Parameters:
    * - transaction: The database transaction object to ensure atomicity of the operation.
    * - db: The database connection instance used to execute the query.
    * databaseName: The name of the database where the table is located, which is used for logging and cache management purposes.
    * tableName: The name of the table where the record will be updated.
    * row: An object representing the data to be updated, where keys are column names and values are the corresponding values for those columns. This object should include the primary key value to identify which record to update.
    * id: The value of the primary key for the record that needs to be updated, which is used in the WHERE clause of the update query to ensure that the correct record is modified.
*/
async function updateRecord({transaction, db, databaseName, tableName, row, id}) {
  const query = buildUpdateQuery("mssql", tableName, row, "id", id);
  await db.executeTransactionQuery("mssql", transaction, query, {
    ...row,
    id,
  });
}

/* 
    generate build query for update records
        * This function generates an SQL update query string based on the provided database type, table name, row data, primary key, and primary key value. It constructs the SET clause of the update statement by iterating over the keys of the row object (excluding the primary key) and creating parameterized placeholders for each column. The WHERE clause is constructed using the primary key to ensure that only the intended record is updated. This function abstracts away the differences in SQL syntax for different database types, allowing for flexible query generation based on the specified database.
        * Parameters:
        * - dbType: The type of the database (e.g., 'mssql', 'mysql', etc.) which can be used to tailor the query syntax if needed.
        * - tableName: The name of the table where the record will be updated.
        * row: An object representing the data to be updated, where keys are column names and values are the corresponding values for those columns. This object should include the primary key value to identify which record to update.
        * primaryKey: The name of the primary key column, which is used in the WHERE clause to identify the record to be updated.
        * primaryValue: The value of the primary key for the record that needs to be updated, which is used in the WHERE clause of the update query to ensure that the correct record is modified.
*/
function buildUpdateQuery(dbType, tableName, row, primaryKey = 'id', primaryValue) {
    // Extract column names from the row object, excluding the primary key, to construct the SET clause of the update statement. This allows for dynamic generation of the update query based on the provided data, ensuring that only the relevant columns are included in the update operation while maintaining the integrity of the primary key.
    const columns  = Object.keys(row).filter(col => col !== primaryKey);
    let query = '';
    switch (dbType) {
        case 'mssql':
            // Build the update query with parameterized placeholders for each column, and include a WHERE clause to target the specific record based on the primary key. This approach helps prevent SQL injection attacks by using parameterized queries, and ensures that the update operation is performed on the correct record in the database.
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