import React, { createContext, useContext, useState, ReactNode } from "react";

// Tipos de rol disponibles
export type UserRole = "docente" | "estudiante" | null;

type RoleContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  logout: () => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);

  const logout = () => setRole(null);

  return (
    <RoleContext.Provider value={{ role, setRole, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}