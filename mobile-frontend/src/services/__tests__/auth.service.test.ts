/**
 * Tests for auth.service.ts against the real backend's email/password
 * contract (code/backend/app.py: /api/auth/*, /api/profile).
 */

jest.mock("../http.client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("../storage.service", () => ({
  saveToken: jest.fn(),
  saveUser: jest.fn(),
  saveWalletAddress: jest.fn(),
  clearAll: jest.fn(),
}));

import * as authService from "../auth.service";
import httpClient from "../http.client";
import {
  clearAll,
  saveToken,
  saveUser,
  saveWalletAddress,
} from "../storage.service";

const mockedClient = httpClient as jest.Mocked<typeof httpClient>;

describe("auth.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("logs in with email and password against /api/auth/login", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: {
          id: "1",
          email: "a@b.com",
          profile: { wallet_address: "0xabc" },
        },
        access_token: "tok",
        refresh_token: "ref",
      },
    });

    const result = await authService.login({
      email: "a@b.com",
      password: "secret123",
    });

    expect(mockedClient.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "a@b.com",
      password: "secret123",
      remember_me: false,
    });
    expect(saveToken).toHaveBeenCalledWith("tok");
    expect(saveUser).toHaveBeenCalledWith(result.user);
    expect(saveWalletAddress).toHaveBeenCalledWith("0xabc");
  });

  it("registers with email, password and confirm_password against /api/auth/register", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { success: true, user: { id: "1" }, user_id: "1" },
    });

    await authService.register({
      email: "new@b.com",
      password: "Str0ngpass",
      confirmPassword: "Str0ngpass",
      firstName: "Ada",
    });

    expect(mockedClient.post).toHaveBeenCalledWith("/api/auth/register", {
      email: "new@b.com",
      password: "Str0ngpass",
      confirm_password: "Str0ngpass",
      first_name: "Ada",
      last_name: undefined,
      terms_accepted: true,
      privacy_accepted: true,
    });
    // Registration does not establish a session by itself.
    expect(saveToken).not.toHaveBeenCalled();
  });

  it("fetches the profile from GET /api/profile for session restore", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: { success: true, data: { id: "1", email: "a@b.com" } },
    });

    const profile = await authService.getProfile();

    expect(mockedClient.get).toHaveBeenCalledWith("/api/profile");
    expect(profile).toEqual({ id: "1", email: "a@b.com" });
  });

  it("updates the profile via PUT /api/profile and persists the result", async () => {
    mockedClient.put.mockResolvedValueOnce({
      data: { success: true, data: { id: "1", profile: { city: "Budapest" } } },
    });

    const updated = await authService.updateProfile({ city: "Budapest" });

    expect(mockedClient.put).toHaveBeenCalledWith("/api/profile", {
      city: "Budapest",
    });
    expect(saveUser).toHaveBeenCalledWith(updated);
  });

  it("clears the local session on logout even if the backend call fails", async () => {
    mockedClient.post.mockRejectedValueOnce(new Error("network down"));

    await authService.logout();

    expect(mockedClient.post).toHaveBeenCalledWith("/api/auth/logout");
    expect(clearAll).toHaveBeenCalled();
  });
});
