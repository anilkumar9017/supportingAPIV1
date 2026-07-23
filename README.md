# DCC Log Suite APIs

Express.js backend API server for DCC Log Suite with public, authenticated, and subcontractor-specific routes.

## Overview

This project provides a multi-tenant API layer with token-based authentication and dynamic database resolution.

It supports:

- public endpoints without authentication
- authenticated NG app routes with JWT tokens
- subcontractor-specific CRUD access via dedicated subcontractor tokens
- dynamic database lookup from external config API or `.env`
- multiple database types: MSSQL, MySQL, PostgreSQL

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
supportingAPIV1/
├── config/
│   ├── database.js          # Database connection manager
│   └── swagger.js           # Swagger configuration
├── controllers/             # Business logic controllers
│   ├── agreementController.js
│   ├── approvalController.js
│   ├── excellController.js
│   ├── powerBiController.js
│   ├── shipmentController.js
│   ├── syncController.js
│   └── udqController.js
├── middleware/              # Application middleware
│   ├── auth.js              # JWT authentication middleware
│   ├── domainMiddleware.js  # Database resolution middleware
│   └── upload.js            # File upload middleware
├── module/
│   └── subcon/              # Subcontractor module
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── routes/                  # API route definitions
│   ├── authenticated.js
│   ├── email.js
│   ├── excel.routes.js
│   ├── public.js
│   └── sanaga.routes.js
├── services/                # External and shared services
│   ├── configService.js
│   └── excell/
├── tools/
│   └── validate-excel.js
├── .env.example             # Example environment variables
├── package.json
├── README.md
└── server.js                # Main server entry point
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update values:

```bash
copy .env.example .env
```

3. Configure environment variables in `.env`.

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Environment Variables

Configure the application with these variables:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
DB_CONFIG_API_URL=http://localhost:5000/api/config/database
DB_CONFIG_API_TOKEN=your-api-token
DEFAULT_DB_TYPE=mssql
DEFAULT_DB_HOST=localhost
DEFAULT_DB_PORT=1433
DEFAULT_DB_NAME=your_database
DEFAULT_DB_USER=sa
DEFAULT_DB_PASSWORD=your_password
DEFAULT_DB_CONNECTION_TIMEOUT_MS=300000
DEFAULT_DB_REQUEST_TIMEOUT_MS=300000
MAX_UPLOAD_FILE_SIZE_BYTES=20971520
```

## API Endpoints

### Health

- `GET /health` - Server health check

### Public Endpoints (No Authentication)

- `GET /api/public/*` - Public domain-based endpoints

### Authenticated NG Routes

**Headers Required:**

```
Authorization: Bearer <your-jwt-token>
```

- `GET /api/subcon/users` - Get subcontractor users list
- `POST /api/subcon/contractor-token` - Issue subcontractor-scoped token

### Subcontractor Routes

These routes require `subconToken`.

- `POST /api/subcon/auth/login`
- `POST /api/subcon/contractor-token`
- `GET /api/subcon/users/:id`
- `POST /api/subcon/users`
- `PUT /api/subcon/users/:id`
- `DELETE /api/subcon/users/:id`
- `GET /api/subcon/agreements`
- `POST /api/subcon/agreements/accept`
- `GET /api/subcon/load-agreements`
- `POST /api/subcon/load-agreements`
- `GET /api/subcon/load-agreements/:id`
- `PUT /api/subcon/load-agreements/:id`
- `DELETE /api/subcon/load-agreements/:id`
- `GET /api/subcon/shipments`
- `GET /api/subcon/shipments/:id`
- `PUT /api/subcon/shipments/:id`
- `POST /api/subcon/shipments/:id/upload-pod`
- `GET /api/subcon/vehicles`
- `GET /api/subcon/vehicles/:id`
- `POST /api/subcon/vehicles`
- `PUT /api/subcon/vehicles/:id`
- `DELETE /api/subcon/vehicles/:id`
- `GET /api/subcon/subcontractors`
- `GET /api/subcon/subcontractors/:id`
- `POST /api/subcon/subcontractors`
- `PUT /api/subcon/subcontractors/:id`
- `DELETE /api/subcon/subcontractors/:id`
- `GET /api/subcon/incidents`
- `GET /api/subcon/incidents/:id`
- `POST /api/subcon/incidents`
- `PUT /api/subcon/incidents/:id`
- `DELETE /api/subcon/incidents/:id`
- `POST /api/subcon/shipments/milestone`
- `POST /api/subcon/shipments/advance`
- `GET /api/subcon/financials`
- `GET /api/subcon/dashboard/overview`
- `GET /api/subcon/action-center`
- `POST /api/subcon/financials/upload`

## Database Configuration

The API uses a hybrid approach for database configuration.

### Public Routes (API Call)

- Public routes (`/api/public/*`) call an external API to fetch only the database name.
- All other database settings (host, port, user, password, type) come from `.env`.

**API Response Format** should return the database name in one of these forms:

```json
{
  "success": true,
  "data": "database_name"
}
```

or

```json
{
  "success": true,
  "data": {
    "database": "database_name"
  }
}
```

or simply:

```json
"database_name"
```

### Authenticated Routes (.env Only)

- Authenticated routes (`/api/auth/*`) use database configuration directly from `.env`.
- No API call is made for authenticated routes.

## Authentication Flow

### NG Token (`ngToken`)

- Used for authenticated NG app routes and subcontractor list access.
- Verified by `middleware/auth.js` using `jwt.decode()` for DB resolution and then checking token existence in `m_login_detail`.
- Allows access to `GET /api/subcon/users`.

### Subcontractor Token (`subconToken`)

- Issued by `POST /api/subcon/contractor-token`.
- Valid only for the selected subcontractor context.
- Used for subcontractor CRUD routes protected by `authenticateSubconToken`.

### Contractor Token Flow

1. NG user authenticates and obtains `ngToken`.
2. User selects a subcontractor from the `/api/subcon/users` list.
3. Client calls `POST /api/subcon/contractor-token` with the selected contractor info.
4. Server verifies the NG token and issues a `subconToken`.
5. Client uses `subconToken` for subcontractor-specific routes.

## Subcon Module Structure

The subcontractor module is under `module/subcon`:

- `module/subcon/routes/index.js` - Subcon route definitions
- `module/subcon/controllers/` - Business logic controllers
- `module/subcon/services/` - Subcon service logic
- `module/subcon/middleware/subconAuth.js` - Subcontractor JWT middleware

## Notes

- `middleware/auth.js` validates NG tokens and checks token existence in `m_login_detail`.
- `module/subcon/middleware/subconAuth.js` validates subcontractor tokens.
- The current implementation does not verify full JWT signature for NG tokens yet.
- Future improvement: implement full JWT signature verification in `auth.js`.

## License

ISC

