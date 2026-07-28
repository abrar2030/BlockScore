import { configureStore } from "@reduxjs/toolkit";
import loanReducer, {
  calculateLoanTerms,
  fetchMyLoanApplications,
  submitLoanApplication,
} from "../slices/loanSlice";

jest.mock("../../services/loan.service", () => ({
  calculateLoan: jest.fn(),
  applyForLoan: jest.fn(),
  getMyLoanApplications: jest.fn(),
}));

const loanService = require("../../services/loan.service");

const buildStore = () => configureStore({ reducer: { loan: loanReducer } });

describe("loanSlice", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores the calculation result", async () => {
    loanService.calculateLoan.mockResolvedValueOnce({
      loan_amount: 5000,
      monthly_payment: 150,
      approval_probability: 80,
      credit_score: 720,
    });

    const store = buildStore();
    await store.dispatch(
      calculateLoanTerms({ amount: 5000, rate: 5, termMonths: 36 }) as any,
    );

    expect(store.getState().loan.calculation?.approval_probability).toBe(80);
  });

  it("records a successful application and prepends it to the list", async () => {
    loanService.applyForLoan.mockResolvedValueOnce({
      id: "app-1",
      application_number: "APP-001",
      status: "submitted",
    });

    const store = buildStore();
    await store.dispatch(
      submitLoanApplication({
        loanType: "personal",
        amount: 5000,
        termMonths: 24,
      }) as any,
    );

    const state = store.getState().loan;
    expect(state.applySuccess?.application_number).toBe("APP-001");
    expect(state.applications[0].id).toBe("app-1");
    expect(state.error).toBeNull();
  });

  it("surfaces an error message when application submission fails", async () => {
    loanService.applyForLoan.mockRejectedValueOnce(
      new Error("Rate limit exceeded"),
    );

    const store = buildStore();
    await store.dispatch(
      submitLoanApplication({
        loanType: "personal",
        amount: 5000,
        termMonths: 24,
      }) as any,
    );

    const state = store.getState().loan;
    expect(state.error).toBe("Rate limit exceeded");
    expect(state.applySuccess).toBeNull();
  });

  it("loads the user's existing loan applications", async () => {
    loanService.getMyLoanApplications.mockResolvedValueOnce({
      applications: [{ id: "app-1" }, { id: "app-2" }],
      pagination: { page: 1 },
    });

    const store = buildStore();
    await store.dispatch(
      fetchMyLoanApplications({ page: 1, perPage: 5 }) as any,
    );

    expect(store.getState().loan.applications).toHaveLength(2);
  });
});
