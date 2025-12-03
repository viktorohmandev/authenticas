import { useState, useEffect } from 'react';
import { companiesApi, usersApi, transactionsApi, auditApi } from '@shared/utils/api';
import { formatCurrency, formatRelativeTime } from '@shared/utils';
import { Card, CardHeader, CardContent, Stat, Badge, Spinner } from '@shared/components';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    transactions: 0,
    approved: 0,
    denied: 0,
    totalVolume: 0,
  });
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [companiesRes, usersRes, transactionsRes, auditRes] = await Promise.all([
        companiesApi.list(),
        usersApi.list(),
        transactionsApi.list(),
        auditApi.recent(10),
      ]);
      
      const transactions = transactionsRes.data || [];
      const approved = transactions.filter((t: any) => t.status === 'approved');
      const denied = transactions.filter((t: any) => t.status === 'denied');
      const totalVolume = approved.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      setStats({
        companies: companiesRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        transactions: transactions.length,
        approved: approved.length,
        denied: denied.length,
        totalVolume,
      });
      
      setRecentAudit(auditRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
        <p>Overview of the Authenticas system</p>
      </header>
      
      <div className={styles.statsGrid}>
        <Stat
          label="Total Companies"
          value={stats.companies}
          icon={<span>🏢</span>}
        />
        <Stat
          label="Total Users"
          value={stats.users}
          icon={<span>👥</span>}
        />
        <Stat
          label="Total Transactions"
          value={stats.transactions}
          icon={<span>💳</span>}
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
            title="Transaction Overview"
            subtitle="Approval rate statistics"
          />
          <CardContent>
            <div className={styles.transactionStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Approved</span>
                <span className={styles.statValue} style={{ color: 'var(--color-accent-success)' }}>
                  {stats.approved}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Denied</span>
                <span className={styles.statValue} style={{ color: 'var(--color-accent-error)' }}>
                  {stats.denied}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Approval Rate</span>
                <span className={styles.statValue}>
                  {stats.transactions > 0 
                    ? Math.round((stats.approved / stats.transactions) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest audit entries"
          />
          <CardContent>
            <div className={styles.activityList}>
              {recentAudit.length === 0 ? (
                <p className={styles.emptyMessage}>No recent activity</p>
              ) : (
                recentAudit.slice(0, 5).map((entry: any) => (
                  <div key={entry.id} className={styles.activityItem}>
                    <div className={styles.activityContent}>
                      <Badge
                        variant={
                          entry.action.includes('approved') ? 'success' :
                          entry.action.includes('denied') ? 'error' :
                          entry.action.includes('created') ? 'info' : 'default'
                        }
                        size="sm"
                      >
                        {entry.action.replace('.', ' ')}
                      </Badge>
                      <span className={styles.activityTime}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
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

