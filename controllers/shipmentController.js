const db = require('../config/database');

/**
 * Get shipment by tracking number (public access)
 */
async function getShipmentByTracking(req, res) {
  try {
    const { trackingNumber } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }
    
    const query = 'SELECT * FROM Shipments WHERE tracking_number = @trackingNumber';
    const result = await db.executeQuery(databaseName, query, { trackingNumber }, useApi);
    
    if (result && result.length > 0) {
      res.json({
        success: true,
        data: result[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
  } catch (error) {
    console.error('Error fetching shipment by tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get all shipments (authenticated)
 */
async function getAllShipments(req, res) {
  try {
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const query = 'SELECT * FROM Shipments ORDER BY created_at DESC';
    const result = await db.executeQuery(databaseName, query, {}, useApi);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get shipment by ID (authenticated)
 */
async function getShipmentById(req, res) {
  try {
    const { id } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const query = 'SELECT * FROM Shipments WHERE id = @id';
    const result = await db.executeQuery(databaseName, query, { id }, useApi);
    
    if (result && result.length > 0) {
      res.json({
        success: true,
        data: result[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Create new shipment (authenticated)
 */
async function createShipment(req, res) {
  try {
    const { tracking_number, origin, destination, status, weight } = req.body;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    if (!tracking_number || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'tracking_number, origin, and destination are required'
      });
    }
    
    const insertQuery = `
      INSERT INTO Shipments (tracking_number, origin, destination, status, weight, created_at)
      VALUES (@tracking_number, @origin, @destination, @status, @weight, GETDATE())
    `;
    
    await db.executeQuery(databaseName, insertQuery, {
      tracking_number,
      origin,
      destination,
      status: status || 'pending',
      weight: weight || null
    }, useApi);
    
    res.status(201).json({
      success: true,
      message: 'Shipment created successfully'
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Update shipment (authenticated)
 */
async function updateShipment(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const allowedFields = ['tracking_number', 'origin', 'destination', 'status', 'weight'];
    const updates = [];
    const params = { id };
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = @${field}`);
        params[field] = updateData[field];
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const query = `
      UPDATE Shipments 
      SET ${updates.join(', ')}, updated_at = GETDATE()
      WHERE id = @id
    `;
    
    await db.executeQuery(databaseName, query, params, useApi);
    
    res.json({
      success: true,
      message: 'Shipment updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Delete shipment (authenticated)
 */
async function deleteShipment(req, res) {
  try {
    const { id } = req.params;
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName || 'default';
    
    const query = 'DELETE FROM Shipments WHERE id = @id';
    await db.executeQuery(databaseName, query, { id }, useApi);
    
    res.json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = {
  getShipmentByTracking,
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment
};

