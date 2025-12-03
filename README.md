# Authenticas Backend API

A B2B authentication system for retailers to verify whether employees are allowed to make corporate purchases in-store.

## Features

- **Company Management**: Create companies, assign API keys, manage users, set spending limits
- **User Management**: Create users, assign roles (admin/regular), track monthly spending
- **Purchase Verification**: Verify purchases against spending limits in real-time
- **Audit Trail**: Complete logging of all actions with before/after states
- **Webhooks**: Notify retailers of purchase events (approved, denied, limit exceeded)
- **JWT Authentication**: Secure dashboard access with token-based authentication

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Create environment file
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Seed test data (optional)
npx ts-node src/scripts/seed.ts

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "Admin",
      "lastName": "User",
      "companyId": "uuid",
      "role": "admin"
    }
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Purchase Verification

#### Verify Purchase (Main Endpoint)
```http
POST /verifyPurchase
X-API-Key: ak_<company_api_key>
Content-Type: application/json

{
  "userId": "user-uuid",
  "companyId": "company-uuid",
  "amount": 50.00
}
```

Success Response:
```json
{
  "success": true,
  "message": "Purchase approved",
  "data": {
    "transactionId": "uuid",
    "status": "approved",
    "amount": 50.00,
    "spentThisMonth": 200.00,
    "spendingLimit": 500.00,
    "remainingBudget": 300.00
  }
}
```

Denied Response:
```json
{
  "success": false,
  "error": "Purchase would exceed spending limit...",
  "data": {
    "transactionId": "uuid",
    "status": "denied",
    "reason": "limit_exceeded",
    "spentThisMonth": 450.00,
    "spendingLimit": 500.00,
    "remainingBudget": 50.00
  }
}
```

### Company Management

All company endpoints require JWT authentication. Admin role required for create/update/delete.

#### List Companies
```http
GET /api/companies
Authorization: Bearer <token>
```

#### Create Company
```http
POST /api/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Company",
  "webhookUrl": "https://example.com/webhook"
}
```

#### Update Company
```http
PUT /api/companies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true
}
```

#### Delete Company
```http
DELETE /api/companies/:id
Authorization: Bearer <token>
```

#### Regenerate API Key
```http
POST /api/companies/:id/regenerate-api-key
Authorization: Bearer <token>
```

#### Register Webhook
```http
POST /api/companies/:id/webhook
Authorization: Bearer <token>
Content-Type: application/json

{
  "webhookUrl": "https://yoursite.com/webhook"
}
```

### User Management

All user endpoints require JWT authentication. Admin role required for create/update/delete.

#### List Users
```http
GET /api/users
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "securepass123",
  "firstName": "New",
  "lastName": "User",
  "companyId": "company-uuid",
  "role": "regular",
  "spendingLimit": 1000
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "role": "admin",
  "spendingLimit": 2000
}
```

#### Set Spending Limit
```http
PUT /api/users/:id/spending-limit
Authorization: Bearer <token>
Content-Type: application/json

{
  "spendingLimit": 1500
}
```

#### Add User to Company
```http
POST /api/users/:userId/company/:companyId
Authorization: Bearer <token>
```

#### Remove User from Company
```http
DELETE /api/users/:userId/company/:companyId
Authorization: Bearer <token>
```

### Transactions

#### List All Transactions
```http
GET /api/transactions
Authorization: Bearer <token>
```

#### Get Transaction by ID
```http
GET /api/transactions/:id
Authorization: Bearer <token>
```

#### Get User Transactions
```http
GET /api/transactions/user/:userId
Authorization: Bearer <token>
```

#### Get Company Transactions
```http
GET /api/transactions/company/:companyId
Authorization: Bearer <token>
```

### Audit Trail

All audit endpoints require JWT authentication and admin role.

#### Get All Audit Entries
```http
GET /api/audit?limit=50&offset=0
Authorization: Bearer <token>
```

#### Get Recent Audit Entries
```http
GET /api/audit/recent?count=20
Authorization: Bearer <token>
```

#### Get User Audit Trail
```http
GET /api/audit/user/:userId
Authorization: Bearer <token>
```

#### Get Target Audit Trail
```http
GET /api/audit/target/:type/:id
Authorization: Bearer <token>
```
Types: `company`, `user`, `transaction`, `system`

## Webhooks

When a company has a webhook URL configured, Authenticas will send POST requests for the following events:

### Events

- `purchase.approved` - Purchase was approved
- `purchase.denied` - Purchase was denied
- `limit.exceeded` - Purchase denied due to spending limit

### Webhook Payload
```json
{
  "event": "purchase.approved",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "uuid",
    "userId": "uuid",
    "companyId": "uuid",
    "amount": 50.00,
    "status": "approved",
    "spentThisMonth": 200.00,
    "spendingLimit": 500.00
  }
}
```

### Headers
- `Content-Type: application/json`
- `X-Webhook-Event: purchase.approved`
- `X-Webhook-Timestamp: 2024-01-15T10:30:00.000Z`

### Retry Policy
- Max 3 retries with exponential backoff
- Retry delays: 1s, 5s, 15s
- Timeout: 10 seconds

## Project Structure

```
src/
├── server.ts              # Express app entry point
├── controllers/           # Request handlers
│   ├── authController.ts
│   ├── companyController.ts
│   ├── userController.ts
│   └── transactionController.ts
├── routes/               # API route definitions
│   ├── auth.ts
│   ├── companies.ts
│   ├── users.ts
│   ├── transactions.ts
│   └── audit.ts
├── middleware/           # Express middleware
│   └── authMiddleware.ts
├── models/              # TypeScript interfaces
│   └── types.ts
├── services/            # Business logic
│   ├── webhookService.ts
│   └── auditService.ts
├── utils/               # Utility functions
│   ├── fileUtils.ts
│   ├── authUtils.ts
│   ├── dateUtils.ts
│   └── apiKeyUtils.ts
├── scripts/             # Utility scripts
│   └── seed.ts
└── data/                # JSON storage
    ├── companies.json
    ├── users.json
    ├── transactions.json
    └── audit.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npx ts-node src/scripts/seed.ts` - Seed test data

## Frontend Dashboards

Three React dashboards are available in the `/apps` directory:

| Dashboard | Port | URL | Description |
|-----------|------|-----|-------------|
| **Admin** | 5173 | http://localhost:5173 | System administration |
| **Retailer** | 5174 | http://localhost:5174 | Transaction monitoring & webhooks |
| **Company** | 5175 | http://localhost:5175 | Team & spending management |

### Running the Frontends

```bash
# Install dependencies for each app
cd apps/shared && npm install
cd apps/admin && npm install
cd apps/retailer && npm install
cd apps/company && npm install

# Start each dashboard (in separate terminals)
cd apps/admin && npm run dev      # Admin on :5173
cd apps/retailer && npm run dev   # Retailer on :5174
cd apps/company && npm run dev    # Company on :5175
```

### Test Credentials

- **Admin**: `admin@acme.com` / `admin123`
- **Regular User**: `john.doe@acme.com` / `user123`

See `apps/README.md` for complete frontend documentation.

## License

MIT

