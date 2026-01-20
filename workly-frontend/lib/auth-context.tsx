'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { isAuthenticated as checkAuth, clearTokens, logout as performLogout } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user has a valid token
        if (checkAuth()) {
          // You can fetch user data here from /auth/me or similar endpoint
          // For now, we'll just set authenticated state
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await performLogout();
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear tokens even if logout request fails
      clearTokens();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: handleLogout,
    setUser: (newUser: User | null) => {
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to logout
 */
export function useLogout() {
  const { logout } = useAuth();
  return logout;
}
