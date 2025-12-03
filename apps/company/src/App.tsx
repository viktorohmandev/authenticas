import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { PageLoader } from '@shared/components';
import { canAccessCompanyDashboard, canManageUsers, isCompanyUser } from '@shared/types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import SpendingLimits from './pages/SpendingLimits';
import MyProfile from './pages/MyProfile';
import DisconnectRequest from './pages/DisconnectRequest';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Company dashboard requires system_admin, company_admin, or company_user role
  if (!canAccessCompanyDashboard(user?.role)) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)'
      }}>
        <h2 style={{ color: 'var(--color-accent-error)', marginBottom: '1rem' }}>🚫 Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          You need <strong>company_admin</strong> or <strong>company_user</strong> privileges to access this dashboard.
        </p>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>
          Your current role: <strong>{user?.role || 'unknown'}</strong>
        </p>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--color-accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Switch Account
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  const userIsCompanyUser = isCompanyUser(user?.role);
  const userCanManageUsers = canManageUsers(user?.role);
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="/transactions" element={<Transactions />} />
                {/* These routes are only for company_admin and above */}
                {userCanManageUsers && (
                  <>
                    <Route path="/users" element={<Users />} />
                    <Route path="/spending" element={<SpendingLimits />} />
                    <Route path="/disconnect" element={<DisconnectRequest />} />
                  </>
                )}
                {/* Redirect company_user away from admin pages */}
                {userIsCompanyUser && (
                  <>
                    <Route path="/users" element={<Navigate to="/" replace />} />
                    <Route path="/spending" element={<Navigate to="/" replace />} />
                    <Route path="/disconnect" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
