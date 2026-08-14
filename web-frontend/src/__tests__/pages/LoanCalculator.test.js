import { fireEvent, render, screen } from "@testing-library/react";
import LoanCalculator from "../../pages/LoanCalculator";
import {
  applyForLoan,
  calculateLoan,
  recordLoanApplicationBlockchainTx,
} from "../../utils/api";
import { submitLoanApplicationOnChain } from "../../utils/onChainLoanApplication";

vi.mock("../../utils/api", () => ({
  applyForLoan: vi.fn(),
  calculateLoan: vi.fn(),
  recordLoanApplicationBlockchainTx: vi.fn(),
}));

vi.mock("../../utils/onChainLoanApplication", () => ({
  submitLoanApplicationOnChain: vi.fn(),
}));

let mockWeb3Context = { web3: null, accounts: [], error: null };
vi.mock("../../contexts/Web3Context", () => ({
  useWeb3: () => mockWeb3Context,
}));

vi.mock("../../contracts/LoanContractV2", () => ({
  getLoanContractV2Address: () => "0x1234567890123456789012345678901234567890",
}));

// Chart.js requires a real canvas context, which jsdom does not implement.
// The charts are purely presentational here, so a lightweight stand-in keeps
// these tests focused on the data flow (API calls, field names, UI state).
vi.mock("react-chartjs-2", () => ({
  Doughnut: () => <div data-testid="doughnut-chart" />,
  Line: () => <div data-testid="line-chart" />,
}));

describe("LoanCalculator page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWeb3Context = { web3: null, accounts: [], error: null };
  });

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

  describe("on-chain submission", () => {
    const setUpSubmittedApplication = async () => {
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
      applyForLoan.mockResolvedValueOnce({
        id: "application-123",
        application_number: "APP-001",
      });

      render(<LoanCalculator />);
      fireEvent.click(screen.getByRole("button", { name: /^calculate$/i }));
      await screen.findByText(/75\.5%/);
      fireEvent.click(screen.getByRole("button", { name: /apply for loan/i }));
      await screen.findByText(/APP-001/);
    };

    it("asks the user to connect a wallet if none is connected", async () => {
      mockWeb3Context = { web3: null, accounts: [], error: null };
      await setUpSubmittedApplication();

      fireEvent.change(screen.getByLabelText(/annual income/i), {
        target: { value: "60000" },
      });
      fireEvent.change(screen.getByLabelText(/debt-to-income ratio/i), {
        target: { value: "20" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit on-chain/i }));

      await screen.findByText(/connect a wallet/i);
      expect(submitLoanApplicationOnChain).not.toHaveBeenCalled();
    });

    it("submits on-chain and records the transaction hash against the application", async () => {
      mockWeb3Context = {
        web3: {},
        accounts: ["0xBorrower000000000000000000000000000001"],
        error: null,
      };
      submitLoanApplicationOnChain.mockResolvedValueOnce({
        transactionHash: "0x" + "ab".repeat(32),
        applicationId: "1",
      });
      recordLoanApplicationBlockchainTx.mockResolvedValueOnce({});

      await setUpSubmittedApplication();

      fireEvent.change(screen.getByLabelText(/annual income/i), {
        target: { value: "60000" },
      });
      fireEvent.change(screen.getByLabelText(/debt-to-income ratio/i), {
        target: { value: "20" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit on-chain/i }));

      await screen.findByText(/submitted on-chain/i);

      expect(submitLoanApplicationOnChain).toHaveBeenCalledWith(
        mockWeb3Context.web3,
        "0xBorrower000000000000000000000000000001",
        expect.objectContaining({
          amount: 5000,
          termDays: 36 * 30,
          annualIncome: "60000",
          debtToIncomeRatio: 2000,
          employmentStatus: "employed",
        }),
      );
      expect(recordLoanApplicationBlockchainTx).toHaveBeenCalledWith(
        "application-123",
        "0x" + "ab".repeat(32),
        "0xBorrower000000000000000000000000000001",
      );
    });

    it("shows an error if the on-chain submission fails", async () => {
      mockWeb3Context = {
        web3: {},
        accounts: ["0xBorrower000000000000000000000000000001"],
        error: null,
      };
      submitLoanApplicationOnChain.mockRejectedValueOnce(
        new Error("User rejected the signature request."),
      );

      await setUpSubmittedApplication();

      fireEvent.change(screen.getByLabelText(/annual income/i), {
        target: { value: "60000" },
      });
      fireEvent.change(screen.getByLabelText(/debt-to-income ratio/i), {
        target: { value: "20" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit on-chain/i }));

      await screen.findByText(/user rejected the signature request/i);
      expect(recordLoanApplicationBlockchainTx).not.toHaveBeenCalled();
    });
  });
});
