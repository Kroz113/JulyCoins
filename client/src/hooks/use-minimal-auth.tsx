import { createContext, ReactNode, useContext, useState } from "react";

type User = {
  id: number;
  username: string;
  role: string;
};

type MinimalAuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, phone: string) => Promise<void>;
};

export const MinimalAuthContext = createContext<MinimalAuthContextType | null>(null);

export function MinimalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, phone: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, phone }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MinimalAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </MinimalAuthContext.Provider>
  );
}

export function useMinimalAuth() {
  const context = useContext(MinimalAuthContext);
  if (!context) {
    throw new Error("useMinimalAuth must be used within a MinimalAuthProvider");
  }
  return context;
}