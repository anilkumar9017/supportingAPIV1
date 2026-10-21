const crypto = require('crypto');

function authenticateGeofenceWebhook(req, res, next) {
  const configuredKey = "gfn_8c7e2a9d4f6b1e0c5a3d9f72b8e4c601"; //process.env.geofence_api_key;

  if (!configuredKey) {
    console.error('Geofence webhook key is not configured');
    return res.status(500).json({
      success: false,
      message: 'Webhook authentication is not configured'
    });
  }

  const providedKey = req.get('X-Webhook-Key');
  if (!providedKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const expected = Buffer.from(configuredKey, 'utf8');
  const provided = Buffer.from(providedKey, 'utf8');

  if (
    expected.length !== provided.length ||
    !crypto.timingSafeEqual(expected, provided)
  ) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (!req.get('X-Domain')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  next();
}

module.exports = {
  authenticateGeofenceWebhook
};
