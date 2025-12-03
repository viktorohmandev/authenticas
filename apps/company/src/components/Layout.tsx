import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { Button } from '@shared/components';
import { canManageUsers, isCompanyUser } from '@shared/types';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getRoleLabel = () => {
    switch (user?.role) {
      case 'system_admin': return 'System Admin';
      case 'company_admin': return 'Company Admin';
      case 'company_user': return 'Employee';
      default: return user?.role || 'User';
    }
  };
  
  // Build nav items based on user role
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/profile', label: 'My Profile', icon: '👤' },
    { path: '/transactions', label: 'Transactions', icon: '💳' },
  ];
  
  // Add admin-only nav items
  if (canManageUsers(user?.role)) {
    navItems.push(
      { path: '/users', label: 'Team Members', icon: '👥' },
      { path: '/spending', label: 'Spending Limits', icon: '💰' },
      { path: '/disconnect', label: 'Disconnect', icon: '🔗' }
    );
  }
  
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔐</span>
          <span className={styles.logoText}>Authenticas</span>
          <span className={styles.badge}>Company</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              end={item.path === '/'}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={styles.userRole}>{getRoleLabel()}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>
      
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
