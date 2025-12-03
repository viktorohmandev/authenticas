import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { Button } from '@shared/components';
import styles from './Layout.module.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/companies', label: 'Companies', icon: '🏢' },
  { path: '/transactions', label: 'Transactions', icon: '💳' },
  { path: '/disconnect-requests', label: 'Disconnect Requests', icon: '🔗' },
  { path: '/webhooks', label: 'Webhooks', icon: '🔔' },
  { path: '/test', label: 'Test Purchase', icon: '🧪' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getRoleLabel = () => {
    if (user?.role === 'system_admin') return 'System Admin';
    return 'Retailer Admin';
  };
  
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔐</span>
          <span className={styles.logoText}>Authenticas</span>
          <span className={styles.badge}>Retailer</span>
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
