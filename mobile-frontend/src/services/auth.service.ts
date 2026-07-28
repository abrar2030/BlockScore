/**
 * Authentication Service
 * Handles user authentication, registration, and profile management against
 * the real Flask backend (code/backend/app.py, /api/auth/* and /api/profile).
 */

import { API_CONFIG } from "../config/api.config";
import httpClient from "./http.client";
import {
  clearAll,
  saveToken,
  saveUser,
  saveWalletAddress,
} from "./storage.service";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface BackendUser {
  id: string;
  email: string;
  status: string;
  is_active: boolean;
  email_verified: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string;
    phone_number: string | null;
    address: {
      street_address: string | null;
      address_line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
      country: string | null;
    };
    kyc_status: string;
    annual_income: number | null;
    employment_status: string | null;
    employer_name: string | null;
    wallet_address: string | null;
    wallet_verified: boolean;
  };
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user: BackendUser;
  access_token: string;
  refresh_token?: string;
  tokens?: { access_token: string; refresh_token: string };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user: BackendUser;
  user_id: string;
}

export interface ProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  annual_income?: number | null;
  employment_status?: string;
  employer_name?: string;
  wallet_address?: string | null;
}

/**
 * Sign in with email and password.
 */
export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  try {
    const response = await httpClient.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      {
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe ?? false,
      },
    );

    const data = response.data;
    const accessToken = data.access_token || data.tokens?.access_token;

    if (data.success && accessToken) {
      await saveToken(accessToken);
      await saveUser(data.user);
      const walletAddress = data.user?.profile?.wallet_address;
      if (walletAddress) {
        await saveWalletAddress(walletAddress);
      }
    }

    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to login. Please try again.",
    );
  }
};

/**
 * Register a new account. Registration does not return a session; callers
 * should follow up with login() to sign the new user in, matching the
 * backend's behavior.
 */
export const register = async (
  userData: RegisterRequest,
): Promise<RegisterResponse> => {
  try {
    const response = await httpClient.post<RegisterResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      {
        email: userData.email,
        password: userData.password,
        confirm_password: userData.confirmPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        terms_accepted: true,
        privacy_accepted: true,
      },
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to register. Please try again.",
    );
  }
};

/**
 * Fetch the current user's full profile. Also used to restore a session from
 * a persisted token, since there is no dedicated "current user" endpoint.
 */
export const getProfile = async (): Promise<BackendUser> => {
  const response = await httpClient.get<{
    success: boolean;
    data: BackendUser;
  }>(API_CONFIG.ENDPOINTS.PROFILE.GET);
  return response.data.data;
};

/**
 * Update the current user's profile, including their wallet address.
 */
export const updateProfile = async (
  payload: ProfileUpdatePayload,
): Promise<BackendUser> => {
  try {
    const response = await httpClient.put<{
      success: boolean;
      data: BackendUser;
    }>(API_CONFIG.ENDPOINTS.PROFILE.UPDATE, payload);

    const updated = response.data.data;
    await saveUser(updated);
    if (payload.wallet_address) {
      await saveWalletAddress(payload.wallet_address);
    }
    return updated;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to update profile. Please try again.",
    );
  }
};

/**
 * Sign out: best-effort notify the backend, then always clear local session
 * data regardless of whether the network call succeeds.
 */
export const logout = async (): Promise<void> => {
  try {
    await httpClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    // Non-fatal: proceed to clear the local session either way.
    console.error("Error notifying backend of logout:", error);
  } finally {
    await clearAll();
  }
};
