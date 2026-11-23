import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import FullScreenLoader from './components/FullScreenLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Actions from './pages/Actions.jsx';
import Clients from './pages/Clients.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Events from './pages/Events.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Settings from './pages/Settings.jsx';
import Vendors from './pages/Vendors.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

// Every signed-in screen shares the same frame and the same guard.
function privatePage(element) {
  return (
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={privatePage(<Dashboard />)} />

          <Route path="/actions" element={privatePage(<Actions />)} />
          <Route path="/clients" element={privatePage(<Clients />)} />
          <Route path="/vendors" element={privatePage(<Vendors />)} />
          <Route path="/events" element={privatePage(<Events />)} />
          <Route path="/events/:id" element={privatePage(<EventDetail />)} />
          <Route path="/settings" element={privatePage(<Settings />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
