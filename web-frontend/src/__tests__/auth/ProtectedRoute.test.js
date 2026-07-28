import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

const mockUseAuth = jest.fn();
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const renderProtected = (route = "/dashboard") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/signin" element={<div>Sign in page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Secret dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute", () => {
  it("shows a spinner while the session is being restored", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    renderProtected();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("redirects to sign in when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderProtected();
    expect(screen.getByText("Sign in page")).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("renders the protected content when authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    renderProtected();
    expect(screen.getByText("Secret dashboard")).toBeInTheDocument();
  });
});
