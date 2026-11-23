import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { TOKEN_KEY } from '../api/axios.js';
import { loginRequest, meRequest, registerRequest } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  // A password change hands back a fresh token together with the user. That
  // pair is already complete, so the /me round-trip is skipped and the screen
  // (and its toast) is not replaced by the full-page session loader.
  const skipNextFetch = useRef(false);

  // On a reload, trade the stored token for the current user. An expired token
  // is cleared so the visitor lands back on the login screen.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    meRequest()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const data = await loginRequest(credentials);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // Registering signs the planner in, exactly like a login.
  async function register(details) {
    const data = await registerRequest(details);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  // Settings saves the user returned by the profile endpoints so the sidebar and
  // mobile account mark change immediately. A password change also hands back a
  // fresh token, which replaces the one that was just invalidated.
  function updateUser(nextUser, nextToken) {
    if (nextUser) setUser(nextUser);
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      if (nextUser) skipNextFetch.current = true;
      setToken(nextToken);
    }
  }

  const value = { user, token, loading, login, register, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
