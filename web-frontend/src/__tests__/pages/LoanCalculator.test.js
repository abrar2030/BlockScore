import { fireEvent, render, screen } from "@testing-library/react";
import LoanCalculator from "../../pages/LoanCalculator";

jest.mock("../../utils/api", () => ({
  applyForLoan: jest.fn(),
  calculateLoan: jest.fn(),
}));

// Chart.js requires a real canvas context, which jsdom does not implement.
// The charts are purely presentational here, so a lightweight stand-in keeps
// these tests focused on the data flow (API calls, field names, UI state).
jest.mock("react-chartjs-2", () => ({
  Doughnut: () => <div data-testid="doughnut-chart" />,
  Line: () => <div data-testid="line-chart" />,
}));

const { applyForLoan, calculateLoan } = require("../../utils/api");

describe("LoanCalculator page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls calculateLoan with the correct field names (amount, rate, term_months)", async () => {
    calculateLoan.mockResolvedValueOnce({
      loan_amount: 5000,
      interest_rate: 5,
      term_months: 36,
      monthly_payment: 149.85,
      total_payment: 5394.6,
      total_interest: 394.6,
      approval_probability: 75.5,
      credit_score: 720,
    });

    render(<LoanCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /^calculate$/i }));

    await screen.findByText(/75\.5%/);
    expect(calculateLoan).toHaveBeenCalledWith(5000, 5, 36);
    expect(screen.getByText(/based on credit score: 720/i)).toBeInTheDocument();
  });

  it("submits a loan application with the backend's expected field names", async () => {
    calculateLoan.mockResolvedValueOnce({
      loan_amount: 5000,
      interest_rate: 5,
      term_months: 36,
      monthly_payment: 149.85,
      total_payment: 5394.6,
      total_interest: 394.6,
      approval_probability: 75.5,
      credit_score: 720,
    });
    applyForLoan.mockResolvedValueOnce({ application_number: "APP-001" });

    render(<LoanCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /^calculate$/i }));
    await screen.findByText(/75\.5%/);

    fireEvent.click(screen.getByRole("button", { name: /apply for loan/i }));

    await screen.findByText(/APP-001/);
    expect(applyForLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        loanType: "personal",
        amount: 5000,
        termMonths: 36,
        rate: 5,
      }),
    );
  });

  it("shows a real error message when calculation fails", async () => {
    calculateLoan.mockRejectedValueOnce({
      response: { data: { message: "Loan calculation failed upstream." } },
    });

    render(<LoanCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /^calculate$/i }));

    await screen.findByText(/loan calculation failed upstream/i);
  });
});
