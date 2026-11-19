import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import FullScreenLoader from './components/FullScreenLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Clients from './pages/Clients.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

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

          {/* Screens still to be built, kept reachable so navigation never
              dead-ends and the shell can be reviewed. */}
          <Route
            path="/actions"
            element={privatePage(
              <ComingSoon
                title="Action center"
                description="The full list of things to do, with overdue, today and next-seven-days filters. The dashboard already shows the top five."
              />
            )}
          />
          <Route path="/clients" element={privatePage(<Clients />)} />
          <Route
            path="/vendors"
            element={privatePage(
              <ComingSoon
                title="Vendors"
                description="Your vendor book, with categories, contact details and the events each one is working on."
              />
            )}
          />
          <Route
            path="/events"
            element={privatePage(
              <ComingSoon
                title="Events"
                description="All events with their dates, budgets and task progress, filterable by status."
              />
            )}
          />
          <Route
            path="/events/:id"
            element={privatePage(
              <ComingSoon
                title="Event details"
                description="One event in full: tasks, assigned vendors, budget and the actions it raises."
              />
            )}
          />
          <Route
            path="/settings"
            element={privatePage(
              <ComingSoon
                title="Settings"
                description="Your name, business details, logo, password and defaults."
              />
            )}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
