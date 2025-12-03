import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  accentColor?: string;
  navItems?: { label: string; href: string; icon?: React.ReactNode }[];
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 10, 15, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
  },
  headerInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '4rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontWeight: 700,
    fontSize: '1.25rem',
    color: 'var(--color-text-primary)',
  },
  logoAccent: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
  },
  navItem: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  },
  userInfo: {
    textAlign: 'right' as const,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
  logoutButton: {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: 'var(--space-xl) var(--space-lg)',
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
  },
};

export function Layout({ children, title, accentColor = 'var(--color-accent-cyan)', navItems = [] }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={{ ...styles.logoAccent, background: accentColor }} />
            Authenticas
          </div>
          
          <nav style={styles.nav}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={styles.navItem}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>

          <div style={styles.userSection}>
            {user && (
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={styles.userRole}>{user.role}</div>
              </div>
            )}
            <button
              style={styles.logoutButton}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>
          <span style={{ width: 4, height: 24, background: accentColor, borderRadius: 2 }} />
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}

