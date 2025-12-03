# Authenticas Webhooks Documentation

Real-time notifications for purchase events.

---

## Overview

Webhooks allow your system to receive real-time HTTP notifications when purchase events occur. When an event is triggered, Authenticas sends a POST request to your registered webhook URL.

---

## Setting Up Webhooks

### 1. Register Your Webhook URL

**Via API:**
```bash
curl -X POST https://api.authenticas.com/api/companies/:companyId/webhook \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://yoursite.com/webhook"
  }'
```

**Via Dashboard:**
1. Log in to your company dashboard
2. Navigate to "Webhooks" section
3. Enter your webhook URL
4. Click "Save"

### 2. Requirements

- URL must be HTTPS (recommended for production)
- URL must be publicly accessible
- Endpoint must respond with 2xx status within 10 seconds

---

## Webhook Events

### purchase.approved

Triggered when a purchase is successfully approved.

```json
{
  "event": "purchase.approved",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "txn_abc123",
    "userId": "usr_def456",
    "companyId": "cmp_xyz789",
    "amount": 149.99,
    "status": "approved",
    "spentThisMonth": 299.99,
    "spendingLimit": 500
  }
}
```

### purchase.denied

Triggered when a purchase is denied.

```json
{
  "event": "purchase.denied",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "txn_ghi789",
    "userId": "usr_def456",
    "companyId": "cmp_xyz789",
    "amount": 300,
    "status": "denied",
    "denialReason": "limit_exceeded",
    "spentThisMonth": 299.99,
    "spendingLimit": 500
  }
}
```

### limit.exceeded

Triggered specifically when a purchase is denied due to exceeding spending limits. This event is sent **in addition to** `purchase.denied`.

```json
{
  "event": "limit.exceeded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "txn_ghi789",
    "userId": "usr_def456",
    "companyId": "cmp_xyz789",
    "amount": 300,
    "status": "denied",
    "denialReason": "limit_exceeded",
    "spentThisMonth": 299.99,
    "spendingLimit": 500
  }
}
```

---

## Webhook Headers

Each webhook request includes the following headers:

| Header | Description | Example |
|--------|-------------|---------|
| `Content-Type` | Always `application/json` | `application/json` |
| `X-Webhook-Event` | The event type | `purchase.approved` |
| `X-Webhook-Timestamp` | ISO 8601 timestamp | `2024-01-15T10:30:00.000Z` |

---

## Payload Structure

### Full Payload Schema

```typescript
interface WebhookPayload {
  event: 'purchase.approved' | 'purchase.denied' | 'limit.exceeded';
  timestamp: string; // ISO 8601 format
  data: {
    transactionId: string;
    userId: string;
    companyId: string;
    amount: number;
    status: 'approved' | 'denied';
    spentThisMonth?: number;    // Current month spending after transaction
    spendingLimit?: number;     // User's spending limit
    denialReason?: string;      // Only present if denied
  };
}
```

### Denial Reasons

| Reason | Description |
|--------|-------------|
| `limit_exceeded` | Purchase would exceed spending limit |
| `user_inactive` | User account is deactivated |
| `company_inactive` | Company is deactivated |
| `user_not_found` | User ID not found |
| `company_not_found` | Company ID not found |
| `insufficient_permissions` | User doesn't belong to company |

---

## Retry Logic

If your webhook endpoint doesn't respond with a 2xx status code, Authenticas will retry the delivery:

| Attempt | Delay | Total Time Elapsed |
|---------|-------|-------------------|
| 1 | Immediate | 0s |
| 2 | 1 second | 1s |
| 3 | 5 seconds | 6s |
| 4 | 15 seconds | 21s |

- **Maximum retries:** 3 (4 total attempts)
- **Timeout per request:** 10 seconds
- **Final failure:** Event is logged but not retried further

### What Counts as Success

- HTTP status codes 200-299 are considered successful
- Response body is ignored

### What Triggers a Retry

- Network errors
- Timeout (>10 seconds)
- HTTP status codes outside 200-299

---

## Example Webhook Handler

