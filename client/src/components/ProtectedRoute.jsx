import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-8 text-center text-slate-600">Loading your account…</div>;
  if (!user) return <Navigate to="/login" replace />;
  const onboardingComplete = Boolean(user.plannerProfile?.onboardingCompletedAt);
  if (!onboardingComplete && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (onboardingComplete && location.pathname === '/onboarding') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
