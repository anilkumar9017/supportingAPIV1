const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const publicRoutes = require('./routes/public');
const authenticatedRoutes = require('./routes/authenticated');
const emailRoutes = require('./routes/email');
const importExportRoutes = require('./routes/importExportExcell.routes');
const { processWebhook } = require('./services/whapi/whapiService');

// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// Authenticated routes (require token)
app.use('/api/auth', authenticatedRoutes);

//email routes
app.use('/api/email', emailRoutes);

//import export excell routes
app.use('/api/ie', importExportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'dcclogsuiteapis'
  });
});
/**
 * Main webhook endpoint — Whapi.Cloud sends all events here
 */
app.post("/whapi/webhook", async (req, res) => {
  // Acknowledge immediately to prevent timeouts
  res.sendStatus(200);
  // console.log("Received webhook payload:", req.body, config.number);
  try {
    await processWebhook(req.body);
  } catch (err) {
    logger.error(`Webhook processing error: ${err.message}`);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Public APIs: http://localhost:${PORT}/api/public`);
  console.log(`🔐 Authenticated APIs: http://localhost:${PORT}/api/auth`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;

