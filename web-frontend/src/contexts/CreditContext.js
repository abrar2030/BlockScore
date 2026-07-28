import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useWeb3 } from "./Web3Context";
import {
  calculateCreditScore,
  getCreditHistory,
  getCreditScore,
} from "../utils/api";

const CreditContext = createContext();

const isWalletRequiredError = (err) =>
  err?.response?.status === 400 &&
  (err?.response?.data?.error === "Wallet Address Required" ||
    /wallet address/i.test(err?.response?.data?.message || ""));

// Provider component.
// Credit scoring is derived from the authenticated user's JWT identity on the
// backend, using their profile wallet address if one is on file. Connecting a
// wallet in-session is optional and, when present, is passed along so a score
// can be calculated against that specific address too.
export const CreditProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { accounts } = useWeb3();
  const [creditData, setCreditData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsWallet, setNeedsWallet] = useState(false);

  const connectedAddress = accounts?.[0];

  const fetchCreditScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsWallet(false);
    try {
      const data = await getCreditScore(connectedAddress);
      setCreditData(data);
      return data;
    } catch (err) {
      if (isWalletRequiredError(err)) {
        setNeedsWallet(true);
        setCreditData(null);
        return null;
      }
      const message =
        err?.response?.data?.message ||
        "We could not load your credit score right now.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectedAddress]);

  const recalculateCreditScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsWallet(false);
    try {
      const data = await calculateCreditScore(connectedAddress, true);
      setCreditData(data);
      return data;
    } catch (err) {
      if (isWalletRequiredError(err)) {
        setNeedsWallet(true);
        return null;
      }
      const message =
        err?.response?.data?.message ||
        "We could not recalculate your credit score right now.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectedAddress]);

  const fetchCreditHistory = useCallback(async (page = 1, perPage = 20) => {
    try {
      const data = await getCreditHistory(page, perPage);
      setHistory(data?.history || data?.items || []);
      return data;
    } catch (err) {
      // Non-fatal: the dashboard can still show the score without history.
      console.error("Error fetching credit history:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCreditData(null);
      setHistory([]);
      setNeedsWallet(false);
      return;
    }
    fetchCreditScore().catch(() => {});
    fetchCreditHistory().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, connectedAddress]);

  return (
    <CreditContext.Provider
      value={{
        creditData,
        history,
        loading,
        error,
        needsWallet,
        fetchCreditScore,
        recalculateCreditScore,
        fetchCreditHistory,
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};

// Custom hook to use the credit context
export const useCredit = () => useContext(CreditContext);
