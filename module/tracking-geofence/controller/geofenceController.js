const geofenceService = require('../services/geofenceService');

/* 
    this controller handles geofence events received from the tracking system. It validates the incoming event payload, ensures the database name is resolved, and updates the corresponding tracking record in the database.
*/
async function receiveEvent(req, res) {
  const {
    trackingNumber,
    geofenceStatus,
    latitude,
    longitude,
    eventTimestamp
  } = req.body || {};

  if (
    typeof trackingNumber !== 'string' ||
    trackingNumber.trim().length === 0 ||
    trackingNumber.length > 100 ||
    typeof geofenceStatus !== 'string' ||
    geofenceStatus.trim().length === 0 ||
    geofenceStatus.length > 100 ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof eventTimestamp !== 'string' ||
    Number.isNaN(Date.parse(eventTimestamp))
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid event payload'
    });
  }

  if (!req.databaseName) {
    return res.status(400).json({
      success: false,
      message: 'Database name not resolved'
    });
  }

  try {
    const updated = await geofenceService.updateEvent(req.databaseName, {
      trackingNumber: trackingNumber.trim(),
      geofenceStatus: geofenceStatus.trim(),
      latitude,
      longitude,
      eventTimestamp: new Date(eventTimestamp)
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }

    return res.json({
      success: true,
      message: 'Geofence event received',
      trackingNumber: trackingNumber.trim()
    });
  } catch (error) {
    console.error('Error updating geofence event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update geofence event'
    });
  }
}

module.exports = {
  receiveEvent
};