### Node.js (Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const event = req.headers['x-webhook-event'];
  const payload = req.body;
  
  console.log(`Received ${event} event:`, payload);
  
  switch (payload.event) {
    case 'purchase.approved':
      // Handle approved purchase
      console.log(`Purchase approved: $${payload.data.amount}`);
      console.log(`Remaining budget: $${payload.data.spendingLimit - payload.data.spentThisMonth}`);
      break;
      
    case 'purchase.denied':
      // Handle denied purchase
      console.log(`Purchase denied: ${payload.data.denialReason}`);
      break;
      
    case 'limit.exceeded':
      // Handle limit exceeded - maybe notify manager
      console.log(`Spending limit exceeded for user ${payload.data.userId}`);
      break;
  }
  
  // Respond quickly to avoid timeout
  res.status(200).json({ received: true });
});

app.listen(3000);
```

### Python (Flask)

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    event = request.headers.get('X-Webhook-Event')
    payload = request.json
    
    print(f"Received {event} event:", payload)
    
    if payload['event'] == 'purchase.approved':
        amount = payload['data']['amount']
        remaining = payload['data']['spendingLimit'] - payload['data']['spentThisMonth']
        print(f"Purchase approved: ${amount}")
        print(f"Remaining budget: ${remaining}")
        
    elif payload['event'] == 'purchase.denied':
        reason = payload['data'].get('denialReason', 'unknown')
        print(f"Purchase denied: {reason}")
        
    elif payload['event'] == 'limit.exceeded':
        user_id = payload['data']['userId']
        print(f"Spending limit exceeded for user {user_id}")
    
    return jsonify({'received': True}), 200

if __name__ == '__main__':
    app.run(port=3000)
```

### PHP

```php
<?php
$payload = json_decode(file_get_contents('php://input'), true);
$event = $_SERVER['HTTP_X_WEBHOOK_EVENT'] ?? '';

error_log("Received $event event: " . json_encode($payload));

switch ($payload['event']) {
    case 'purchase.approved':
        $amount = $payload['data']['amount'];
        $remaining = $payload['data']['spendingLimit'] - $payload['data']['spentThisMonth'];
        error_log("Purchase approved: \$$amount");
        error_log("Remaining budget: \$$remaining");
        break;
        
    case 'purchase.denied':
        $reason = $payload['data']['denialReason'] ?? 'unknown';
        error_log("Purchase denied: $reason");
        break;
        
    case 'limit.exceeded':
        $userId = $payload['data']['userId'];
        error_log("Spending limit exceeded for user $userId");
        break;
}

http_response_code(200);
echo json_encode(['received' => true]);
```

---

## Best Practices

### 1. Respond Quickly
Return a 200 response as soon as possible. Process the webhook asynchronously if needed.

```javascript
app.post('/webhook', async (req, res) => {
  // Respond immediately
  res.status(200).json({ received: true });
  
  // Process asynchronously
  processWebhook(req.body).catch(console.error);
});
```

### 2. Handle Duplicates
Your endpoint may receive the same event multiple times (due to retries). Use `transactionId` to deduplicate.

```javascript
const processedTransactions = new Set();

app.post('/webhook', (req, res) => {
  const txnId = req.body.data.transactionId;
  
  if (processedTransactions.has(txnId)) {
    console.log('Duplicate webhook, ignoring');
    return res.status(200).json({ received: true });
  }
  
  processedTransactions.add(txnId);
  // Process webhook...
  
  res.status(200).json({ received: true });
});
```

### 3. Verify the Source
For additional security, you may want to verify that webhooks are coming from Authenticas by checking the source IP or implementing signature verification (coming soon).

### 4. Log Everything
Log all webhook events for debugging and audit purposes.

```javascript
app.post('/webhook', (req, res) => {
  console.log({
    timestamp: new Date().toISOString(),
    event: req.body.event,
    transactionId: req.body.data.transactionId,
    headers: req.headers
  });
  
  res.status(200).json({ received: true });
});
```

---

## Testing Webhooks

### Local Development

Use tools like [ngrok](https://ngrok.com) to expose your local webhook endpoint:

```bash
ngrok http 3000
```

Then register the ngrok URL as your webhook URL.

### Test Purchase

Use the "Test Purchase" feature in the Retailer Dashboard to trigger webhook events without making real transactions.

---

## Troubleshooting

### Not Receiving Webhooks

1. **Check URL accessibility:** Ensure your webhook URL is publicly accessible
2. **Check HTTPS:** Production webhooks should use HTTPS
3. **Check response time:** Endpoint must respond within 10 seconds
4. **Check status code:** Endpoint must return 2xx status

### Receiving Duplicate Events

This is expected behavior during retries. Implement deduplication using `transactionId`.

### Events Arriving Out of Order

Webhooks may not arrive in the exact order events occurred. Use the `timestamp` field to determine event order.

