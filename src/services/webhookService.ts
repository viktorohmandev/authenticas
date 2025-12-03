import { WebhookPayload, WebhookEvent, Company, Transaction } from '../models/types';
import { getCurrentTimestamp } from '../utils/dateUtils';

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
}

// Configuration for webhook delivery
const WEBHOOK_CONFIG = {
  maxRetries: 3,
  retryDelays: [1000, 5000, 15000], // Delay in ms between retries
  timeout: 10000 // 10 second timeout
};

// Simple HTTP POST implementation without external dependencies
async function sendHttpPost(url: string, payload: WebhookPayload, timeout: number): Promise<{ statusCode: number; body: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    const body = await response.text();
    return { statusCode: response.status, body };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Deliver webhook with retry logic
export async function deliverWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<WebhookDeliveryResult> {
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  
  for (let attempt = 0; attempt <= WEBHOOK_CONFIG.maxRetries; attempt++) {
    try {
      // Wait before retry (not on first attempt)
      if (attempt > 0) {
        const delay = WEBHOOK_CONFIG.retryDelays[attempt - 1] || WEBHOOK_CONFIG.retryDelays[WEBHOOK_CONFIG.retryDelays.length - 1];
        console.log(`Webhook retry attempt ${attempt}/${WEBHOOK_CONFIG.maxRetries}, waiting ${delay}ms...`);
        await sleep(delay);
      }
      
      console.log(`Delivering webhook to ${webhookUrl} (attempt ${attempt + 1}/${WEBHOOK_CONFIG.maxRetries + 1})`);
      
      const { statusCode, body } = await sendHttpPost(webhookUrl, payload, WEBHOOK_CONFIG.timeout);
      lastStatusCode = statusCode;
      
      // Consider 2xx responses as success
      if (statusCode >= 200 && statusCode < 300) {
        console.log(`Webhook delivered successfully to ${webhookUrl}`);
        return {
          success: true,
          statusCode,
          attempts: attempt + 1
        };
      }
      
      // Non-2xx response
      lastError = `HTTP ${statusCode}: ${body.substring(0, 200)}`;
      console.log(`Webhook delivery failed: ${lastError}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Webhook delivery error: ${lastError}`);
    }
  }
  
  // All retries exhausted
  console.error(`Webhook delivery failed after ${WEBHOOK_CONFIG.maxRetries + 1} attempts to ${webhookUrl}`);
  
  return {
    success: false,
    statusCode: lastStatusCode,
    error: lastError,
    attempts: WEBHOOK_CONFIG.maxRetries + 1
  };
}

// Build webhook payload from transaction
export function buildWebhookPayload(
  event: WebhookEvent,
  transaction: Transaction,
  additionalData?: {
    spentThisMonth?: number;
    spendingLimit?: number;
  }
): WebhookPayload {
  return {
    event,
    timestamp: getCurrentTimestamp(),
    data: {
      transactionId: transaction.id,
      userId: transaction.userId,
      companyId: transaction.companyId,
      amount: transaction.amount,
      status: transaction.status,
      spentThisMonth: additionalData?.spentThisMonth,
      spendingLimit: additionalData?.spendingLimit,
      denialReason: transaction.denialReason
    }
  };
}

// Trigger webhook for a company (fire and forget)
export function triggerWebhook(
  company: Company,
  event: WebhookEvent,
  transaction: Transaction,
  additionalData?: {
    spentThisMonth?: number;
    spendingLimit?: number;
  }
): void {
  if (!company.webhookUrl) {
    console.log(`No webhook URL configured for company ${company.id}`);
    return;
  }
  
  const payload = buildWebhookPayload(event, transaction, additionalData);
  
  // Fire and forget - don't await
  deliverWebhook(company.webhookUrl, payload)
    .then(result => {
      if (!result.success) {
        console.error(`Failed to deliver webhook for event ${event} to company ${company.id}`);
      }
    })
    .catch(error => {
      console.error(`Webhook delivery error for company ${company.id}:`, error);
    });
}

// Trigger webhook and wait for result (for testing/debugging)
export async function triggerWebhookSync(
  company: Company,
  event: WebhookEvent,
  transaction: Transaction,
  additionalData?: {
    spentThisMonth?: number;
    spendingLimit?: number;
  }
): Promise<WebhookDeliveryResult | null> {
  if (!company.webhookUrl) {
    console.log(`No webhook URL configured for company ${company.id}`);
    return null;
  }
  
  const payload = buildWebhookPayload(event, transaction, additionalData);
  return deliverWebhook(company.webhookUrl, payload);
}

