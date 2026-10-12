import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if refresh_token exists as a proxy for authentication
    return !!localStorage.getItem('refresh_token');
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      // eslint-disable-next-line react/immutability -- logout se declara más abajo (const); el listener solo se dispara post-montaje
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    const userData = data.user || { username, role: 'Administrador', email: `${username}@escuela.edu` };

    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user_data', JSON.stringify(userData));
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      // Call a /me endpoint to verify authentication via HttpOnly cookie
      // For now, we'll use the presence of refresh_token as a proxy
      const hasRefreshToken = !!localStorage.getItem('refresh_token');
      setIsAuthenticated(hasRefreshToken);
      return hasRefreshToken;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react/only-export-components -- useAuth comparte módulo con AuthProvider (patrón Context estándar de React)
export const useAuth = () => useContext(AuthContext);
