import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { companiesApi } from '@shared/utils/api';
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  Badge,
  useToast,
  Spinner,
} from '@shared/components';
import { formatRelativeTime } from '@shared/utils';
import styles from './Companies.module.css';

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadCompanies();
  }, [user]);
  
  const loadCompanies = async () => {
    const response = await companiesApi.list();
    if (response.success) {
      // Companies are already filtered by backend based on retailerId
      setCompanies(response.data || []);
    } else {
      showToast(response.error || 'Failed to load companies', 'error');
    }
    setIsLoading(false);
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
          <p>View companies connected to your retailer</p>
        </div>
      </header>
      
      <div className={styles.infoNote}>
        <span className={styles.infoIcon}>ℹ️</span>
        <span>Companies are created centrally by Authenticas system administrators.</span>
      </div>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>API Key</TableHeader>
              <TableHeader>Webhook</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.length === 0 ? (
              <TableEmpty colSpan={5} message="No companies connected to your retailer" />
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className={styles.companyInfo}>
                      <span className={styles.companyName}>{company.name}</span>
                      <span className={styles.companyId}>{company.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className={styles.apiKey}>{company.apiKey}</code>
                  </TableCell>
                  <TableCell>
                    {company.webhookUrl ? (
                      <span className={styles.webhookUrl}>{company.webhookUrl}</span>
                    ) : (
                      <span className={styles.noWebhook}>Not configured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? 'success' : 'error'}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(company.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

