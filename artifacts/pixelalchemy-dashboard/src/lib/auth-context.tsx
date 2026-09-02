import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AUTH_STORAGE_KEY = "narada_session_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const login = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === "admin@gmail.com" && cleanPassword === "admin123") {
      const sessionUser: AuthUser = {
        email: "admin@gmail.com",
        name: "Duty Officer",
        role: "Disaster Command Administrator",
      };
      setUser(sessionUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      } catch {
        // ignore storage errors
      }
      return { success: true };
    }

    return {
      success: false,
      error: "Invalid credentials. Please use admin@gmail.com and admin123.",
    };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
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
