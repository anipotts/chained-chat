"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
  accessCode: string | null;
  isAuthenticated: boolean;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  accessCode: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cc_access_code");
    if (stored) setAccessCode(stored);
  }, []);

  const login = async (code: string): Promise<boolean> => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      setAccessCode(code);
      localStorage.setItem("cc_access_code", code);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAccessCode(null);
    localStorage.removeItem("cc_access_code");
  };

  return (
    <AuthContext.Provider
      value={{ accessCode, isAuthenticated: !!accessCode, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
