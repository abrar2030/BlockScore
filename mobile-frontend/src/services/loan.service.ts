/**
 * Loan Service
 * Calculates loan terms and manages loan applications against the real
 * backend (code/backend/app.py: /api/loans/calculate, /api/loans/apply,
 * /api/loans/applications). The backend does not expose loan-by-id,
 * borrower-address lookups, approval, or repayment endpoints; only
 * calculation, application submission, and listing your own applications
 * are supported.
 */

import { API_CONFIG } from "../config/api.config";
import httpClient from "./http.client";

export type LoanType =
  | "personal"
  | "business"
  | "mortgage"
  | "auto"
  | "student"
  | "credit_line"
  | "defi";

export interface LoanCalculationResult {
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
  approval_probability: number;
  credit_score: number;
}

export interface LoanApplicationRequest {
  loanType: LoanType;
  amount: number;
  termMonths: number;
  rate?: number;
  purpose?: string;
}

export interface LoanApplication {
  id: string;
  application_number: string;
  loan_type: string;
  status: string;
  requested_amount: string;
  requested_term_months: number;
  requested_rate?: string;
  purpose?: string;
  created_at: string;
}

export interface LoanApplicationsResult {
  applications: LoanApplication[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Calculate estimated loan terms and approval probability against the
 * caller's current credit score.
 */
export const calculateLoan = async (
  amount: number,
  rate: number,
  termMonths: number,
): Promise<LoanCalculationResult> => {
  try {
    const response = await httpClient.post<{
      success: boolean;
      data: LoanCalculationResult;
    }>(API_CONFIG.ENDPOINTS.LOANS.CALCULATE, {
      amount,
      rate,
      term_months: termMonths,
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to calculate loan terms.",
    );
  }
};

/**
 * Submit a loan application.
 */
export const applyForLoan = async (
  request: LoanApplicationRequest,
): Promise<LoanApplication> => {
  try {
    const response = await httpClient.post<{
      success: boolean;
      data: LoanApplication;
    }>(API_CONFIG.ENDPOINTS.LOANS.APPLY, {
      loan_type: request.loanType,
      requested_amount: request.amount,
      requested_term_months: request.termMonths,
      requested_rate: request.rate,
      purpose: request.purpose,
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to submit loan application.",
    );
  }
};

/**
 * List the current user's submitted loan applications.
 */
export const getMyLoanApplications = async (
  page = 1,
  perPage = 20,
): Promise<LoanApplicationsResult> => {
  try {
    const response = await httpClient.get<{
      success: boolean;
      data: LoanApplicationsResult;
    }>(API_CONFIG.ENDPOINTS.LOANS.APPLICATIONS, {
      params: { page, per_page: perPage },
    });
    return response.data.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch loan applications.",
    );
  }
};
