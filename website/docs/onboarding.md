# Authenticas Onboarding Guide

Step-by-step guide to get started with Authenticas.

---

## Overview

This guide walks you through setting up Authenticas for your organization, from creating your account to making your first verified purchase.

**Time to complete:** ~15 minutes

---

## Step 1: Create Your Account

### For System Administrators

If you're setting up Authenticas for your organization:

1. **Request Access**
   - Visit [authenticas.com](https://authenticas.com)
   - Fill out the "Request Access" form
   - Our team will provision your admin account within 24 hours

2. **Receive Credentials**
   - You'll receive an email with:
     - Admin dashboard URL
     - Login credentials
     - API documentation links

3. **First Login**
   - Navigate to the Admin Dashboard
   - Log in with your provided credentials
   - Change your password immediately

### For Company Managers

If you've been invited by your organization:

1. Check your email for an invitation from Authenticas
2. Click the invitation link
3. Set your password
4. Log in to your Company Dashboard

---

## Step 2: Generate Your API Key

API keys are required for retailers to verify purchases.

### Via Admin Dashboard

1. Log in to the Admin Dashboard
2. Navigate to **Companies** in the sidebar
3. Click **+ Create Company** (or select existing company)
4. Your API key will be displayed after creation

⚠️ **Important:** Save your API key immediately! It will only be shown in full once.

### Via API

```bash
curl -X POST https://api.authenticas.com/api/companies \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Company Name",
    "webhookUrl": "https://yoursite.com/webhook"
  }'
```

### Regenerating API Keys

If you need to regenerate an API key:

1. Go to **Companies** in the Admin Dashboard
2. Find your company
3. Click **🔄 Regenerate Key**
4. Confirm the action
5. Save the new key (old key will stop working immediately)

---

## Step 3: Add Your Company

If your company isn't already set up:

### Company Information

1. Navigate to **Companies** → **+ Create Company**
2. Enter:
   - **Company Name:** Your organization's name
   - **Webhook URL:** (Optional) URL to receive purchase notifications

### Company Settings

After creation, you can configure:

- **Status:** Active/Inactive toggle
- **Webhook URL:** Update notification endpoint
- **API Key:** View (masked) or regenerate

---

## Step 4: Invite Team Members

Add employees who will be making corporate purchases.

### Via Company Dashboard

1. Log in to the Company Dashboard
2. Navigate to **Team Members**
3. Click **+ Invite User**
4. Fill in:
   - **First Name**
   - **Last Name**
   - **Email Address**
   - **Temporary Password**
   - **Role:** Regular User or Administrator
   - **Spending Limit:** Monthly budget in dollars

5. Click **Send Invitation**

### Via API

```bash
curl -X POST https://api.authenticas.com/api/users \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "temp_password_123",
    "firstName": "John",
    "lastName": "Doe",
    "companyId": "cmp_xyz789",
    "role": "regular",
    "spendingLimit": 500
  }'
```

### User Roles

| Role | Permissions |
|------|-------------|
| **Regular** | Can make purchases up to their spending limit |
| **Admin** | Can manage company users and settings |

---

## Step 5: Set Spending Limits

Control how much each employee can spend per month.

### Understanding Spending Limits

- **Per-user limits:** Each user has their own monthly spending cap
- **Automatic reset:** Limits reset to 0 on the 1st of each month
- **Real-time tracking:** Balances update immediately after each purchase

### Setting Limits via Dashboard

1. Navigate to **Spending Limits** (Company Dashboard)
2. Find the user you want to modify
3. Click **Edit Limit**
4. Enter the new monthly limit
5. Click **Save**

### Setting Limits via API

```bash
curl -X PUT https://api.authenticas.com/api/users/:userId/spending-limit \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "spendingLimit": 750
  }'
```

### Recommended Limits by Role

| Employee Type | Suggested Limit |
|--------------|-----------------|
| Office Staff | $200 - $500 |
| Field Workers | $500 - $1,000 |
| Managers | $1,000 - $2,500 |
| Executives | $2,500 - $10,000 |

---

## Step 6: Share with Retailers

Provide retailers with the information they need to verify purchases.

### What Retailers Need

1. **API Key:** Your company's API key (starts with `ak_`)
2. **Company ID:** Your unique company identifier
3. **User IDs:** Identifiers for employees making purchases

### Integration Methods

**Option A: Employee Badge/Card**
- Encode user ID and company ID on employee badges
- Retailer scans badge at checkout

**Option B: Mobile App**
- Employees show QR code from mobile app
- Contains user ID and company ID

**Option C: Manual Entry**
- Employee provides their email or employee ID
- Retailer looks up in system

### Retailer Integration

Retailers call the verification API at checkout:

```bash
curl -X POST https://api.authenticas.com/verifyPurchase \
  -H "X-API-Key: ak_live_your_company_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_employee_id",
    "companyId": "cmp_your_company_id",
    "amount": 49.99
  }'
```

---

## Step 7: Configure Webhooks (Optional)

Receive real-time notifications about purchase events.

### Setting Up Webhooks

1. Navigate to **Webhooks** in your dashboard
2. Enter your webhook URL
3. Click **Save**

### Webhook Events

| Event | When It Fires |
|-------|---------------|
| `purchase.approved` | Purchase successfully approved |
| `purchase.denied` | Purchase denied (any reason) |
| `limit.exceeded` | Denied due to spending limit |

### Example Payload

```json
{
  "event": "purchase.approved",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "txn_abc123",
    "userId": "usr_def456",
    "amount": 49.99,
    "spentThisMonth": 149.99,
    "spendingLimit": 500
  }
}
```

---

## Step 8: Test Your Setup

Before going live, verify everything works.

### Using the Test Purchase Feature

1. Log in to the **Retailer Dashboard**
2. Navigate to **Test Purchase**
3. Select a user
4. Enter a test amount
5. Click **Test Purchase**
6. Verify the response

### Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Amount within limit | `approved` |
| Amount exceeds remaining budget | `denied` (limit_exceeded) |
| Inactive user | `denied` (user_inactive) |
| Wrong company ID | `denied` (insufficient_permissions) |

### Verify in Transaction History

After testing:
1. Go to **Transactions**
2. Confirm test transactions appear
3. Verify amounts and statuses are correct

---

## Quick Reference

### Dashboard URLs

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Admin | `localhost:5173` | System administration |
| Retailer | `localhost:5174` | Transaction monitoring |
| Company | `localhost:5175` | Team management |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/verifyPurchase` | POST | Verify a purchase |
| `/api/auth/login` | POST | Get JWT token |
| `/api/companies` | GET/POST | Manage companies |
| `/api/users` | GET/POST | Manage users |
| `/api/transactions` | GET | View transactions |

### Test Credentials

```
Admin User:
  Email: admin@acme.com
  Password: admin123

Regular User:
  Email: john.doe@acme.com
  Password: user123
```

---

## Troubleshooting

### "Invalid API Key" Error

- Verify the API key is correct (no extra spaces)
- Ensure the company is active
- Check if the key was regenerated

### "User Not Found" Error

- Verify the user ID is correct
- Ensure the user belongs to the correct company
- Check if the user is active

### "Limit Exceeded" When It Shouldn't Be

- Check current month's spending in dashboard
- Verify the spending limit is set correctly
- Remember limits reset on the 1st of each month

### Webhooks Not Arriving

- Verify the URL is publicly accessible
- Check that your endpoint returns 2xx status
- Ensure the URL uses HTTPS in production

---

## Getting Help

- **Documentation:** [docs/api.md](api.md), [docs/webhooks.md](webhooks.md)
- **Email Support:** support@authenticas.com
- **Status Page:** status.authenticas.com

---

## Next Steps

✅ Account created  
✅ API key generated  
✅ Company configured  
✅ Team members added  
✅ Spending limits set  
✅ Retailers informed  
✅ Webhooks configured  
✅ Setup tested  

**You're ready to go live!** 🎉

Start accepting corporate purchases with confidence. All transactions are logged, limits are enforced, and you have complete visibility into spending.

