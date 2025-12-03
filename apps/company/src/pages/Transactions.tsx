import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { transactionsApi, usersApi } from '@shared/utils/api';
import { formatDate, formatCurrency } from '@shared/utils';
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
  Spinner,
} from '@shared/components';
import styles from './Transactions.module.css';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  const loadData = async () => {
    if (!user?.companyId) return;
    
    const [transactionsRes, usersRes] = await Promise.all([
      transactionsApi.getByCompany(user.companyId),
      usersApi.list(),
    ]);
    
    if (transactionsRes.success) {
      setTransactions(transactionsRes.data || []);
    }
    if (usersRes.success) {
      setUsers(usersRes.data || []);
    }
    setIsLoading(false);
  };
  
  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
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
        <h1>Transactions</h1>
        <p>All purchase verifications for your company</p>
      </header>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Balance</TableHeader>
              <TableHeader>Timestamp</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableEmpty colSpan={5} message="No transactions yet" />
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <span className={styles.userName}>{getUserName(tx.userId)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={styles.amount}>{formatCurrency(tx.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'approved' ? 'success' : 'error'}>
                      {tx.status}
                    </Badge>
                    {tx.denialReason && (
                      <span className={styles.denialReason}>
                        ({tx.denialReason.replace('_', ' ')})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={styles.balanceChange}>
                      <span>{formatCurrency(tx.balanceBefore)}</span>
                      <span className={styles.arrow}>→</span>
                      <span>{formatCurrency(tx.balanceAfter)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(tx.timestamp)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

