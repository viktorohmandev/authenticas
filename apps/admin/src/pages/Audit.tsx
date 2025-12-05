import { useState, useEffect } from 'react';
import { auditApi } from '@shared/utils/api';
import { formatDate } from '@shared/utils';
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
  Button,
  Spinner,
} from '@shared/components';
import styles from './Audit.module.css';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  'purchase.approved': 'success',
  'purchase.denied': 'error',
  'limit.exceeded': 'warning',
  'company.created': 'info',
  'user.created': 'info',
  'auth.login': 'default',
};

export default function Audit() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;
  
  useEffect(() => {
    loadAudit();
  }, [page]);
  
  const loadAudit = async () => {
    setIsLoading(true);
    const response = await auditApi.list(pageSize, page * pageSize);
    if (response.success && response.data) {
      setEntries(response.data.entries || []);
      setTotal(response.data.total || 0);
    }
    setIsLoading(false);
  };
  
  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'default';
  };
  
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Audit Log</h1>
          <p>Complete trail of all system activities</p>
        </div>
      </header>
      
      <Card>
        {isLoading ? (
          <div className={styles.loading}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Performed By</TableHeader>
                  <TableHeader>Target</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableEmpty colSpan={5} message="No audit entries yet" />
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <span className={styles.timestamp}>
                          {formatDate(entry.timestamp)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(entry.action)}>
                          {entry.action.replace('.', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className={styles.id}>
                          {entry.performedBy === 'system' ? 'System' : entry.performedBy.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={styles.target}>
                          {entry.targetType}: {entry.targetId.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        {entry.metadata && (
                          <code className={styles.metadata}>
                            {JSON.stringify(entry.metadata).slice(0, 50)}
                            {JSON.stringify(entry.metadata).length > 50 && '...'}
                          </code>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className={styles.pageInfo}>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

