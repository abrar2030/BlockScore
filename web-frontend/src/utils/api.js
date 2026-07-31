// API service for making backend requests
import axios from "axios";

// Get API URL from environment or use default
const getApiUrl = () => {
  if (import.meta.env.REACT_APP_API_URL) {
    return import.meta.env.REACT_APP_API_URL;
  }
  // Fallback to proxy in development, absolute URL in production
  return import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: parseInt(import.meta.env.REACT_APP_API_TIMEOUT, 10) || 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.message);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  },
);

// Credit score API calls.
// There is no dedicated "get score" endpoint; calculate-score returns the
// cached score when one is still valid, so it doubles as a "get" call when
// force_recalculation is false.
export const getCreditScore = async (walletAddress) => {
  try {
    const response = await api.post("/credit/calculate-score", {
      walletAddress,
      force_recalculation: false,
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching credit score:", error);
    throw error;
  }
};

// Get credit history (paginated, scoped to the authenticated user via JWT)
export const getCreditHistory = async (page = 1, perPage = 20) => {
  try {
    const response = await api.get("/credit/history", {
      params: { page, per_page: perPage },
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching credit history:", error);
    throw error;
  }
};

// Calculate credit score using AI model
export const calculateCreditScore = async (
  walletAddress,
  forceRecalculation = true,
) => {
  try {
    const response = await api.post("/credit/calculate-score", {
      walletAddress,
      force_recalculation: forceRecalculation,
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error calculating credit score:", error);
    throw error;
  }
};

// Loan calculation API calls
export const calculateLoan = async (amount, rate, termMonths = 36) => {
  try {
    const response = await api.post("/loans/calculate", {
      amount,
      rate,
      term_months: termMonths,
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error calculating loan:", error);
    throw error;
  }
};

// Apply for loan
export const applyForLoan = async ({
  loanType,
  amount,
  termMonths,
  rate,
  purpose,
}) => {
  try {
    const response = await api.post("/loans/apply", {
      loan_type: loanType,
      requested_amount: amount,
      requested_term_months: termMonths,
      requested_rate: rate,
      purpose,
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error applying for loan:", error);
    throw error;
  }
};

// List the current user's submitted loan applications (paginated)
export const getLoanApplications = async (page = 1, perPage = 20) => {
  try {
    const response = await api.get("/loans/applications", {
      params: { page, per_page: perPage },
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching loan applications:", error);
    throw error;
  }
};

// Update the current user's profile
export const updateProfile = async (payload) => {
  try {
    const response = await api.put("/profile", payload);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Health check
export const checkApiHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("API health check failed:", error);
    throw error;
  }
};

// Authentication API calls.
// The backend (code/backend/app.py) exposes email/password auth under
// /api/auth/*, returning { success, user, access_token, refresh_token }.
export const registerUser = async ({ email, password, confirmPassword }) => {
  const response = await api.post("/auth/register", {
    email,
    password,
    confirm_password: confirmPassword,
  });
  return response.data;
};

export const loginUser = async ({ email, password, rememberMe = false }) => {
  const response = await api.post("/auth/login", {
    email,
    password,
    remember_me: rememberMe,
  });
  const tokens = response.data?.tokens || {};
  const accessToken = response.data?.access_token || tokens.access_token;
  const refreshToken = response.data?.refresh_token || tokens.refresh_token;
  if (accessToken) localStorage.setItem("authToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
  }
};

// There is no dedicated "current user" endpoint; the JWT-protected profile
// endpoint doubles as a session-restore check.
export const fetchCurrentUser = async () => {
  const response = await api.get("/profile");
  return response.data?.data || response.data;
};

export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
};

export default api;
