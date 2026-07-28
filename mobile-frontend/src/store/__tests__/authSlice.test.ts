import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  checkStoredAuth,
  loginUser,
  logoutUser,
  registerUser,
} from "../slices/authSlice";

jest.mock("../../services/auth.service", () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
}));

jest.mock("../../services/storage.service", () => ({
  getUser: jest.fn(),
  getToken: jest.fn(),
  saveUser: jest.fn(),
}));

const authService = require("../../services/auth.service");
const storageService = require("../../services/storage.service");

const buildStore = () => configureStore({ reducer: { auth: authReducer } });

describe("authSlice", () => {
  beforeEach(() => jest.clearAllMocks());

  it("authenticates on successful login", async () => {
    authService.login.mockResolvedValueOnce({
      success: true,
      user: { id: "1", email: "a@b.com" },
      access_token: "tok",
    });

    const store = buildStore();
    await store.dispatch(
      loginUser({ email: "a@b.com", password: "secret123" }) as any,
    );

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("a@b.com");
    expect(state.token).toBe("tok");
  });

  it("stores a rejection message on failed login", async () => {
    authService.login.mockRejectedValueOnce(
      new Error("Invalid email or password."),
    );

    const store = buildStore();
    await store.dispatch(
      loginUser({ email: "a@b.com", password: "wrong" }) as any,
    );

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Invalid email or password.");
  });

  it("registers then signs the user in (register alone issues no token)", async () => {
    authService.register.mockResolvedValueOnce({ success: true });
    authService.login.mockResolvedValueOnce({
      success: true,
      user: { id: "2", email: "new@b.com" },
      access_token: "tok2",
    });

    const store = buildStore();
    await store.dispatch(
      registerUser({
        email: "new@b.com",
        password: "Str0ngpass",
        confirmPassword: "Str0ngpass",
      }) as any,
    );

    expect(authService.register).toHaveBeenCalled();
    expect(authService.login).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "Str0ngpass",
    });
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it("restores a session from a fresh profile fetch when a token is stored", async () => {
    storageService.getToken.mockResolvedValueOnce("tok");
    storageService.getUser.mockResolvedValueOnce({
      id: "1",
      email: "cached@b.com",
    });
    authService.getProfile.mockResolvedValueOnce({
      id: "1",
      email: "fresh@b.com",
    });

    const store = buildStore();
    await store.dispatch(checkStoredAuth() as any);

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("fresh@b.com");
    expect(state.isInitializing).toBe(false);
  });

  it("falls back to the cached user when the profile refresh fails offline", async () => {
    storageService.getToken.mockResolvedValueOnce("tok");
    storageService.getUser.mockResolvedValueOnce({
      id: "1",
      email: "cached@b.com",
    });
    authService.getProfile.mockRejectedValueOnce(new Error("Network Error"));

    const store = buildStore();
    await store.dispatch(checkStoredAuth() as any);

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe("cached@b.com");
  });

  it("does not authenticate when there is no stored token", async () => {
    storageService.getToken.mockResolvedValueOnce(null);
    storageService.getUser.mockResolvedValueOnce(null);

    const store = buildStore();
    await store.dispatch(checkStoredAuth() as any);

    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("clears the session on logout", async () => {
    authService.login.mockResolvedValueOnce({
      success: true,
      user: { id: "1", email: "a@b.com" },
      access_token: "tok",
    });
    authService.logout.mockResolvedValueOnce(undefined);

    const store = buildStore();
    await store.dispatch(
      loginUser({ email: "a@b.com", password: "secret123" }) as any,
    );
    await store.dispatch(logoutUser() as any);

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
