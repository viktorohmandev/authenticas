import { useState, useEffect } from 'react';
import { useAuth } from '@shared/hooks';
import { usersApi } from '@shared/utils/api';
import { formatCurrency } from '@shared/utils';
import {
  Card,
  CardContent,
  Button,
  Input,
  useToast,
  Spinner,
} from '@shared/components';
import styles from './SpendingLimits.module.css';

export default function SpendingLimits() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
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
  
  const handleEditLimit = (userId: string, currentLimit: number) => {
    setEditingUser(userId);
    setNewLimitValue(currentLimit.toString());
    setEditError(null);
  };
  
  const handleSaveLimit = async (userId: string) => {
    setEditError(null);
    const limitNumber = newLimitValue === '' ? 0 : parseInt(newLimitValue, 10);
    const response = await usersApi.setSpendingLimit(userId, limitNumber);
    if (response.success) {
      showToast('Spending limit updated', 'success');
      loadUsers();
      setEditingUser(null);
    } else {
      const errorMsg = response.error || 'Failed to update limit';
      setEditError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewLimitValue('');
    setEditError(null);
  };
  
  // Handle numeric-only input for spending limit
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or digits only
    if (value === '' || /^\d+$/.test(value)) {
      setNewLimitValue(value);
    }
  };
  
  // Trim leading zeros on blur
  const handleLimitBlur = () => {
    if (newLimitValue !== '' && newLimitValue !== '0') {
      // Remove leading zeros
      const trimmed = newLimitValue.replace(/^0+/, '') || '0';
      setNewLimitValue(trimmed);
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
        <h1>Spending Limits</h1>
        <p>Manage monthly spending limits for team members</p>
      </header>
      
      <div className={styles.userGrid}>
        {users.length === 0 ? (
          <Card>
            <CardContent>
              <p className={styles.emptyMessage}>No team members yet</p>
            </CardContent>
          </Card>
        ) : (
          users.map((u) => (
            <Card key={u.id}>
              <CardContent>
                <div className={styles.userCard}>
                  <div className={styles.userHeader}>
                    <div className={styles.avatar}>
                      {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.firstName} {u.lastName}</span>
                      <span className={styles.userEmail}>{u.email}</span>
                    </div>
                  </div>
                  
                  <div className={styles.spendingInfo}>
                    <div className={styles.spendingRow}>
                      <span className={styles.label}>Spent this month</span>
                      <span className={styles.value}>{formatCurrency(u.spentThisMonth || 0)}</span>
                    </div>
                    <div className={styles.spendingRow}>
                      <span className={styles.label}>Current limit</span>
                      <span className={styles.value}>{formatCurrency(u.spendingLimit || 0)}</span>
                    </div>
                    <div className={styles.spendingRow}>
                      <span className={styles.label}>Remaining</span>
                      <span 
                        className={styles.value} 
                        style={{ 
                          color: (u.spendingLimit || 0) - (u.spentThisMonth || 0) >= 0 
                            ? 'var(--color-accent-success)' 
                            : 'var(--color-accent-error)' 
                        }}
                      >
                        {formatCurrency(Math.max(0, (u.spendingLimit || 0) - (u.spentThisMonth || 0)))}
                      </span>
                    </div>
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
                  
                  {editingUser === u.id ? (
                    <div className={styles.editForm}>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newLimitValue}
                        onChange={handleLimitChange}
                        onBlur={handleLimitBlur}
                        label="New Limit ($)"
                        placeholder="0"
                        error={editError || undefined}
                        hint={`Minimum: ${formatCurrency(u.spentThisMonth || 0)} (current spending)`}
                      />
                      <div className={styles.editActions}>
                        <Button size="sm" onClick={() => handleSaveLimit(u.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLimit(u.id, u.spendingLimit || 0)}
                      className={styles.editButton}
                    >
                      Edit Limit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

