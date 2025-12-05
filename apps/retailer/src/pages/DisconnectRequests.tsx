import { useState, useEffect } from 'react';
import { disconnectRequestsApi, companiesApi } from '@shared/utils/api';
import type { DisconnectRequest } from '@shared/types';
import {
  Card,
  CardHeader,
  Button,
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
import styles from './DisconnectRequests.module.css';

export default function DisconnectRequests() {
  const [requests, setRequests] = useState<DisconnectRequest[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [requestsRes, companiesRes] = await Promise.all([
      disconnectRequestsApi.list(),
      companiesApi.list(),
    ]);
    
    if (requestsRes.success) {
      setRequests(requestsRes.data || []);
    }
    
    if (companiesRes.success) {
      const companyMap: Record<string, string> = {};
      (companiesRes.data || []).forEach((c: any) => {
        companyMap[c.id] = c.name;
      });
      setCompanies(companyMap);
    }
    
    setIsLoading(false);
  };
  
  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this disconnect request? The company will be disconnected from your retailer.')) {
      return;
    }
    
    setProcessingId(id);
    const response = await disconnectRequestsApi.approve(id);
    
    if (response.success) {
      showToast('Disconnect request approved. Company has been disconnected.', 'success');
      loadData();
    } else {
      showToast(response.error || 'Failed to approve request', 'error');
    }
    setProcessingId(null);
  };
  
  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this disconnect request?')) {
      return;
    }
    
    setProcessingId(id);
    const response = await disconnectRequestsApi.reject(id);
    
    if (response.success) {
      showToast('Disconnect request rejected.', 'success');
      loadData();
    } else {
      showToast(response.error || 'Failed to reject request', 'error');
    }
    setProcessingId(null);
  };
  
  const getStatusBadge = (status: DisconnectRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const pendingRequests = requests.filter(r => r.status === 'pending');
  
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
          <h1>Disconnect Requests</h1>
          <p>Manage company disconnect requests</p>
        </div>
      </header>
      
      {pendingRequests.length > 0 && (
        <Card className={styles.pendingCard}>
          <CardHeader
            title={`⚠️ Pending Requests (${pendingRequests.length})`}
            subtitle="These requests require your attention"
          />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Company</TableHeader>
                <TableHeader>Reason</TableHeader>
                <TableHeader>Requested</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className={styles.companyInfo}>
                      <span className={styles.companyName}>
                        {companies[request.companyId] || 'Unknown Company'}
                      </span>
                      <span className={styles.companyId}>{request.companyId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.reason || <span className={styles.noReason}>No reason provided</span>}
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(request.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        isLoading={processingId === request.id}
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        isLoading={processingId === request.id}
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      
      <Card>
        <CardHeader
          title="All Requests"
          subtitle="History of all disconnect requests"
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Company</TableHeader>
              <TableHeader>Reason</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Requested</TableHeader>
              <TableHeader>Updated</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableEmpty colSpan={5} message="No disconnect requests yet" />
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className={styles.companyInfo}>
                      <span className={styles.companyName}>
                        {companies[request.companyId] || 'Unknown Company'}
                      </span>
                      <span className={styles.companyId}>{request.companyId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.reason || <span className={styles.noReason}>No reason provided</span>}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(request.createdAt)}
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(request.updatedAt)}
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

