import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { usersApi } from '@shared/utils/api';
import { formatCurrency } from '@shared/utils';
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

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'regular' as 'regular' | 'admin',
    spendingLimitValue: '500', // Store as string for controlled input
  });
  const { showToast } = useToast();
  
  useEffect(() => {
    loadUsers();
  }, [user]);
  
  const loadUsers = async () => {
    if (!user?.companyId) return;
    
    const response = await usersApi.list();
    if (response.success) {
      const companyUsers = (response.data || []).filter(
        (u: any) => u.companyId === user.companyId
      );
      setUsers(companyUsers);
    }
    setIsLoading(false);
  };
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;
    
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const spendingLimit = newUser.spendingLimitValue === '' ? 0 : parseInt(newUser.spendingLimitValue, 10);
    const response = await usersApi.create({
      email: newUser.email,
      password: newUser.password,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      spendingLimit,
      companyId: user.companyId,
    });
    
    if (response.success) {
      showToast('Team member invited successfully', 'success');
      loadUsers();
      setIsModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'regular',
        spendingLimitValue: '500',
      });
    } else {
      showToast(response.error || 'Failed to invite user', 'error');
    }
    setIsSubmitting(false);
  };
  
  // Handle numeric-only input for spending limit
  const handleSpendingLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or digits only
    if (value === '' || /^\d+$/.test(value)) {
      setNewUser({ ...newUser, spendingLimitValue: value });
    }
  };
  
  // Trim leading zeros on blur
  const handleSpendingLimitBlur = () => {
    if (newUser.spendingLimitValue !== '' && newUser.spendingLimitValue !== '0') {
      const trimmed = newUser.spendingLimitValue.replace(/^0+/, '') || '0';
      setNewUser({ ...newUser, spendingLimitValue: trimmed });
    }
  };
  
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const response = await usersApi.update(userId, { isActive: !currentStatus });
    if (response.success) {
      showToast(`User ${currentStatus ? 'deactivated' : 'activated'}`, 'success');
      loadUsers();
    } else {
      showToast(response.error || 'Failed to update user', 'error');
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
          <h1>Team Members</h1>
          <p>Manage your company's users</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          + Invite User
        </Button>
      </header>
      
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Spending</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableEmpty colSpan={5} message="No team members yet" />
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={styles.spending}>
                      <span className={styles.spentAmount}>
                        {formatCurrency(u.spentThisMonth || 0)}
                      </span>
                      <span className={styles.spendingLimit}>
                        / {formatCurrency(u.spendingLimit || 0)}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min(
                            ((u.spentThisMonth || 0) / (u.spendingLimit || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'success' : 'error'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
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
        title="Invite Team Member"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteUser} className={styles.form}>
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
            label="Temporary Password"
            type="password"
            placeholder="Enter temporary password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            hint="User should change this on first login"
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newUser.spendingLimitValue}
              onChange={handleSpendingLimitChange}
              onBlur={handleSpendingLimitBlur}
              placeholder="0"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

