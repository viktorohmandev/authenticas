import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { transactionsApi } from '@shared/utils/api';
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
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadTransactions();
  }, [user]);
  
  const loadTransactions = async () => {
    try {
      // For retailer_admin, the backend filters by retailerId automatically
      const response = await transactionsApi.list();
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
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
        <h1>Transactions</h1>
        <p>All purchase verification requests for your retailer</p>
      </header>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Transaction ID</TableHeader>
              <TableHeader>User ID</TableHeader>
              <TableHeader>Company ID</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Balance Change</TableHeader>
              <TableHeader>Timestamp</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableEmpty colSpan={7} message="No transactions yet" />
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <code className={styles.txId}>{tx.id.slice(0, 8)}...</code>
                  </TableCell>
                  <TableCell>
                    <code className={styles.userId}>{tx.userId.slice(0, 8)}...</code>
                  </TableCell>
                  <TableCell>
                    <code className={styles.userId}>{tx.companyId.slice(0, 8)}...</code>
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
