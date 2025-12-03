import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { usersApi, transactionsApi, companiesApi } from '@shared/utils/api';
import { formatCurrency, formatRelativeTime } from '@shared/utils';
import { isCompanyUser } from '@shared/types';
import { Card, CardHeader, CardContent, Stat, Badge, Spinner } from '@shared/components';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSpent: 0,
    totalLimit: 0,
    transactions: 0,
    approved: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isRegularUser = isCompanyUser(user?.role);
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  const loadData = async () => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    
    try {
      // company_user can only see their own data
      if (isRegularUser) {
        // Only fetch company info and user's own transactions
        const [companyRes, myTransactionsRes] = await Promise.all([
          companiesApi.get(user.companyId),
          transactionsApi.getByUser(user.id),
        ]);
        
        if (companyRes.success) {
          setCompany(companyRes.data);
        }
        
        if (myTransactionsRes.success) {
          setMyTransactions((myTransactionsRes.data || []).slice(0, 5));
        }
      } else {
        // company_admin and above can see company-wide data
        const [usersRes, transactionsRes, companyRes] = await Promise.all([
          usersApi.list(),
          transactionsApi.getByCompany(user.companyId),
          companiesApi.get(user.companyId),
        ]);
        
        if (usersRes.success) {
          const companyUsers = (usersRes.data || []).filter(
            (u: any) => u.companyId === user.companyId
          );
          const activeUsers = companyUsers.filter((u: any) => u.isActive);
          const totalSpent = companyUsers.reduce((sum: number, u: any) => sum + (u.spentThisMonth || 0), 0);
          const totalLimit = companyUsers.reduce((sum: number, u: any) => sum + (u.spendingLimit || 0), 0);
          
          setStats((prev) => ({
            ...prev,
            totalUsers: companyUsers.length,
            activeUsers: activeUsers.length,
            totalSpent,
            totalLimit,
          }));
          
          setRecentUsers(companyUsers.slice(0, 5));
        }
        
        if (transactionsRes.success) {
          const transactions = transactionsRes.data || [];
          const approved = transactions.filter((t: any) => t.status === 'approved');
          
          setStats((prev) => ({
            ...prev,
            transactions: transactions.length,
            approved: approved.length,
          }));
        }
        
        if (companyRes.success) {
          setCompany(companyRes.data);
        }
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
  
  const spentPercentage = stats.totalLimit > 0 
    ? Math.round((stats.totalSpent / stats.totalLimit) * 100)
    : 0;
  
  // For company_user: show their own spending info
  const mySpentPercentage = user?.spendingLimit 
    ? Math.round(((user?.spentThisMonth || 0) / user.spendingLimit) * 100)
    : 0;
  const myRemaining = (user?.spendingLimit || 0) - (user?.spentThisMonth || 0);
  
  // Render different dashboards based on role
  if (isRegularUser) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
          <p>Welcome, {user?.firstName}! Here's your spending overview.</p>
        </header>
        
        <div className={styles.statsGrid}>
          <Stat
            label="My Spending Limit"
            value={formatCurrency(user?.spendingLimit || 0)}
            icon={<span>💰</span>}
          />
          <Stat
            label="Spent This Month"
            value={formatCurrency(user?.spentThisMonth || 0)}
            icon={<span>💳</span>}
          />
          <Stat
            label="Remaining"
            value={formatCurrency(Math.max(0, myRemaining))}
            icon={<span>✅</span>}
          />
          <Stat
            label="Budget Used"
            value={`${mySpentPercentage}%`}
            icon={<span>📊</span>}
          />
        </div>
        
        <div className={styles.grid}>
          <Card>
            <CardHeader
              title="My Budget Status"
              subtitle="Your monthly spending progress"
            />
            <CardContent>
              <div className={styles.budgetDisplay}>
                <span className={styles.budgetValue}>{mySpentPercentage}%</span>
                <span className={styles.budgetLabel}>of your budget used</span>
              </div>
              <div className={styles.budgetBar}>
                <div
                  className={styles.budgetProgress}
                  style={{ 
                    width: `${Math.min(mySpentPercentage, 100)}%`,
                    backgroundColor: mySpentPercentage > 90 
                      ? 'var(--color-accent-error)' 
                      : mySpentPercentage > 70 
                        ? 'var(--color-accent-warning)' 
                        : 'var(--color-accent-success)'
                  }}
                />
              </div>
              <div className={styles.budgetStats}>
                <div>
                  <span className={styles.budgetStatLabel}>Spent</span>
                  <span className={styles.budgetStatValue}>{formatCurrency(user?.spentThisMonth || 0)}</span>
                </div>
                <div>
                  <span className={styles.budgetStatLabel}>Remaining</span>
                  <span 
                    className={styles.budgetStatValue} 
                    style={{ 
                      color: myRemaining >= 0 
                        ? 'var(--color-accent-success)' 
                        : 'var(--color-accent-error)' 
                    }}
                  >
                    {formatCurrency(Math.max(0, myRemaining))}
                  </span>
                </div>
              </div>
              {mySpentPercentage > 90 && (
                <p className={styles.warningMessage}>
                  ⚠️ You're approaching your spending limit!
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader
              title="My Recent Transactions"
              subtitle="Your latest purchase verifications"
            />
            <CardContent>
              <div className={styles.userList}>
                {myTransactions.length === 0 ? (
                  <p className={styles.emptyMessage}>No transactions yet</p>
                ) : (
                  myTransactions.map((tx: any) => (
                    <div key={tx.id} className={styles.userItem}>
                      <div className={styles.userInfo}>
                        <Badge
                          variant={tx.status === 'approved' ? 'success' : 'error'}
                          size="sm"
                        >
                          {tx.status}
                        </Badge>
                        <span className={styles.userName}>{formatCurrency(tx.amount)}</span>
                      </div>
                      <span className={styles.userEmail}>{formatRelativeTime(tx.timestamp)}</span>
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
  
  // company_admin view (original dashboard)
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome to {company?.name || 'your company'}'s portal</p>
      </header>
      
      <div className={styles.statsGrid}>
        <Stat
          label="Team Members"
          value={stats.totalUsers}
          icon={<span>👥</span>}
        />
        <Stat
          label="Active Users"
          value={stats.activeUsers}
          icon={<span>✅</span>}
        />
        <Stat
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={<span>💳</span>}
        />
        <Stat
          label="Total Limit"
          value={formatCurrency(stats.totalLimit)}
          icon={<span>💰</span>}
        />
      </div>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Budget Usage"
            subtitle="Company-wide spending overview"
          />
          <CardContent>
            <div className={styles.budgetDisplay}>
              <span className={styles.budgetValue}>{spentPercentage}%</span>
              <span className={styles.budgetLabel}>of total budget used</span>
            </div>
            <div className={styles.budgetBar}>
              <div
                className={styles.budgetProgress}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <div className={styles.budgetStats}>
              <div>
                <span className={styles.budgetStatLabel}>Spent</span>
                <span className={styles.budgetStatValue}>{formatCurrency(stats.totalSpent)}</span>
              </div>
              <div>
                <span className={styles.budgetStatLabel}>Remaining</span>
                <span 
                  className={styles.budgetStatValue} 
                  style={{ 
                    color: stats.totalLimit - stats.totalSpent >= 0 
                      ? 'var(--color-accent-success)' 
                      : 'var(--color-accent-error)' 
                  }}
                >
                  {formatCurrency(Math.max(0, stats.totalLimit - stats.totalSpent))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader
            title="Team Members"
            subtitle="Recent spending activity"
          />
          <CardContent>
            <div className={styles.userList}>
              {recentUsers.length === 0 ? (
                <p className={styles.emptyMessage}>No team members yet</p>
              ) : (
                recentUsers.map((u: any) => (
                  <div key={u.id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <span className={styles.userName}>{u.firstName} {u.lastName}</span>
                        <span className={styles.userEmail}>{u.email}</span>
                      </div>
                    </div>
                    <div className={styles.userSpending}>
                      <span className={styles.spentAmount}>
                        {formatCurrency(u.spentThisMonth || 0)}
                      </span>
                      <span className={styles.spentLimit}>
                        / {formatCurrency(u.spendingLimit || 0)}
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
