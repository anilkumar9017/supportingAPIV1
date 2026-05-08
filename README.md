# DCC Log Suite APIs

Express.js backend API server with public and authenticated routes, dynamic database configuration, and token-based authentication.

## Features

- ✅ Public APIs (no authentication required)
- ✅ Authenticated APIs (JWT token required)
- ✅ Dynamic database configuration from external API
- ✅ Support for multiple database types (MSSQL, MySQL, PostgreSQL)
- ✅ Connection pooling
- ✅ Token-based authentication
- ✅ CORS enabled
- ✅ Error handling

## Project Structure

```
dcclogsuiteapis/
├── config/
│   └── database.js          # Database connection manager
├── controllers/              # Business logic controllers
│   ├── agreementController.js
│   ├── shipmentController.js
│   └── configController.js
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── public.js            # Public API routes
│   └── authenticated.js     # Authenticated API routes
├── services/
│   └── configService.js     # Configuration service
├── .env.example            # Environment variables example
├── .gitignore
├── package.json
├── server.js                # Main server file
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=3000
JWT_SECRET=your-secret-key
DB_CONFIG_API_URL=http://localhost:5000/api/config/database
DB_CONFIG_API_TOKEN=your-api-token
```

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## API Endpoints

### Public Endpoints (No Authentication)

- `GET /health` - Health check
- `GET /api/public/health` - Public API health check
- `GET /api/public/agreement/:guid` - Get agreement by GUID (for public signature page)
- `PUT /api/public/agreement/:guid/sign` - Submit signed agreement
- `GET /api/public/config/database/:id` - Get database config (limited info)

### Authenticated Endpoints (Require JWT Token)

**Headers Required:**
```
Authorization: Bearer <your-jwt-token>
```

- `GET /api/auth/agreements` - Get all agreements (with optional status filter)
- `GET /api/auth/agreement/:id` - Get agreement by ID
- `POST /api/auth/agreement` - Create new agreement
- `PUT /api/auth/agreement/:id` - Update agreement
- `DELETE /api/auth/agreement/:id` - Delete agreement
- `POST /api/auth/agreement/:id/send-email` - Send agreement email
- `GET /api/auth/config/database/:id` - Get full database configuration

## Database Configuration

The API uses a hybrid approach for database configuration:

### Public Routes (API Call)
- **Public routes** (`/api/public/*`) call an external API to fetch **only the database name**
- All other database settings (host, port, user, password, type) come from `.env` file
- **API Response Format** (should return only database name):
  ```json
  {
    "success": true,
    "data": "database_name"
  }
  ```
  OR
  ```json
  {
    "success": true,
    "data": {
      "database": "database_name"
    }
  }
  ```
  OR simply:
  ```json
  "database_name"
  ```

### Authenticated Routes (.env Only)
- **Authenticated routes** (`/api/auth/*`) use database configuration **directly from `.env` file**
- No API call is made for authenticated routes
- All settings come from environment variables

### Environment Variables (.env)
All database settings (except database name for public routes) come from `.env`:
```env
DEFAULT_DB_TYPE=mssql
DEFAULT_DB_HOST=localhost
DEFAULT_DB_PORT=1433
DEFAULT_DB_NAME=your_database  # Used as fallback for public routes
DEFAULT_DB_USER=sa
DEFAULT_DB_PASSWORD=your_password
DEFAULT_DB_ENCRYPT=false
DEFAULT_DB_TRUST_CERT=true
```

### Configuration API Setup
- Set `DB_CONFIG_API_URL` in `.env` to the endpoint that returns database name
- Set `DB_CONFIG_API_TOKEN` for API authentication
- If API is unavailable, public routes fallback to `DEFAULT_DB_NAME` from `.env`

## Authentication

### Generating JWT Tokens

You can generate tokens using the `generateToken` function:

```javascript
const { generateToken } = require('./middleware/auth');
const token = generateToken({ userId: 123, username: 'user' });
```

### Using Tokens

Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Database Support

- **MSSQL/SQL Server**: Full support
- **MySQL/MariaDB**: Full support
- **PostgreSQL**: Full support

Connection pools are automatically created and cached per database configuration.

## Error Handling

All errors return a consistent format:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error message"
}
```

## Development

### Architecture

The project follows a **Controller-Route** pattern:

- **Routes** (`routes/`) - Handle HTTP requests/responses and route definitions
- **Controllers** (`controllers/`) - Contain business logic and database operations
- **Middleware** (`middleware/`) - Handle cross-cutting concerns (authentication, etc.)
- **Services** (`services/`) - External service integrations
- **Config** (`config/`) - Configuration and database setup

### Adding New Routes

1. **Create Controller Function** in `controllers/yourController.js`:
```javascript
async function yourFunction(req, res) {
  try {
    const useApi = req.useApi || false; // Set by route middleware
    // Your business logic here
    const result = await db.executeQuery('default', query, params, useApi);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { yourFunction };
```

2. **Add Route** in `routes/public.js` or `routes/authenticated.js`:
```javascript
const yourController = require('../controllers/yourController');

// Public route
router.get('/your-endpoint', yourController.yourFunction);

// Authenticated route (already has auth middleware)
router.get('/your-endpoint', yourController.yourFunction);
```

### Database Queries in Controllers

Use the database helper in controllers:
```javascript
const db = require('../config/database');

// Get useApi from request (set by route middleware)
const useApi = req.useApi || false;

// Execute query
const result = await db.executeQuery('default', 'SELECT * FROM Table', {}, useApi);
```

**Note**: The `useApi` flag is automatically set by route middleware:
- `req.useApi = true` for public routes (fetch DB name from API)
- `req.useApi = false` for authenticated routes (use .env directly)

## License

ISC

