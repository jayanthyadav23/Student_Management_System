import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sms_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('sms_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sms_token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('sms_token')));

  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem('sms_token');
      if (storedToken) {
        try {
          const res = await authApi.getCurrentUser();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('sms_user', JSON.stringify(res.data));
          }
        } catch {
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('sms_token', jwtToken);
      localStorage.setItem('sms_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (registrationData) => {
    const res = await authApi.register(registrationData);
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('sms_token', jwtToken);
      localStorage.setItem('sms_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
  };

  const isAuthenticated = !!token && !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        role,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
