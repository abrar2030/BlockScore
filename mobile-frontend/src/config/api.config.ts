/**
 * API Configuration
 * Central configuration for all API-related settings.
 *
 * Endpoint paths mirror the real Flask backend (code/backend/app.py). There
 * is no separate wallet-auth endpoint, loan-by-id lookup, or loan approval /
 * repayment endpoint on the backend; only the endpoints listed below exist.
 */

export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || "http://localhost:5000",
  TIMEOUT: parseInt(process.env.API_TIMEOUT || "30000", 10),
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      REFRESH: "/api/auth/refresh",
    },
    // Profile endpoints
    PROFILE: {
      GET: "/api/profile",
      UPDATE: "/api/profile",
    },
    // Credit endpoints
    CREDIT: {
      CALCULATE: "/api/credit/calculate-score",
      HISTORY: "/api/credit/history",
    },
    // Loan endpoints
    LOANS: {
      CALCULATE: "/api/loans/calculate",
      APPLY: "/api/loans/apply",
      APPLICATIONS: "/api/loans/applications",
    },
    // Health check
    HEALTH: "/api/health",
  },
};

export default API_CONFIG;
