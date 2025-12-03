import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { PageLoader } from '@shared/components';
import { canAccessAdminDashboard } from '@shared/types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Retailers from './pages/Retailers';
import Companies from './pages/Companies';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin dashboard requires system_admin role
  if (!canAccessAdminDashboard(user?.role)) {
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
          You need <strong>system_admin</strong> privileges to access this dashboard.
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
                <Route path="/retailers" element={<Retailers />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/users" element={<Users />} />
                <Route path="/audit" element={<Audit />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
