"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi, userApi, setAccessToken, getAccessToken, setOnUnauthorized } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userId: number | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<{ organizationId: number }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setUserId(null);
    setAccessToken(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await userApi.get();
      setUser(userData);
      setUserId(userData.id);
    } catch {
      setUser(null);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          await refreshUser();
        } catch {
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setAccessToken(response.accessToken);
    setUserId(response.userId);
    await refreshUser();
  };

  const register = async (name: string, email: string, password: string, organizationName: string) => {
    const response = await authApi.register(name, email, password, organizationName);
    // After registration, login automatically
    const loginResponse = await authApi.login(email, password);
    setAccessToken(loginResponse.accessToken);
    setUserId(loginResponse.userId);
    await refreshUser();
    return { organizationId: response.organizationId };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    setUserId(null);
    setAccessToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
