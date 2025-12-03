import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { Button } from '@shared/components';
import styles from './Layout.module.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/retailers', label: 'Retailers', icon: '🏪' },
  { path: '/companies', label: 'Companies', icon: '🏢' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/audit', label: 'Audit Log', icon: '📋' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🔐</span>
          <span className={styles.logoText}>Authenticas</span>
          <span className={styles.badge}>System Admin</span>
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
              <span className={styles.userRole}>System Administrator</span>
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
