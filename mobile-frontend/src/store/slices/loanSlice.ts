/**
 * Loan Slice
 * Redux slice for loan calculation and application management, backed by the
 * real backend (/api/loans/calculate, /api/loans/apply,
 * /api/loans/applications).
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  LoanApplication,
  LoanApplicationRequest,
  LoanCalculationResult,
} from "../../services/loan.service";
import * as loanService from "../../services/loan.service";

export interface LoanState {
  applications: LoanApplication[];
  calculation: LoanCalculationResult | null;
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
  applySuccess: LoanApplication | null;
}

const initialState: LoanState = {
  applications: [],
  calculation: null,
  isLoading: false,
  isApplying: false,
  error: null,
  applySuccess: null,
};

/**
 * Calculate estimated loan terms.
 */
export const calculateLoanTerms = createAsyncThunk(
  "loan/calculate",
  async (
    params: { amount: number; rate: number; termMonths: number },
    { rejectWithValue },
  ) => {
    try {
      return await loanService.calculateLoan(
        params.amount,
        params.rate,
        params.termMonths,
      );
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Submit a loan application.
 */
export const submitLoanApplication = createAsyncThunk(
  "loan/apply",
  async (request: LoanApplicationRequest, { rejectWithValue }) => {
    try {
      return await loanService.applyForLoan(request);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Fetch the current user's submitted loan applications.
 */
export const fetchMyLoanApplications = createAsyncThunk(
  "loan/fetchApplications",
  async (
    params: { page?: number; perPage?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const result = await loanService.getMyLoanApplications(
        params?.page,
        params?.perPage,
      );
      return result.applications;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    clearLoanError: (state) => {
      state.error = null;
    },
    clearApplySuccess: (state) => {
      state.applySuccess = null;
    },
    resetLoans: (state) => {
      state.applications = [];
      state.calculation = null;
      state.error = null;
      state.applySuccess = null;
    },
  },
  extraReducers: (builder) => {
    // Calculate loan terms
    builder.addCase(calculateLoanTerms.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(calculateLoanTerms.fulfilled, (state, action) => {
      state.isLoading = false;
      state.calculation = action.payload;
      state.error = null;
    });
    builder.addCase(calculateLoanTerms.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Submit loan application
    builder.addCase(submitLoanApplication.pending, (state) => {
      state.isApplying = true;
      state.error = null;
      state.applySuccess = null;
    });
    builder.addCase(submitLoanApplication.fulfilled, (state, action) => {
      state.isApplying = false;
      state.applySuccess = action.payload;
      state.applications = [action.payload, ...state.applications];
      state.error = null;
    });
    builder.addCase(submitLoanApplication.rejected, (state, action) => {
      state.isApplying = false;
      state.error = action.payload as string;
    });

    // Fetch my loan applications
    builder.addCase(fetchMyLoanApplications.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMyLoanApplications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.applications = action.payload;
      state.error = null;
    });
    builder.addCase(fetchMyLoanApplications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearLoanError, clearApplySuccess, resetLoans } =
  loanSlice.actions;
export default loanSlice.reducer;
