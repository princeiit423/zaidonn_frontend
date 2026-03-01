import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "./query-client";

interface User {
  _id: string;
  username: string;
  role: string;
  name: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  gstNumber: string | null;
  panNumber: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = "https://zaidonn.onrender.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 CENTRAL TOKEN GETTER
  const getToken = async () => {
    return await AsyncStorage.getItem("token");
  };

  // 🔥 AUTO REFRESH USER
  const refreshUser = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await AsyncStorage.removeItem("token");
        setUser(null);
        queryClient.clear();
        return;
      }

      const data = await res.json();
      setUser(data);

      // 🔥 REFRESH ALL QUERIES AFTER USER LOAD
      queryClient.invalidateQueries();
    } catch (error) {
      //console.log("refreshUser error:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔥 APP START AUTO LOAD
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 🔥 LOGIN
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();

      if (!data.token) {
        throw new Error("Token not received");
      }

      await AsyncStorage.setItem("token", data.token);

      // 🔥 AUTO LOAD USER AFTER LOGIN
      await refreshUser();
    } catch (err) {
      //console.log("LOGIN ERROR:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 LOGOUT
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
    queryClient.clear();
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
