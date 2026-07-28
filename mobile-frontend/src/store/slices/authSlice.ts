/**
 * Auth Slice
 * Redux slice for authentication state management, backed by the real
 * Flask backend's email/password auth and profile endpoints.
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as authService from "../../services/auth.service";
import type { BackendUser } from "../../services/auth.service";
import { getToken, getUser, saveUser } from "../../services/storage.service";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  user: BackendUser | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  user: null,
  token: null,
};

/**
 * Sign in with email and password.
 */
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string; rememberMe?: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await authService.login(credentials);
      const token = response.access_token || response.tokens?.access_token;
      return { user: response.user, token };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Register a new account, then sign in to establish a session (matches the
 * backend's behavior: registration alone does not issue tokens).
 */
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      email: string;
      password: string;
      confirmPassword: string;
      firstName?: string;
      lastName?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      await authService.register(userData);
      const loginResponse = await authService.login({
        email: userData.email,
        password: userData.password,
      });
      const token =
        loginResponse.access_token || loginResponse.tokens?.access_token;
      return { user: loginResponse.user, token };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Sign out.
 */
export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
});

/**
 * Restore a session from a persisted token on app start.
 */
export const checkStoredAuth = createAsyncThunk(
  "auth/checkStored",
  async () => {
    const [cachedUser, token] = await Promise.all([getUser(), getToken()]);

    if (!token) {
      return null;
    }

    try {
      const freshUser = await authService.getProfile();
      await saveUser(freshUser);
      return { user: freshUser, token };
    } catch {
      // Offline or the token expired server-side: fall back to the cached
      // user so the app remains usable, and let the next API call surface
      // any real auth failure.
      if (cachedUser) {
        return { user: cachedUser, token };
      }
      return null;
    }
  },
);

/**
 * Update the current user's profile (including wallet address).
 */
export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    payload: Parameters<typeof authService.updateProfile>[0],
    { rejectWithValue },
  ) => {
    try {
      const updated = await authService.updateProfile(payload);
      return updated;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    });

    // Check stored auth
    builder.addCase(checkStoredAuth.pending, (state) => {
      state.isInitializing = true;
    });
    builder.addCase(checkStoredAuth.fulfilled, (state, action) => {
      state.isInitializing = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      }
    });
    builder.addCase(checkStoredAuth.rejected, (state) => {
      state.isInitializing = false;
    });

    // Update profile
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });
    builder.addCase(updateUserProfile.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
