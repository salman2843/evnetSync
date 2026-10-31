import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('eventsync_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data.user))
      .catch(() => { localStorage.removeItem('eventsync_token'); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, [token]);

  async function authenticate(path, credentials) {
    const { data } = await api.post(path, credentials);
    localStorage.setItem('eventsync_token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }

  const login = (credentials) => authenticate('/auth/login', credentials);
  const register = (details) => authenticate('/auth/register', details);
  async function updatePlannerProfile(profile) {
    const { data } = await api.put('/auth/planner-profile', profile);
    setUser(data.data.user);
    return data.data.user;
  }
  function logout() {
    localStorage.removeItem('eventsync_token');
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, loading, login, register, updatePlannerProfile, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
