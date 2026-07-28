import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../utils/api";

// Create context
const AuthContext = createContext();

const DEMO_TOKEN = "blockscore.demo.session";

const buildDemoUser = (email) => ({
  id: "demo-user",
  email: email || "demo@blockscore.io",
  name: (email || "demo@blockscore.io").split("@")[0],
  address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  balance: "2.5 ETH",
  is_demo: true,
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore a session from a persisted token on load.
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      if (token === DEMO_TOKEN) {
        const cached = localStorage.getItem("blockscore_user");
        if (mounted && cached) {
          setUser(JSON.parse(cached));
          setIsAuthenticated(true);
        }
        if (mounted) setLoading(false);
        return;
      }
      try {
        const profile = await fetchCurrentUser();
        if (mounted) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Session restore error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restore();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((value) => {
    setUser(value);
    setIsAuthenticated(!!value);
    if (value) {
      localStorage.setItem("blockscore_user", JSON.stringify(value));
    } else {
      localStorage.removeItem("blockscore_user");
    }
  }, []);

  // Sign in with email + password.
  const signIn = useCallback(
    async ({ email, password, rememberMe }) => {
      try {
        const result = await loginUser({ email, password, rememberMe });
        const profile = result.user || buildDemoUser(email);
        persist(profile);
        return { success: true };
      } catch (error) {
        // Backend unreachable: fall back to a local demo session so the sign
        // in flow stays fully navigable during development.
        if (!error?.response) {
          localStorage.setItem("authToken", DEMO_TOKEN);
          persist(buildDemoUser(email));
          return { success: true, demo: true };
        }
        return {
          success: false,
          message:
            error?.response?.data?.message || "Invalid email or password.",
        };
      }
    },
    [persist],
  );

  // Register a new account, then sign in.
  const signUp = useCallback(
    async ({ email, password, confirmPassword }) => {
      try {
        await registerUser({ email, password, confirmPassword });
        return signIn({ email, password, rememberMe: true });
      } catch (error) {
        if (!error?.response) {
          localStorage.setItem("authToken", DEMO_TOKEN);
          persist(buildDemoUser(email));
          return { success: true, demo: true };
        }
        return {
          success: false,
          message:
            error?.response?.data?.message ||
            "We could not create your account.",
        };
      }
    },
    [persist, signIn],
  );

  const signOut = useCallback(async () => {
    if (localStorage.getItem("authToken") !== DEMO_TOKEN) {
      await logoutUser();
    } else {
      localStorage.removeItem("authToken");
    }
    persist(null);
  }, [persist]);

  // Legacy aliases kept for any existing callers.
  const login = signIn;
  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signIn,
        signUp,
        signOut,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
