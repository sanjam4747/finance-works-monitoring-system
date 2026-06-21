import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProposalList from './pages/ProposalList';
import ProposalDetails from './pages/ProposalDetails';
import CreateProposal from './pages/CreateProposal';
import MoveProposal from './pages/MoveProposal';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/proposals" element={<ProtectedRoute><ProposalList /></ProtectedRoute>} />
      <Route path="/proposals/create" element={<ProtectedRoute><CreateProposal /></ProtectedRoute>} />
      <Route path="/proposals/move" element={<ProtectedRoute><MoveProposal /></ProtectedRoute>} />
      <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetails /></ProtectedRoute>} />
      <Route path="/proposals/:id/move" element={<ProtectedRoute><MoveProposal /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
