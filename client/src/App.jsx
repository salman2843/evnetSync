import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import FullScreenLoader from './components/FullScreenLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Login from './pages/Login.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={
              <ComingSoon
                title="Registration is next"
                description="The client is being rebuilt one screen at a time. Sign in with the seeded demo planner for now."
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ComingSoon
                  signedIn
                  title="You are signed in"
                  description="Your session works. The dashboard is the next screen in the rebuild."
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
