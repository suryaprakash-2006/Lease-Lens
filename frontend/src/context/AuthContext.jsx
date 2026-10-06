import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getToken, setToken } from '../services/api.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Re-validate stored token with backend on application boot
   */
  const initializeAuth = useCallback(async () => {
    const existingToken = getToken();

    if (!existingToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        setTokenState(existingToken);
      } else {
        // Unexpected format, clear invalid token
        setToken(null);
        setTokenState(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('[Auth] Session validation failed or expired:', err.message);
      // Invalidate expired / corrupted token
      setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Log in user
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { user: loggedInUser, token: receivedToken } = response.data;

      setToken(receivedToken);
      setTokenState(receivedToken);
      setUser(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  /**
   * Register new account
   */
  const register = async (userData) => {
    setAuthError(null);
    try {
      const response = await authAPI.register(userData);
      const { user: registeredUser, token: receivedToken } = response.data;

      setToken(receivedToken);
      setTokenState(receivedToken);
      setUser(registeredUser);

      return { success: true, user: registeredUser };
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  };

  /**
   * Log out user
   */
  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setAuthError(null);
  };

  /**
   * Update user profile in local state
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      throw err;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    authError,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: initializeAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
