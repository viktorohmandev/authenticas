import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@shared/hooks';
import { PageLoader } from '@shared/components';
import { canAccessRetailerDashboard } from '@shared/types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Transactions from './pages/Transactions';
import Webhooks from './pages/Webhooks';
import TestPurchase from './pages/TestPurchase';
import DisconnectRequests from './pages/DisconnectRequests';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Retailer dashboard requires system_admin or retailer_admin role
  if (!canAccessRetailerDashboard(user?.role)) {
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
          You need <strong>retailer_admin</strong> or <strong>system_admin</strong> privileges to access this dashboard.
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
                <Route path="/companies" element={<Companies />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/webhooks" element={<Webhooks />} />
                <Route path="/test" element={<TestPurchase />} />
                <Route path="/disconnect-requests" element={<DisconnectRequests />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
