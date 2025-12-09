import React, { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { transactionsApi, linksApi, companiesApi } from '@shared/utils/api';
import { formatCurrency } from '@shared/utils';
import type { Company } from '@shared/types';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Badge,
  useToast,
  Spinner,
} from '@shared/components';
import styles from './TestPurchase.module.css';

export default function TestPurchase() {
  const { user } = useAuth();
  // Initialize as empty arrays to prevent undefined errors
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { showToast } = useToast();
  
  // Load companies linked to the retailer
  useEffect(() => {
    loadCompanies();
  }, [user]);
  
  const loadCompanies = async () => {
    if (!user?.retailerId) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Get companies linked to this retailer via the link table
      const response = await linksApi.getCompaniesForRetailer(user.retailerId);
      if (response.success && response.data) {
        // Ensure we always set an array
        const companyList = Array.isArray(response.data) ? response.data : [];
        setCompanies(companyList);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load users when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      loadUsersForCompany(selectedCompanyId);
    } else {
      setUsers([]);
      setSelectedUserId('');
    }
  }, [selectedCompanyId]);
  
  const loadUsersForCompany = async (companyId: string) => {
    setIsLoadingUsers(true);
    setUsers([]);
    setSelectedUserId('');
    
    try {
      // Get users for the selected company
      const response = await companiesApi.getUsers(companyId);
      if (response.success && response.data) {
        // Ensure we have an array
        const userList = Array.isArray(response.data) ? response.data : [];
        // Filter to only active users with company_user or company_admin role
        const companyUsers = userList.filter(
          (u: any) => u.isActive && ['company_user', 'company_admin'].includes(u.role)
        );
        setUsers(companyUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const handleTestPurchase = async () => {
    if (!selectedUserId || !selectedCompanyId || !amount || !user?.retailerId) {
      showToast('Please select a company, user, and enter an amount', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    
    // Include retailerId in the verify request (multi-retailer model)
    const response = await transactionsApi.verify({
      userId: selectedUserId,
      companyId: selectedCompanyId,
      retailerId: user.retailerId,
      amount: parseFloat(amount),
    });
    
    setResult(response);
    
    if (response.success) {
      showToast('Purchase approved!', 'success');
      // Refresh user data to show updated spending
      if (selectedCompanyId) {
        loadUsersForCompany(selectedCompanyId);
      }
    } else {
      showToast(response.error || 'Purchase denied', 'warning');
    }
    
    setIsSubmitting(false);
  };
  
  // Ensure arrays before accessing - defensive programming
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeUsers = Array.isArray(users) ? users : [];
  
  const selectedCompany = safeCompanies.find((c) => c.id === selectedCompanyId);
  const selectedUser = safeUsers.find((u) => u.id === selectedUserId);
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (safeCompanies.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Test Purchase</h1>
          <p>Simulate a purchase verification request</p>
        </header>
        
        <Card>
          <CardContent>
            <div className={styles.emptyResult}>
              <span>🏢</span>
              <p>No companies are connected to your retailer.</p>
              <p className={styles.hint}>Companies must be linked to your retailer before you can test purchases.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Test Purchase</h1>
        <p>Simulate a purchase verification request</p>
      </header>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Purchase Details"
            subtitle="Enter test purchase information"
          />
          <CardContent>
            <div className={styles.form}>
              {/* Step 1: Select Company */}
              <Select
                label="Select Company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Choose a company...</option>
                {safeCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              
              {selectedCompany && (
                <div className={styles.companyInfo}>
                  <Badge variant="success" size="sm">Connected</Badge>
                  <span>{selectedCompany.name}</span>
                </div>
              )}
              
              {/* Step 2: Select User (after company is selected) */}
              {selectedCompanyId && (
                <>
                  {isLoadingUsers ? (
                    <div className={styles.loadingUsers}>
                      <Spinner size="sm" />
                      <span>Loading users...</span>
                    </div>
                  ) : safeUsers.length === 0 ? (
                    <div className={styles.noUsers}>
                      <span>No users found for this company</span>
                    </div>
                  ) : (
                    <Select
                      label="Select User"
                      value={selectedUserId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Choose a user...</option>
                      {safeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </option>
                      ))}
                    </Select>
                  )}
                </>
              )}
              
              {/* User spending info */}
              {selectedUser && (
                <div className={styles.userInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Spending Limit:</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(selectedUser.spendingLimit || 0)}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Spent This Month:</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(selectedUser.spentThisMonth || 0)}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Remaining Budget:</span>
                    <span className={styles.infoValue} style={{ color: 'var(--color-accent-success)' }}>
                      {formatCurrency(Math.max(0, (selectedUser.spendingLimit || 0) - (selectedUser.spentThisMonth || 0)))}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Note:</span>
                    <span className={styles.infoHint}>Spending limits are GLOBAL across all retailers</span>
                  </div>
                </div>
              )}
              
              {/* Step 3: Enter Amount */}
              <Input
                label="Purchase Amount ($)"
                type="number"
                min={0}
                step="0.01"
                placeholder="50.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                disabled={!selectedUserId}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTestPurchase}
              isLoading={isSubmitting}
              disabled={!selectedCompanyId || !selectedUserId || !amount}
            >
              🧪 Test Purchase
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader
            title="Result"
            subtitle="Purchase verification response"
          />
          <CardContent>
            {!result ? (
              <div className={styles.emptyResult}>
                <span>🧪</span>
                <p>Run a test to see the result</p>
              </div>
            ) : (
              <div className={styles.result}>
                <div className={styles.resultHeader}>
                  <Badge
                    variant={result.success ? 'success' : 'error'}
                    size="md"
                  >
                    {result.success ? 'APPROVED' : 'DENIED'}
                  </Badge>
                </div>
                
                {result.data && (
                  <div className={styles.resultDetails}>
                    <div className={styles.resultRow}>
                      <span>Transaction ID:</span>
                      <code>{result.data.transactionId?.slice(0, 12)}...</code>
                    </div>
                    {result.data.amount && (
                      <div className={styles.resultRow}>
                        <span>Amount:</span>
                        <span>{formatCurrency(result.data.amount)}</span>
                      </div>
                    )}
                    {result.data.spentThisMonth !== undefined && (
                      <div className={styles.resultRow}>
                        <span>New Spent Amount:</span>
                        <span>{formatCurrency(result.data.spentThisMonth)}</span>
                      </div>
                    )}
                    {result.data.remainingBudget !== undefined && (
                      <div className={styles.resultRow}>
                        <span>Remaining Budget:</span>
                        <span style={{ color: 'var(--color-accent-success)' }}>
                          {formatCurrency(result.data.remainingBudget)}
                        </span>
                      </div>
                    )}
                    {result.data.reason && (
                      <div className={styles.resultRow}>
                        <span>Denial Reason:</span>
                        <Badge variant="error" size="sm">
                          {result.data.reason.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {result.error && (
                  <div className={styles.errorMessage}>
                    {result.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
