import React, { useState, useEffect } from 'react';
import { usersApi, companiesApi, retailersApi } from '@shared/utils/api';
import { formatDate, formatCurrency } from '@shared/utils';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
  Badge,
  Modal,
  useToast,
  Spinner,
} from '@shared/components';
import styles from './Users.module.css';

type UserRole = 'system_admin' | 'retailer_admin' | 'company_admin' | 'company_user';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyId: '',
    retailerId: '',
    role: 'company_user' as UserRole,
    spendingLimit: 1000,
  });
  const { showToast } = useToast();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [usersRes, companiesRes, retailersRes] = await Promise.all([
      usersApi.list(),
      companiesApi.list(),
      retailersApi.list(),
    ]);
    
    if (usersRes.success) setUsers(usersRes.data || []);
    if (companiesRes.success) setCompanies(companiesRes.data || []);
    if (retailersRes.success) setRetailers(retailersRes.data || []);
    setIsLoading(false);
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields based on role
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Validate role-specific fields
    if ((newUser.role === 'company_admin' || newUser.role === 'company_user') && !newUser.companyId) {
      showToast('Please select a company for this user', 'error');
      return;
    }
    
    if (newUser.role === 'retailer_admin' && !newUser.retailerId) {
      showToast('Please select a retailer for this user', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    // Build the user data based on role
    const userData: any = {
      email: newUser.email,
      password: newUser.password,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
    };
    
    // Add role-specific fields
    if (newUser.role === 'company_admin' || newUser.role === 'company_user') {
      userData.companyId = newUser.companyId;
      userData.spendingLimit = newUser.spendingLimit;
    } else if (newUser.role === 'retailer_admin') {
      userData.retailerId = newUser.retailerId;
    }
    
    const response = await usersApi.create(userData);
    
    if (response.success) {
      showToast('User created successfully', 'success');
      loadData();
      setIsModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        companyId: '',
        retailerId: '',
        role: 'company_user',
        spendingLimit: 1000,
      });
    } else {
      showToast(response.error || 'Failed to create user', 'error');
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const response = await usersApi.delete(userId);
    if (response.success) {
      showToast('User deleted', 'success');
      loadData();
    } else {
      showToast(response.error || 'Failed to delete user', 'error');
    }
  };
  
  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company?.name || 'Unknown';
  };
  
  const getRetailerName = (retailerId: string) => {
    const retailer = retailers.find((r) => r.id === retailerId);
    return retailer?.name || 'Unknown';
  };
  
  const getOrganization = (user: any) => {
    if (user.role === 'system_admin') return '—';
    if (user.role === 'retailer_admin') return getRetailerName(user.retailerId);
    return getCompanyName(user.companyId);
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'system_admin': return 'error';
      case 'retailer_admin': return 'info';
      case 'company_admin': return 'warning';
      default: return 'default';
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
        <div>
          <h1>Users</h1>
          <p>Manage users across all companies</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Create User
        </Button>
      </header>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Organization</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Spending</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableEmpty colSpan={7} message="No users yet" />
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getOrganization(user)}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(user.role === 'company_admin' || user.role === 'company_user') ? (
                      <div className={styles.spending}>
                        <span className={styles.spentAmount}>
                          {formatCurrency(user.spentThisMonth || 0)}
                        </span>
                        <span className={styles.spendingLimit}>
                          / {formatCurrency(user.spendingLimit || 0)}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.noSpending}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'error'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      🗑️
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} isLoading={isSubmitting}>
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className={styles.form}>
          <div className={styles.formRow}>
            <Input
              label="First Name"
              placeholder="John"
              value={newUser.firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={newUser.lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="john.doe@company.com"
            value={newUser.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={newUser.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <Select
            label="User Role"
            options={[
              { value: 'company_user', label: 'Company User' },
              { value: 'company_admin', label: 'Company Admin' },
              { value: 'retailer_admin', label: 'Retailer Admin' },
              { value: 'system_admin', label: 'System Admin' },
            ]}
            value={newUser.role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ 
              ...newUser, 
              role: e.target.value as UserRole,
              companyId: '',
              retailerId: '',
            })}
          />
          
          {/* Show Company selector for company roles */}
          {(newUser.role === 'company_admin' || newUser.role === 'company_user') && (
            <>
              <Select
                label="Company"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={newUser.companyId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ ...newUser, companyId: e.target.value })}
                placeholder="Select a company"
              />
              <Input
                label="Spending Limit ($)"
                type="number"
                min={0}
                value={newUser.spendingLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, spendingLimit: Number(e.target.value) })}
              />
            </>
          )}
          
          {/* Show Retailer selector for retailer_admin role */}
          {newUser.role === 'retailer_admin' && (
            <Select
              label="Retailer"
              options={retailers.map((r) => ({ value: r.id, label: r.name }))}
              value={newUser.retailerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ ...newUser, retailerId: e.target.value })}
              placeholder="Select a retailer"
            />
          )}
        </form>
      </Modal>
    </div>
  );
}

