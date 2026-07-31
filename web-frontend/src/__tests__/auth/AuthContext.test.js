import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../../utils/api";

// The API module wraps axios; mock it directly so we control success/failure
// without depending on a real backend.
vi.mock("../../utils/api", () => ({
  fetchCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
}));

let auth;
const Probe = () => {
  auth = useAuth();
  return <div>{auth.isAuthenticated ? "authenticated" : "anonymous"}</div>;
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("starts unauthenticated with no stored token", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));
    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });

  it("signs in successfully against the real API", async () => {
    loginUser.mockResolvedValueOnce({
      user: { id: "1", email: "a@b.com" },
      access_token: "tok",
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));

    let result;
    await act(async () => {
      result = await auth.signIn({ email: "a@b.com", password: "secret123" });
    });

    expect(result.success).toBe(true);
    expect(loginUser).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret123",
      rememberMe: undefined,
    });
    await waitFor(() => expect(auth.isAuthenticated).toBe(true));
  });

  it("surfaces a backend error message on failed sign in", async () => {
    loginUser.mockRejectedValueOnce({
      response: { data: { message: "Invalid email or password." } },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));

    let result;
    await act(async () => {
      result = await auth.signIn({ email: "a@b.com", password: "wrong" });
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid email or password.");
    expect(auth.isAuthenticated).toBe(false);
  });

  it("falls back to a local demo session when the backend is unreachable", async () => {
    loginUser.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));

    let result;
    await act(async () => {
      result = await auth.signIn({
        email: "demo@blockscore.io",
        password: "x",
      });
    });

    expect(result.success).toBe(true);
    expect(result.demo).toBe(true);
    await waitFor(() => expect(auth.isAuthenticated).toBe(true));
    expect(auth.user.email).toBe("demo@blockscore.io");
  });

  it("registers then signs in on sign up", async () => {
    registerUser.mockResolvedValueOnce({ success: true });
    loginUser.mockResolvedValueOnce({
      user: { id: "2", email: "new@b.com" },
      access_token: "tok2",
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));

    let result;
    await act(async () => {
      result = await auth.signUp({
        email: "new@b.com",
        password: "Str0ngpass",
        confirmPassword: "Str0ngpass",
      });
    });

    expect(registerUser).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "Str0ngpass",
      confirmPassword: "Str0ngpass",
    });
    expect(result.success).toBe(true);
    await waitFor(() => expect(auth.isAuthenticated).toBe(true));
  });

  it("signs out and clears the session", async () => {
    loginUser.mockResolvedValueOnce({
      user: { id: "1", email: "a@b.com" },
      access_token: "tok",
    });
    logoutUser.mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(auth.loading).toBe(false));

    await act(async () => {
      await auth.signIn({ email: "a@b.com", password: "secret123" });
    });
    await waitFor(() => expect(auth.isAuthenticated).toBe(true));

    await act(async () => {
      await auth.signOut();
    });

    expect(logoutUser).toHaveBeenCalled();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
  });

  it("restores a session from a persisted token via the profile endpoint", async () => {
    window.localStorage.setItem("authToken", "existing-token");
    fetchCurrentUser.mockResolvedValueOnce({ id: "1", email: "a@b.com" });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(auth.loading).toBe(false));
    expect(fetchCurrentUser).toHaveBeenCalled();
    expect(auth.isAuthenticated).toBe(true);
  });
});
