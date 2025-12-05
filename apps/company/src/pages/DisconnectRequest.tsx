import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { companiesApi, linksApi } from '@shared/utils/api';
import type { DisconnectRequest as DisconnectRequestType, Retailer } from '@shared/types';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Badge,
  Select,
  useToast,
  Spinner,
} from '@shared/components';
import { formatRelativeTime } from '@shared/utils';
import styles from './DisconnectRequest.module.css';

export default function DisconnectRequest() {
  const { user } = useAuth();
  const [, setCompany] = useState<any>(null);
  // Initialize as empty array to prevent undefined errors
  const [linkedRetailers, setLinkedRetailers] = useState<Retailer[]>([]);
  const [requests, setRequests] = useState<DisconnectRequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  const loadData = async () => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    
    setLoadError(null);
    
    try {
      // Get company info
      const companyRes = await companiesApi.get(user.companyId);
      if (companyRes.success && companyRes.data) {
        setCompany(companyRes.data);
      }
      
      // Get linked retailers using the links API
      const retailersRes = await linksApi.getRetailersForCompany(user.companyId);
      if (retailersRes.success && retailersRes.data) {
        // Ensure we always set an array
        const retailers = Array.isArray(retailersRes.data) ? retailersRes.data : [];
        setLinkedRetailers(retailers);
      } else {
        console.error('Failed to load retailers:', retailersRes.error);
        setLinkedRetailers([]);
      }
      
      // Get disconnect requests
      const requestsRes = await companiesApi.getDisconnectRequests(user.companyId);
      if (requestsRes.success && requestsRes.data) {
        // Ensure we always set an array
        const reqs = Array.isArray(requestsRes.data) ? requestsRes.data : [];
        setRequests(reqs);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoadError('Failed to load data. Please try again.');
      // Ensure arrays are set even on error
      setLinkedRetailers([]);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.companyId || !selectedRetailerId) {
      showToast('Please select a retailer', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await companiesApi.createDisconnectRequest(
        user.companyId, 
        selectedRetailerId, 
        reason || undefined
      );
      
      if (response.success) {
        showToast('Disconnect request submitted successfully', 'success');
        setReason('');
        setSelectedRetailerId('');
        setShowForm(false);
        loadData();
      } else {
        showToast(response.error || 'Failed to submit request', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadge = (status: DisconnectRequestType['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getRetailerName = (retailerId: string) => {
    if (!retailerId) return 'Unknown Retailer';
    // Ensure linkedRetailers is an array before calling find
    if (!Array.isArray(linkedRetailers)) return 'Unknown Retailer';
    const retailer = linkedRetailers.find(r => r.id === retailerId);
    return retailer?.name || 'Unknown Retailer';
  };
  
  // Ensure arrays before filtering - defensive programming
  const safeLinkedRetailers = Array.isArray(linkedRetailers) ? linkedRetailers : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  
  // Filter out retailers that already have pending requests
  const pendingRequests = safeRequests.filter(r => r.status === 'pending');
  const availableRetailers = safeLinkedRetailers.filter(
    r => !pendingRequests.some(pr => pr.retailerId === r.id)
  );
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (loadError) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Retailer Connections</h1>
          <p>Manage your retailer connections</p>
        </header>
        
        <Card>
          <CardContent>
            <div className={styles.noConnection}>
              <span className={styles.icon}>⚠️</span>
              <h3>Error Loading Data</h3>
              <p>{loadError}</p>
              <Button onClick={loadData} style={{ marginTop: '1rem' }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (safeLinkedRetailers.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Retailer Connections</h1>
          <p>Manage your retailer connections</p>
        </header>
        
        <Card>
          <CardContent>
            <div className={styles.noConnection}>
              <span className={styles.icon}>🔗</span>
              <h3>No Connections</h3>
              <p>Your company is not currently connected to any retailers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Retailer Connections</h1>
        <p>Manage your company's retailer partnerships</p>
      </header>
      
      {/* Connected Retailers */}
      <Card className={styles.connectionCard}>
        <CardHeader
          title="Connected Retailers"
          subtitle={`Your company is connected to ${safeLinkedRetailers.length} retailer${safeLinkedRetailers.length !== 1 ? 's' : ''}`}
        />
        <CardContent>
          <div className={styles.retailerList}>
            {safeLinkedRetailers.map((retailer) => {
              const hasPendingRequest = pendingRequests.some(
                pr => pr.retailerId === retailer.id
              );
              
              return (
                <div key={retailer.id} className={styles.retailerItem}>
                  <div className={styles.entity}>
                    <span className={styles.entityIcon}>🏪</span>
                    <div>
                      <span className={styles.entityName}>{retailer.name}</span>
                      {hasPendingRequest && (
                        <Badge variant="warning" size="sm">Disconnect Pending</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className={styles.pendingCard}>
          <CardHeader
            title="⏳ Pending Requests"
            subtitle="Disconnect requests awaiting review"
          />
          <CardContent>
            {pendingRequests.map((request) => (
              <div key={request.id} className={styles.requestDetails}>
                <div className={styles.requestField}>
                  <span className={styles.fieldLabel}>Retailer</span>
                  <span>{getRetailerName(request.retailerId)}</span>
                </div>
                <div className={styles.requestField}>
                  <span className={styles.fieldLabel}>Status</span>
                  {getStatusBadge(request.status)}
                </div>
                <div className={styles.requestField}>
                  <span className={styles.fieldLabel}>Submitted</span>
                  <span>{formatRelativeTime(request.createdAt)}</span>
                </div>
                {request.reason && (
                  <div className={styles.requestField}>
                    <span className={styles.fieldLabel}>Reason</span>
                    <span>{request.reason}</span>
                  </div>
                )}
              </div>
            ))}
            <p className={styles.pendingNote}>
              The retailer will review your request and either approve or reject it.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* New Request Form */}
      {availableRetailers.length > 0 && (
        <Card>
          <CardHeader
            title="Request Disconnect"
            subtitle="Submit a request to disconnect from a retailer"
          />
          <CardContent>
            {!showForm ? (
              <div className={styles.requestIntro}>
                <p>
                  Disconnecting from a retailer will end your partnership and you will no longer
                  be able to process transactions through them. Your spending limits remain global
                  across all connected retailers.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Request Disconnect
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className={styles.form}>
                <Select
                  label="Select Retailer"
                  value={selectedRetailerId}
                  onChange={(e) => setSelectedRetailerId(e.target.value)}
                >
                  <option value="">Choose a retailer...</option>
                  {availableRetailers.map((retailer) => (
                    <option key={retailer.id} value={retailer.id}>
                      {retailer.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Reason (Optional)"
                  placeholder="Why do you want to disconnect?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  hint="Providing a reason helps the retailer understand your request"
                />
                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setReason('');
                      setSelectedRetailerId('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} disabled={!selectedRetailerId}>
                    Submit Request
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Request History */}
      {safeRequests.filter(r => r.status !== 'pending').length > 0 && (
        <Card>
          <CardHeader
            title="Request History"
            subtitle="Previous disconnect requests"
          />
          <CardContent>
            <div className={styles.history}>
              {safeRequests
                .filter(r => r.status !== 'pending')
                .map((request) => (
                  <div key={request.id} className={styles.historyItem}>
                    <div className={styles.historyStatus}>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className={styles.historyDetails}>
                      <span className={styles.historyRetailer}>
                        {getRetailerName(request.retailerId)}
                      </span>
                      <span className={styles.historyDate}>
                        {formatRelativeTime(request.createdAt)}
                      </span>
                      {request.reason && (
                        <span className={styles.historyReason}>{request.reason}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
