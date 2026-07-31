import { ThemeProvider } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignUp from "../../pages/auth/SignUp";
import theme from "../../theme";

const mockSignUp = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ signUp: mockSignUp }),
}));

const renderSignUp = () =>
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  );

const fillCoreFields = (password = "Str0ngpass", confirm = "Str0ngpass") => {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "new@user.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password/i), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirm },
  });
};

describe("SignUp page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a password shorter than 8 characters", () => {
    renderSignUp();
    fillCoreFields("short1", "short1");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", () => {
    renderSignUp();
    fillCoreFields("Str0ngpass", "Different1");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      screen.getAllByText(/passwords do not match/i).length,
    ).toBeGreaterThan(0);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("requires accepting the terms", () => {
    renderSignUp();
    fillCoreFields();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("submits and navigates to the dashboard on success", async () => {
    mockSignUp.mockResolvedValueOnce({ success: true });
    renderSignUp();
    fillCoreFields();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new@user.com",
        password: "Str0ngpass",
        confirmPassword: "Str0ngpass",
      }),
    );
    await screen.findByText("Dashboard page");
  });
});
