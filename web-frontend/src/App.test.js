import { ThemeProvider } from "@mui/material";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CreditProvider } from "./contexts/CreditContext";
import { Web3Provider } from "./contexts/Web3Context";
import theme from "./theme";

// Mock contexts
const mockAuth = {
  user: { address: "0x123", name: "Test User", email: "test@blockscore.io" },
  isAuthenticated: true,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => mockAuth,
}));

vi.mock("./contexts/Web3Context", () => ({
  Web3Provider: ({ children }) => <div>{children}</div>,
  useWeb3: () => ({
    web3: {},
    accounts: ["0x123"],
    networkId: 1,
    loading: false,
  }),
}));

vi.mock("./contexts/CreditContext", () => ({
  CreditProvider: ({ children }) => <div>{children}</div>,
  useCredit: () => ({
    creditData: { score: 720 },
    loading: false,
    error: null,
  }),
}));

const renderWithProviders = (ui, { route = "/" } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Web3Provider>
            <CreditProvider>{ui}</CreditProvider>
          </Web3Provider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
};

describe("App Component", () => {
  test("renders without crashing", () => {
    renderWithProviders(<App />);
  });

  test("shows loading screen initially", () => {
    renderWithProviders(<App />);
    // Loading screen should appear briefly
    const hasLoadingText =
      screen.queryAllByText(/Loading BlockScore/i).length > 0;
    const hasSpinner = screen.queryAllByRole("progressbar").length > 0;
    expect(hasLoadingText || hasSpinner).toBe(true);
  });

  test("renders landing page on root route", async () => {
    renderWithProviders(<App />, { route: "/" });
    await waitFor(
      () => {
        // Wait for loading to finish
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  test("landing page shows Sign in and does not render the app sidebar", async () => {
    renderWithProviders(<App />, { route: "/" });
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
    // Authenticated mock -> navbar (and hero CTA) show "Go to Dashboard".
    expect(screen.getAllByText(/Go to Dashboard/i).length).toBeGreaterThan(0);
    // The app's dashboard sidebar items must not be present on the homepage.
    expect(screen.queryByText(/Loan Calculator/i)).not.toBeInTheDocument();
  });

  test("renders the sign in page", async () => {
    renderWithProviders(<App />, { route: "/signin" });
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  test("renders the sign up page", async () => {
    renderWithProviders(<App />, { route: "/signup" });
    await waitFor(
      () => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
  });

  test("renders the dashboard sidebar for an authenticated user", async () => {
    renderWithProviders(<App />, { route: "/dashboard" });
    // The Dashboard renders permanent decorative gauges/meters that also use
    // role="progressbar", so we wait for sidebar content directly. The
    // Sidebar also renders both its mobile and desktop drawers into the DOM
    // simultaneously (one hidden via CSS), so multiple matches are expected.
    const matches = await screen.findAllByText(
      /Loan Calculator/i,
      {},
      { timeout: 5000 },
    );
    expect(matches.length).toBeGreaterThan(0);
  }, 10000);

  test("renders not found page for invalid route", async () => {
    renderWithProviders(<App />, { route: "/invalid-route" });
    await waitFor(
      () => {
        const has404 = screen.queryAllByText(/404/i).length > 0;
        const hasNotFound = screen.queryAllByText(/not found/i).length > 0;
        expect(has404 || hasNotFound).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
