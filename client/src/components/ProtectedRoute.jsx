import { Navigate } from 'react-router-dom';
import FullScreenLoader from './FullScreenLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Blocks a route until the stored session has been checked.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
