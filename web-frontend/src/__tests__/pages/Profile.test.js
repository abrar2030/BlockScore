import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Profile from "../../pages/Profile";
import {
  fetchCurrentUser,
  getLoanApplications,
  updateProfile,
} from "../../utils/api";

vi.mock("../../utils/api", () => ({
  fetchCurrentUser: vi.fn(),
  getLoanApplications: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "ada@blockscore.io" },
    logout: vi.fn(),
  }),
}));

vi.mock("../../contexts/CreditContext", () => ({
  useCredit: () => ({
    creditData: { score: 720, score_grade: "Good" },
    needsWallet: false,
  }),
}));

const baseProfile = {
  id: "u1",
  email: "ada@blockscore.io",
  created_at: "2025-01-01T00:00:00Z",
  profile: {
    first_name: "Ada",
    last_name: "Lovelace",
    full_name: "Ada Lovelace",
    phone_number: "+15551234567",
    address: {
      street_address: "1 Analytical Engine Way",
      city: "London",
      state: "",
      postal_code: "",
      country: "UK",
    },
    kyc_status: "not_started",
    annual_income: 90000,
    employment_status: "Employed",
    employer_name: "Analytical Engines Ltd",
    wallet_address: "",
  },
};

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCurrentUser.mockResolvedValue(baseProfile);
    getLoanApplications.mockResolvedValue({ applications: [] });
  });

  it("loads and displays the real profile from the backend", async () => {
    render(<Profile />);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lovelace")).toBeInTheDocument();
  });

  it("saves edited fields via updateProfile with the correct payload", async () => {
    updateProfile.mockResolvedValueOnce({
      ...baseProfile,
      profile: { ...baseProfile.profile, city: "Budapest" },
    });

    render(<Profile />);
    await screen.findByText("Ada Lovelace");

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const cityField = screen.getByDisplayValue("London");
    fireEvent.change(cityField, { target: { value: "Budapest" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    const payload = updateProfile.mock.calls[0][0];
    expect(payload.city).toBe("Budapest");
    expect(payload.first_name).toBe("Ada");
  });

  it("renders submitted loan applications", async () => {
    getLoanApplications.mockResolvedValueOnce({
      applications: [
        {
          id: "app-1",
          loan_type: "personal",
          status: "submitted",
          requested_amount: "5000.00",
          requested_term_months: 24,
        },
      ],
    });

    render(<Profile />);
    expect(await screen.findByText(/personal loan/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5,000 over 24 months/i)).toBeInTheDocument();
  });
});
