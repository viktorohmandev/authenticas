import { useState, useEffect } from 'react';
import { usersApi, companiesApi } from '@shared/utils/api';
import { formatDate, formatCurrency } from '@shared/utils';
import {
  Card,
  CardHeader,
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

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyId: '',
    role: 'regular' as 'regular' | 'admin',
    spendingLimit: 1000,
  });
  const { showToast } = useToast();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [usersRes, companiesRes] = await Promise.all([
      usersApi.list(),
      companiesApi.list(),
    ]);
    
    if (usersRes.success) setUsers(usersRes.data || []);
    if (companiesRes.success) setCompanies(companiesRes.data || []);
    setIsLoading(false);
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName || !newUser.companyId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const response = await usersApi.create(newUser);
    
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
        role: 'regular',
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
              <TableHeader>Company</TableHeader>
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
                  <TableCell>{getCompanyName(user.companyId)}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={styles.spending}>
                      <span className={styles.spentAmount}>
                        {formatCurrency(user.spentThisMonth || 0)}
                      </span>
                      <span className={styles.spendingLimit}>
                        / {formatCurrency(user.spendingLimit || 0)}
                      </span>
                    </div>
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
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="john.doe@company.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <Select
            label="Company"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={newUser.companyId}
            onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
            placeholder="Select a company"
          />
          <div className={styles.formRow}>
            <Select
              label="Role"
              options={[
                { value: 'regular', label: 'Regular User' },
                { value: 'admin', label: 'Administrator' },
              ]}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'regular' | 'admin' })}
            />
            <Input
              label="Spending Limit ($)"
              type="number"
              min={0}
              value={newUser.spendingLimit}
              onChange={(e) => setNewUser({ ...newUser, spendingLimit: Number(e.target.value) })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

