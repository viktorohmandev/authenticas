# Authenticas API Documentation

Complete reference for the Authenticas REST API.

## Base URL

```
https://api.authenticas.com
```

For local development:
```
http://localhost:3000
```

---

## Authentication

Authenticas supports two authentication methods:

### 1. JWT Token (For Dashboard Access)

Used by admins, company managers, and dashboard users.

```http
Authorization: Bearer <your_jwt_token>
```

**Obtain a token:**

```bash
curl -X POST https://api.authenticas.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_abc123",
      "email": "admin@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "companyId": "cmp_xyz789",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

### 2. API Key (For Purchase Verification)

Used by retailers for verifying purchases.

```http
X-API-Key: ak_live_cca489a4e3dd71d388b8975b...
```

API keys are company-specific and can be regenerated from the admin dashboard.

---

## Endpoints

### Authentication

#### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_abc123",
      "email": "user@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "companyId": "cmp_xyz789",
      "role": "regular"
    }
  }
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "companyId": "cmp_xyz789",
    "role": "regular",
    "spendingLimit": 500,
    "spentThisMonth": 150
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

---

### Purchase Verification

The core endpoint for retailers to verify corporate purchases.

#### Verify Purchase

```http
POST /verifyPurchase
X-API-Key: <company_api_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "usr_abc123",
  "companyId": "cmp_xyz789",
  "amount": 149.99
}
```

**Success Response (Approved):**
```json
{
  "success": true,
  "message": "Purchase approved",
  "data": {
    "transactionId": "txn_def456",
    "status": "approved",
    "amount": 149.99,
    "spentThisMonth": 299.99,
    "spendingLimit": 500,
    "remainingBudget": 200.01
  }
}
```

**Error Response (Denied):**
```json
{
  "success": false,
  "error": "Purchase would exceed spending limit. Current: $350.00, Limit: $500.00, Requested: $200.00",
  "data": {
    "transactionId": "txn_ghi789",
    "status": "denied",
    "reason": "limit_exceeded",
    "spentThisMonth": 350,
    "spendingLimit": 500,
    "remainingBudget": 150
  }
}
```

**Denial Reasons:**
| Reason | Description |
|--------|-------------|
| `limit_exceeded` | Purchase would exceed user's spending limit |
| `user_inactive` | User account is deactivated |
| `company_inactive` | Company account is deactivated |
| `user_not_found` | User ID not found |
| `company_not_found` | Company ID not found |
| `insufficient_permissions` | User doesn't belong to the company |

**cURL Example:**
```bash
curl -X POST https://api.authenticas.com/verifyPurchase \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ak_live_cca489a4e3dd71d388b8975b..." \
  -d '{
    "userId": "usr_abc123",
    "companyId": "cmp_xyz789",
    "amount": 149.99
  }'
```

**JavaScript (fetch) Example:**
```javascript
const response = await fetch('https://api.authenticas.com/verifyPurchase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_live_cca489a4e3dd71d388b8975b...'
  },
  body: JSON.stringify({
    userId: 'usr_abc123',
    companyId: 'cmp_xyz789',
    amount: 149.99
  })
});

const result = await response.json();

if (result.success) {
  console.log('Purchase approved!');
  console.log('Remaining budget:', result.data.remainingBudget);
} else {
  console.log('Purchase denied:', result.data.reason);
}
```

---

### Companies

All company endpoints require JWT authentication. Admin role required for create/update/delete.

#### List Companies

```http
GET /api/companies
Authorization: Bearer <token>
```

#### Get Company

```http
GET /api/companies/:id
Authorization: Bearer <token>
```

#### Create Company

```http
POST /api/companies
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "webhookUrl": "https://acme.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmp_xyz789",
    "name": "Acme Corporation",
    "apiKey": "ak_live_cca489a4e3dd71d388b8975b...",
    "webhookUrl": "https://acme.com/webhook",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "isActive": true
  },
  "message": "Company created successfully. Save the API key - it will not be shown again in full."
}
```

#### Update Company

```http
PUT /api/companies/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Acme Corp (Updated)",
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

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "ak_live_new_key_here..."
  },
  "message": "API key regenerated successfully."
}
```

#### Register Webhook

```http
POST /api/companies/:id/webhook
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "webhookUrl": "https://yoursite.com/webhook"
}
```

#### Get Company Users

```http
GET /api/companies/:id/users
Authorization: Bearer <token>
```

---

### Users

All user endpoints require JWT authentication. Admin role required for create/update/delete.

#### List Users

```http
GET /api/users
Authorization: Bearer <token>
```

#### Get User

```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "companyId": "cmp_xyz789",
  "role": "regular",
  "spendingLimit": 500
}
```

#### Update User

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "role": "admin",
  "spendingLimit": 1000,
  "isActive": true
}
```

#### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Set Spending Limit

```http
PUT /api/users/:id/spending-limit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "spendingLimit": 750
}
```

---

### Transactions

#### List All Transactions

```http
GET /api/transactions
Authorization: Bearer <token>
```

#### Get Transaction

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

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "userId": "usr_def456",
      "companyId": "cmp_xyz789",
      "amount": 149.99,
      "status": "approved",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "balanceBefore": 150,
      "balanceAfter": 299.99
    },
    {
      "id": "txn_ghi789",
      "userId": "usr_def456",
      "companyId": "cmp_xyz789",
      "amount": 500,
      "status": "denied",
      "denialReason": "limit_exceeded",
      "timestamp": "2024-01-15T11:00:00.000Z",
      "balanceBefore": 299.99,
      "balanceAfter": 299.99
    }
  ]
}
```

---

### Audit Trail

All audit endpoints require JWT authentication and admin role.

#### Get All Audit Entries

```http
GET /api/audit?limit=50&offset=0
Authorization: Bearer <token>
```

#### Get Recent Entries

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

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Standard endpoints:** 100 requests per minute
- **Verify Purchase:** 1000 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## Monthly Reset

User spending (`spentThisMonth`) automatically resets to 0 on the first day of each month. This is handled automatically by the system - no action required.

