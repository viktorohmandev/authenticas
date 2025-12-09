import React, { useState, useEffect } from 'react';
import { retailersApi } from '@shared/utils/api';
import {
  Card,
  Button,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  Badge,
  Modal,
  useToast,
  Spinner,
} from '@shared/components';
import { formatRelativeTime } from '@shared/utils';
import styles from './Retailers.module.css';

export default function Retailers() {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRetailer, setNewRetailer] = useState({ name: '', webhookUrl: '' });
  const { showToast } = useToast();
  
  useEffect(() => {
    loadRetailers();
  }, []);
  
  const loadRetailers = async () => {
    const response = await retailersApi.list();
    if (response.success) {
      setRetailers(response.data || []);
    }
    setIsLoading(false);
  };
  
  const handleCreateRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRetailer.name) {
      showToast('Retailer name is required', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const response = await retailersApi.create({
      name: newRetailer.name,
      webhookUrl: newRetailer.webhookUrl || undefined,
    });
    
    if (response.success) {
      showToast('Retailer created successfully', 'success');
      loadRetailers();
      setIsModalOpen(false);
      setNewRetailer({ name: '', webhookUrl: '' });
    } else {
      showToast(response.error || 'Failed to create retailer', 'error');
    }
    setIsSubmitting(false);
  };
  
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const response = await retailersApi.update(id, { isActive: !currentStatus });
    if (response.success) {
      showToast(`Retailer ${currentStatus ? 'deactivated' : 'activated'}`, 'success');
      loadRetailers();
    } else {
      showToast(response.error || 'Failed to update retailer', 'error');
    }
  };
  
  const handleRegenerateApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      return;
    }
    
    const response = await retailersApi.regenerateApiKey(id);
    if (response.success && response.data) {
      showToast('API key regenerated. New key: ' + response.data.apiKey, 'success');
      loadRetailers();
    } else {
      showToast(response.error || 'Failed to regenerate API key', 'error');
    }
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
        <div>
          <h1>Retailers</h1>
          <p>Manage retail partners in the system</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Add Retailer
        </Button>
      </header>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Retailer</TableHeader>
              <TableHeader>API Key</TableHeader>
              <TableHeader>Webhook</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {retailers.length === 0 ? (
              <TableEmpty colSpan={6} message="No retailers yet" />
            ) : (
              retailers.map((retailer) => (
                <TableRow key={retailer.id}>
                  <TableCell>
                    <div className={styles.retailerInfo}>
                      <span className={styles.retailerName}>{retailer.name}</span>
                      <span className={styles.retailerId}>{retailer.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className={styles.apiKey}>{retailer.apiKey}</code>
                  </TableCell>
                  <TableCell>
                    {retailer.webhookUrl ? (
                      <span className={styles.webhookUrl}>{retailer.webhookUrl}</span>
                    ) : (
                      <span className={styles.noWebhook}>Not configured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={retailer.isActive ? 'success' : 'error'}>
                      {retailer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(retailer.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateApiKey(retailer.id)}
                      >
                        🔑 Regenerate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(retailer.id, retailer.isActive)}
                      >
                        {retailer.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Retailer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRetailer} isLoading={isSubmitting}>
              Create Retailer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRetailer} className={styles.form}>
          <Input
            label="Retailer Name"
            placeholder="Enter retailer name"
            value={newRetailer.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRetailer({ ...newRetailer, name: e.target.value })}
            required
          />
          <Input
            label="Webhook URL (Optional)"
            placeholder="https://example.com/webhooks"
            value={newRetailer.webhookUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRetailer({ ...newRetailer, webhookUrl: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

