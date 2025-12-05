import { useState } from 'react';
import { useAuth } from '@shared/hooks';
import { usersApi } from '@shared/utils/api';
import { formatCurrency } from '@shared/utils';
import { isCompanyUser } from '@shared/types';
import { Card, CardHeader, CardContent, Badge, Stat, Button, Input, useToast } from '@shared/components';
import styles from './MyProfile.module.css';

export default function MyProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  
  const isRegularUser = isCompanyUser(user?.role);
  const canEdit = !isRegularUser; // company_admin and above can edit
  
  const getRoleBadge = () => {
    switch (user?.role) {
      case 'system_admin':
        return <Badge variant="info">System Administrator</Badge>;
      case 'company_admin':
        return <Badge variant="info">Company Administrator</Badge>;
      case 'company_user':
        return <Badge variant="default">Employee</Badge>;
      default:
        return <Badge>{user?.role}</Badge>;
    }
  };
  
  const spendingPercentage = user?.spendingLimit 
    ? Math.round(((user?.spentThisMonth || 0) / user.spendingLimit) * 100)
    : 0;
  
  const remaining = (user?.spendingLimit || 0) - (user?.spentThisMonth || 0);
  
  const handleEdit = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };
  
  const handleSave = async () => {
    if (!user?.id) return;
    
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    
    setIsSaving(true);
    
    const response = await usersApi.update(user.id, {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
    });
    
    if (response.success) {
      showToast('Profile updated successfully', 'success');
      setIsEditing(false);
      // Refresh user data by re-fetching from the API
      // The useAuth hook will update when we trigger a refresh
      window.location.reload(); // Simple approach to refresh auth state
    } else {
      showToast(response.error || 'Failed to update profile', 'error');
    }
    
    setIsSaving(false);
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>My Profile</h1>
        <p>{isRegularUser ? 'View your account information and spending status' : 'Manage your account information'}</p>
      </header>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader
            title="Personal Information"
            subtitle={isEditing ? 'Edit your account details' : 'Your account details'}
            action={
              canEdit && !isEditing ? (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  ✏️ Edit
                </Button>
              ) : null
            }
          />
          <CardContent>
            <div className={styles.profileInfo}>
              <div className={styles.avatarLarge}>
                {(isEditing ? editForm.firstName : user?.firstName)?.charAt(0)}
                {(isEditing ? editForm.lastName : user?.lastName)?.charAt(0)}
              </div>
              <div className={styles.details}>
                {isEditing ? (
                  <>
                    <div className={styles.editField}>
                      <Input
                        label="First Name"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className={styles.editField}>
                      <Input
                        label="Last Name"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div className={styles.editActions}>
                      <Button variant="secondary" size="sm" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.field}>
                      <span className={styles.label}>Full Name</span>
                      <span className={styles.value}>{user?.firstName} {user?.lastName}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Email</span>
                      <span className={styles.value}>{user?.email}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Role</span>
                      <span className={styles.value}>{getRoleBadge()}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>User ID</span>
                      <code className={styles.code}>{user?.id}</code>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {(user?.role === 'company_user' || user?.role === 'company_admin') && (
          <Card>
            <CardHeader
              title="Spending Overview"
              subtitle="Your monthly spending status"
            />
            <CardContent>
              <div className={styles.statsGrid}>
                <Stat
                  label="Spending Limit"
                  value={formatCurrency(user?.spendingLimit || 0)}
                  icon={<span>💰</span>}
                />
                <Stat
                  label="Spent This Month"
                  value={formatCurrency(user?.spentThisMonth || 0)}
                  icon={<span>💳</span>}
                />
                <Stat
                  label="Remaining"
                  value={formatCurrency(Math.max(0, remaining))}
                  icon={<span>✅</span>}
                />
              </div>
              
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>Budget Usage</span>
                  <span>{spendingPercentage}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min(spendingPercentage, 100)}%`,
                      backgroundColor: spendingPercentage > 90 
                        ? 'var(--color-accent-error)' 
                        : spendingPercentage > 70 
                          ? 'var(--color-accent-warning)' 
                          : 'var(--color-accent-success)'
                    }}
                  />
                </div>
                {spendingPercentage > 90 && (
                  <p className={styles.warning}>
                    ⚠️ You're approaching your spending limit!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
