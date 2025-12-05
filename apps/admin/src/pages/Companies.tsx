import { useState, useEffect } from 'react';
import { companiesApi } from '@shared/utils/api';
import { formatDate } from '@shared/utils';
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
import styles from './Companies.module.css';

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', webhookUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadCompanies();
  }, []);
  
  const loadCompanies = async () => {
    const response = await companiesApi.list();
    if (response.success) {
      setCompanies(response.data || []);
    }
    setIsLoading(false);
  };
  
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;
    
    setIsSubmitting(true);
    const response = await companiesApi.create({
      name: newCompany.name,
      webhookUrl: newCompany.webhookUrl || undefined,
    });
    
    if (response.success) {
      showToast('Company created successfully', 'success');
      setNewApiKey(response.data?.apiKey);
      loadCompanies();
      setNewCompany({ name: '', webhookUrl: '' });
    } else {
      showToast(response.error || 'Failed to create company', 'error');
    }
    setIsSubmitting(false);
  };
  
  const handleRegenerateApiKey = async (companyId: string) => {
    if (!confirm('Are you sure? The old API key will stop working.')) return;
    
    const response = await companiesApi.regenerateApiKey(companyId);
    if (response.success) {
      showToast('API key regenerated', 'success');
      setNewApiKey(response.data?.apiKey || null);
      loadCompanies();
    } else {
      showToast(response.error || 'Failed to regenerate API key', 'error');
    }
  };
  
  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    const response = await companiesApi.delete(companyId);
    if (response.success) {
      showToast('Company deleted', 'success');
      loadCompanies();
    } else {
      showToast(response.error || 'Failed to delete company', 'error');
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
          <h1>Companies</h1>
          <p>Manage registered companies and their API keys</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Create Company
        </Button>
      </header>
      
      {newApiKey && (
        <Card className={styles.apiKeyAlert}>
          <div className={styles.apiKeyContent}>
            <div>
              <h3>🔑 New API Key Generated</h3>
              <p>Save this key now - it won't be shown again!</p>
            </div>
            <code className={styles.apiKeyCode}>{newApiKey}</code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(newApiKey);
                showToast('API key copied to clipboard', 'success');
              }}
            >
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewApiKey(null)}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>API Key</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.length === 0 ? (
              <TableEmpty colSpan={5} message="No companies yet" />
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className={styles.companyName}>
                      <span className={styles.companyIcon}>🏢</span>
                      {company.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className={styles.apiKey}>{company.apiKey}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? 'success' : 'error'}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(company.createdAt)}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateApiKey(company.id)}
                      >
                        🔄 Regenerate Key
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        🗑️
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
        title="Create New Company"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompany}
              isLoading={isSubmitting}
            >
              Create Company
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCompany} className={styles.form}>
          <Input
            label="Company Name"
            placeholder="Enter company name"
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            required
          />
          <Input
            label="Webhook URL (optional)"
            placeholder="https://example.com/webhook"
            value={newCompany.webhookUrl}
            onChange={(e) => setNewCompany({ ...newCompany, webhookUrl: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}

