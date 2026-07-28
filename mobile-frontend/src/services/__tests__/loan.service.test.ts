/**
 * Tests for loan.service.ts against the real backend contract
 * (/api/loans/calculate, /api/loans/apply, /api/loans/applications).
 */

jest.mock("../http.client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import * as loanService from "../loan.service";
import httpClient from "../http.client";

const mockedClient = httpClient as jest.Mocked<typeof httpClient>;

describe("loan.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calculates loan terms with amount, rate and term_months (not walletAddress/term)", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          loan_amount: 5000,
          interest_rate: 5,
          term_months: 36,
          monthly_payment: 149.85,
          total_payment: 5394.6,
          total_interest: 394.6,
          approval_probability: 75.5,
          credit_score: 720,
        },
      },
    });

    await loanService.calculateLoan(5000, 5, 36);

    expect(mockedClient.post).toHaveBeenCalledWith("/api/loans/calculate", {
      amount: 5000,
      rate: 5,
      term_months: 36,
    });
  });

  it("submits a loan application with the backend's field names", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: "app-1", application_number: "APP-001" },
      },
    });

    await loanService.applyForLoan({
      loanType: "personal",
      amount: 5000,
      termMonths: 24,
      rate: 6,
      purpose: "Debt consolidation",
    });

    expect(mockedClient.post).toHaveBeenCalledWith("/api/loans/apply", {
      loan_type: "personal",
      requested_amount: 5000,
      requested_term_months: 24,
      requested_rate: 6,
      purpose: "Debt consolidation",
    });
  });

  it("lists the current user's loan applications, paginated", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { applications: [], pagination: { page: 1 } },
      },
    });

    await loanService.getMyLoanApplications(1, 5);

    expect(mockedClient.get).toHaveBeenCalledWith("/api/loans/applications", {
      params: { page: 1, per_page: 5 },
    });
  });
});
