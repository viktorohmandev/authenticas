import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { retailersApi } from '@shared/utils/api';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  useToast,
  Spinner,
} from '@shared/components';
import styles from './Webhooks.module.css';

export default function Webhooks() {
  const { user } = useAuth();
  const [retailer, setRetailer] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadRetailer();
  }, [user]);
  
  const loadRetailer = async () => {
    try {
      // Retailer admin uses retailerId, not companyId
      if (!user?.retailerId) {
        setIsLoading(false);
        return;
      }
      
      const response = await retailersApi.get(user.retailerId);
      if (response.success) {
        setRetailer(response.data);
        setWebhookUrl(response.data?.webhookUrl || '');
      }
    } catch (error) {
      console.error('Failed to load retailer:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveWebhook = async () => {
    if (!user?.retailerId) return;
    
    setIsSaving(true);
    const response = await retailersApi.registerWebhook(user.retailerId, webhookUrl);
    
    if (response.success) {
      showToast('Webhook URL saved successfully', 'success');
      loadRetailer();
    } else {
      showToast(response.error || 'Failed to save webhook', 'error');
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Webhook Configuration</h1>
        <p>Configure webhook endpoints to receive real-time notifications</p>
      </header>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Webhook URL"
            subtitle="Receive purchase notifications at this endpoint"
          />
          <CardContent>
            <div className={styles.currentStatus}>
              <span className={styles.statusLabel}>Current Status:</span>
              <Badge variant={retailer?.webhookUrl ? 'success' : 'warning'}>
                {retailer?.webhookUrl ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            
            {retailer?.webhookUrl && (
              <div className={styles.currentUrl}>
                <span className={styles.urlLabel}>Current URL:</span>
                <code className={styles.urlValue}>{retailer.webhookUrl}</code>
              </div>
            )}
            
            <div className={styles.form}>
              <Input
                label="Webhook URL"
                placeholder="https://yoursite.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                hint="We'll send POST requests to this URL for purchase events"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveWebhook} isLoading={isSaving}>
              Save Webhook URL
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader
            title="Webhook Events"
            subtitle="Events that trigger webhook notifications"
          />
          <CardContent>
            <div className={styles.eventList}>
              <div className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <Badge variant="success">purchase.approved</Badge>
                  <p>Triggered when a purchase is approved</p>
                </div>
              </div>
              <div className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <Badge variant="error">purchase.denied</Badge>
                  <p>Triggered when a purchase is denied</p>
                </div>
              </div>
              <div className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <Badge variant="warning">limit.exceeded</Badge>
                  <p>Triggered when spending limit is exceeded</p>
                </div>
              </div>
              <div className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <Badge variant="info">disconnect.requested</Badge>
                  <p>Triggered when a company requests disconnect</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={styles.payloadCard}>
          <CardHeader
            title="Webhook Payload"
            subtitle="Example payload sent to your endpoint"
          />
          <CardContent>
            <pre className={styles.codeBlock}>
{`{
  "event": "purchase.approved",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transactionId": "abc123...",
    "userId": "user123...",
    "companyId": "company123...",
    "retailerId": "retailer123...",
    "amount": 50.00,
    "status": "approved",
    "spentThisMonth": 200.00,
    "spendingLimit": 500.00
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
