const db = require('../../../config/database');

async function updateEvent(databaseName, event) {
  // Replace this placeholder table and columns with the tracking schema.
  const query = `
    UPDATE tracking_geofence_status
    SET geofence_status = @geofenceStatus,
        latitude = @latitude,
        longitude = @longitude,
        event_timestamp = @eventTimestamp
    OUTPUT INSERTED.tracking_number
    WHERE tracking_number = @trackingNumber
  `;

  const result = await db.executeQuery(databaseName, query, event, true);
  return Array.isArray(result) && result.length > 0;
}

module.exports = {
  updateEvent
};