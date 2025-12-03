import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { transactionsApi, companiesApi, retailersApi } from '@shared/utils/api';
import { formatCurrency, formatRelativeTime } from '@shared/utils';
import { Card, CardHeader, CardContent, Stat, Badge, Spinner } from '@shared/components';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    approved: 0,
    denied: 0,
    totalVolume: 0,
    totalCompanies: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [retailer, setRetailer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  const loadData = async () => {
    try {
      // Retailer admin uses retailerId, not companyId
      const retailerId = user?.retailerId;
      
      // Fetch retailer info if we have a retailerId
      if (retailerId) {
        const retailerRes = await retailersApi.get(retailerId);
        if (retailerRes.success) {
          setRetailer(retailerRes.data);
        }
      }
      
      // Fetch companies (will be filtered by backend for retailer_admin)
      const companiesRes = await companiesApi.list();
      if (companiesRes.success) {
        const companies = companiesRes.data || [];
        setStats((prev) => ({
          ...prev,
          totalCompanies: companies.length,
        }));
      }
      
      // Fetch transactions (will be filtered by backend for retailer_admin)
      const transactionsRes = await transactionsApi.list();
      if (transactionsRes.success) {
        const transactions = transactionsRes.data || [];
        const approved = transactions.filter((t: any) => t.status === 'approved');
        const denied = transactions.filter((t: any) => t.status === 'denied');
        const totalVolume = approved.reduce((sum: number, t: any) => sum + t.amount, 0);
        
        setStats((prev) => ({
          ...prev,
          totalTransactions: transactions.length,
          approved: approved.length,
          denied: denied.length,
          totalVolume,
        }));
        
        setRecentTransactions(transactions.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
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
        <h1>Dashboard</h1>
        <p>Transaction overview for {retailer?.name || 'your retailer'}</p>
      </header>
      
      <div className={styles.statsGrid}>
        <Stat
          label="Connected Companies"
          value={stats.totalCompanies}
          icon={<span>🏢</span>}
        />
        <Stat
          label="Total Transactions"
          value={stats.totalTransactions}
          icon={<span>💳</span>}
        />
        <Stat
          label="Approved"
          value={stats.approved}
          icon={<span>✅</span>}
        />
        <Stat
          label="Transaction Volume"
          value={formatCurrency(stats.totalVolume)}
          icon={<span>💰</span>}
        />
      </div>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Approval Rate"
            subtitle="Transaction success metrics"
          />
          <CardContent>
            <div className={styles.rateDisplay}>
              <span className={styles.rateValue}>
                {stats.totalTransactions > 0
                  ? Math.round((stats.approved / stats.totalTransactions) * 100)
                  : 0}%
              </span>
              <span className={styles.rateLabel}>approval rate</span>
            </div>
            <div className={styles.rateBar}>
              <div
                className={styles.rateProgress}
                style={{
                  width: `${stats.totalTransactions > 0
                    ? (stats.approved / stats.totalTransactions) * 100
                    : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader
            title="Recent Transactions"
            subtitle="Latest purchase verifications"
          />
          <CardContent>
            <div className={styles.transactionList}>
              {recentTransactions.length === 0 ? (
                <p className={styles.emptyMessage}>No transactions yet</p>
              ) : (
                recentTransactions.map((tx: any) => (
                  <div key={tx.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <Badge
                        variant={tx.status === 'approved' ? 'success' : 'error'}
                        size="sm"
                      >
                        {tx.status}
                      </Badge>
                      <span className={styles.transactionAmount}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <span className={styles.transactionTime}>
                      {formatRelativeTime(tx.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
