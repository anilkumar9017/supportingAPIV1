const db = require('../../../config/database');

async function commit(databaseName, tableName, operation, id) {
  await db.executeQuery(
    databaseName,
    'EXEC [sp_subcon_commit] @tablename, @operation, @id',
    { tablename: tableName, operation, id },
    false
  );
}

async function processEmailEvent(databaseName, tableName, operation, id) {
  const rows = await db.executeQuery(
    databaseName,
    `
      DECLARE @error INT = NULL;
      DECLARE @error_message NVARCHAR(200) = NULL;
      DECLARE @startedAt DATETIME = GETDATE();

      EXEC [dbo].[sp_fm_process_email_event]
        @table_name = @tableName,
        @id = @id,
        @transaction_type = @operation,
        @error = @error OUTPUT,
        @error_message = @error_message OUTPUT;

      SELECT
        @error AS error,
        @error_message AS error_message,
        CASE WHEN @error = 1008 THEN
          (
            SELECT
              id AS ID,
              email_event_config_id AS Email_Event_Config_Id,
              entityid AS EntityId,
              child_id AS ChildId,
              combined_ids AS CombinedIds
            FROM [dbo].[d_email_queue]
            WHERE entityid = @id
              AND tgr_status = 'N'
              AND createdate >= @startedAt
            ORDER BY id
            FOR JSON PATH, INCLUDE_NULL_VALUES
          )
        ELSE '[]' END AS queue_items;
    `,
    { tableName, id, operation },
    false
  );

  const result = rows?.[0];
  if (result?.error !== 1008) {
    return [];
  }

  return JSON.parse(result.queue_items || '[]');
}

module.exports = { commit, processEmailEvent };
