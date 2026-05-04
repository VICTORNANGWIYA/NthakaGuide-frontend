import {
  createContext, useContext, useState,
  useEffect, useRef, useCallback, type ReactNode,
} from "react";

interface AuthContextType {
  user:    any;
  token:   string | null;
  loading: boolean;
  signOut: () => void;
  login:   (user: any, token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user:    null,
  token:   null,
  loading: true,
  signOut: () => {},
  login:   () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── JWT helpers ───────────────────────────────────────────────────────────────
function decodeJWT(token: string): Record<string, any> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function msUntilExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload || typeof payload.exp !== "number") return null;
  const expiresAt = payload.exp * 1000;
  return Math.max(0, expiresAt - Date.now());
}

function isTokenExpired(token: string): boolean {
  const ms = msUntilExpiry(token);
  return ms !== null && ms === 0;
}

// ── Restore from localStorage — skip if already expired ───────────────────────
function getInitialAuth(): { user: any; token: string | null } {
  try {
    const storedUser  = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return { user: null, token: null };
      }
      return { user: JSON.parse(storedUser), token: storedToken };
    }
  } catch {}
  return { user: null, token: null };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = getInitialAuth();

  const [user,    setUser]    = useState<any>(initial.user);
  const [token,   setToken]   = useState<string | null>(initial.token);
  const [loading, setLoading] = useState(true);

  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = () => {
    if (expiryTimerRef.current !== null) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  };

  const signOut = useCallback(() => {
    clearExpiryTimer();
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const scheduleAutoSignOut = useCallback((jwt: string) => {
    clearExpiryTimer();
    const ms = msUntilExpiry(jwt);
    if (ms === null) return;
    if (ms === 0) { signOut(); return; }
    expiryTimerRef.current = setTimeout(() => signOut(), ms);
  }, [signOut]);

  useEffect(() => {
    if (initial.token) scheduleAutoSignOut(initial.token);
    setLoading(false);
    return () => clearExpiryTimer();
  }, []);

  /**
   * login — stores user (which now includes `role`) and token.
   * The Auth page reads user.role to redirect:
   *   admin → /admin
   *   user  → /recommend
   */
  const login = useCallback((userData: any, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user",  JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
    scheduleAutoSignOut(jwtToken);
  }, [scheduleAutoSignOut]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
}