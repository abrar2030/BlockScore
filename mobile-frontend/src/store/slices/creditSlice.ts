/**
 * Credit Slice
 * Redux slice for credit score and history management, backed by the real
 * backend (/api/credit/calculate-score, /api/credit/history).
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  CreditHistoryResult,
  CreditScoreResult,
} from "../../services/credit.service";
import * as creditService from "../../services/credit.service";

interface ScoreFactor {
  name: string;
  value: number;
  description?: string;
}

export interface CreditState {
  score: CreditScoreResult | null;
  history: CreditHistoryResult | null;
  scoreFactors: ScoreFactor[];
  isLoading: boolean;
  error: string | null;
  needsWallet: boolean;
}

const initialState: CreditState = {
  score: null,
  history: null,
  scoreFactors: [],
  isLoading: false,
  error: null,
  needsWallet: false,
};

const isWalletRequiredError = (message: string) =>
  /wallet address/i.test(message || "");

/**
 * Fetch the current credit score (cached if still valid).
 */
export const fetchCreditScore = createAsyncThunk(
  "credit/fetchScore",
  async (walletAddress: string | undefined, { rejectWithValue }) => {
    try {
      const score = await creditService.getCreditScore(walletAddress);
      return { score, factors: creditService.getScoreFactors(score) };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Force a fresh credit score calculation.
 */
export const calculateScore = createAsyncThunk(
  "credit/calculate",
  async (walletAddress: string | undefined, { rejectWithValue }) => {
    try {
      const score = await creditService.calculateCreditScore(walletAddress);
      return { score, factors: creditService.getScoreFactors(score) };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Fetch the current user's credit history.
 */
export const fetchCreditHistory = createAsyncThunk(
  "credit/fetchHistory",
  async (
    params: { page?: number; perPage?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const history = await creditService.getCreditHistory(
        params?.page,
        params?.perPage,
      );
      return history;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const creditSlice = createSlice({
  name: "credit",
  initialState,
  reducers: {
    clearCreditError: (state) => {
      state.error = null;
    },
    resetCredit: (state) => {
      state.score = null;
      state.history = null;
      state.scoreFactors = [];
      state.error = null;
      state.needsWallet = false;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: CreditState) => {
      state.isLoading = true;
      state.error = null;
      state.needsWallet = false;
    };
    const handleRejected = (state: CreditState, action: any) => {
      state.isLoading = false;
      const message = action.payload as string;
      if (isWalletRequiredError(message)) {
        state.needsWallet = true;
      } else {
        state.error = message;
      }
    };

    // Fetch credit score
    builder.addCase(fetchCreditScore.pending, handlePending);
    builder.addCase(fetchCreditScore.fulfilled, (state, action) => {
      state.isLoading = false;
      state.score = action.payload.score;
      state.scoreFactors = action.payload.factors;
      state.error = null;
    });
    builder.addCase(fetchCreditScore.rejected, handleRejected);

    // Calculate score
    builder.addCase(calculateScore.pending, handlePending);
    builder.addCase(calculateScore.fulfilled, (state, action) => {
      state.isLoading = false;
      state.score = action.payload.score;
      state.scoreFactors = action.payload.factors;
      state.error = null;
    });
    builder.addCase(calculateScore.rejected, handleRejected);

    // Fetch credit history
    builder.addCase(fetchCreditHistory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCreditHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.history = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCreditHistory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCreditError, resetCredit } = creditSlice.actions;
export default creditSlice.reducer;
