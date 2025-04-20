// filepath: e:\Proyectos\StudentCoinTracker\client\src\context\AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

// Define el tipo para el contexto
type AuthContextType = {
  user: any; // Cambia `any` por el tipo específico de usuario si lo tienes
  login: (email: string, password: string) => void;
  logout: () => void;
};

// Crea el contexto con un valor inicial vacío
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  const login = (email: string, password: string) => {
    // Implementación de login
    console.log(`Login con email: ${email}`);
  };

  const logout = () => {
    // Implementación de logout
    console.log("Logout");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};