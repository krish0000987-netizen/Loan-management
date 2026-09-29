import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken, getToken, setToken } from "./api";

export interface SessionUser {
  id: number;
  tenant_id: number;
  branch_id: number | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  customer_id?: number | null;
}

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const res = await api<{ user: SessionUser }>("/auth/me");
        setUser(res.user);
      } catch {
        clearToken();
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: SessionUser }>("/auth/login", { method: "POST", body: { email, password } });
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch { /* noop */ }
    clearToken();
    setUser(null);
    // Signing out always returns the visitor to the public landing page
    nav("/");
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", tenant_admin: "Tenant Admin", branch_admin: "Branch Admin",
  sales_manager: "Sales Manager", telecaller: "Telecaller", field_executive: "Field Executive",
  credit_analyst: "Credit Analyst", credit_manager: "Credit Manager", underwriter: "Underwriter",
  operations: "Operations", collection_manager: "Collection Manager", collection_agent: "Collection Agent",
  dsa: "DSA Partner", finance: "Finance", auditor: "Auditor", compliance_officer: "Compliance Officer",
  customer_support: "Customer Support", customer: "Customer"
};
