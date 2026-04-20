import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginRequest, meRequest, type LoginResponse } from "../services/auth.service";

type AuthUser = LoginResponse["user"];

type AuthContextValue = {
  user: AuthUser | null;
  token: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_TOKEN = "er_operaciones_token";
const STORAGE_USER = "er_operaciones_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const storedToken = localStorage.getItem(STORAGE_TOKEN) || "";
        const storedUser = localStorage.getItem(STORAGE_USER);

        if (!storedToken || !storedUser) {
          setLoading(false);
          return;
        }

        await meRequest(storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        setToken("");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void restore();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);

    localStorage.setItem(STORAGE_TOKEN, data.token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }

  function logout() {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setToken("");
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
