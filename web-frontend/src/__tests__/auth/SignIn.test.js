import { ThemeProvider } from "@mui/material";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignIn from "../../pages/auth/SignIn";
import theme from "../../theme";

const mockSignIn = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

const renderSignIn = () =>
  render(
    <MemoryRouter initialEntries={["/signin"]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
          <Route path="/signup" element={<div>Sign up page</div>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  );

describe("SignIn page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a validation error when fields are empty", () => {
    renderSignIn();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      screen.getByText(/please enter your email and password/i),
    ).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("navigates to the dashboard on successful sign in", async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText("Dashboard page");
  });

  it("shows the backend error message on failed sign in", async () => {
    mockSignIn.mockResolvedValueOnce({
      success: false,
      message: "Invalid email or password.",
    });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText(/invalid email or password/i);
  });

  it("links to the sign up page", () => {
    renderSignIn();
    fireEvent.click(screen.getByRole("link", { name: /create an account/i }));
    expect(screen.getByText("Sign up page")).toBeInTheDocument();
  });
});
