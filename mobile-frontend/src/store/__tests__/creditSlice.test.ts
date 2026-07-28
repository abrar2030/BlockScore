import { configureStore } from "@reduxjs/toolkit";
import creditReducer, {
  calculateScore,
  fetchCreditHistory,
  fetchCreditScore,
} from "../slices/creditSlice";

jest.mock("../../services/credit.service", () => ({
  getCreditScore: jest.fn(),
  calculateCreditScore: jest.fn(),
  getCreditHistory: jest.fn(),
  getScoreFactors: jest.fn(() => []),
}));

const creditService = require("../../services/credit.service");

const buildStore = () => configureStore({ reducer: { credit: creditReducer } });

describe("creditSlice", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sets needsWallet (not a hard error) when the backend requires a wallet address", async () => {
    creditService.getCreditScore.mockRejectedValueOnce(
      new Error("Wallet address is required for credit score calculation."),
    );

    const store = buildStore();
    await store.dispatch(fetchCreditScore(undefined) as any);

    const state = store.getState().credit;
    expect(state.needsWallet).toBe(true);
    expect(state.error).toBeNull();
  });

  it("sets a real error for genuine failures", async () => {
    creditService.getCreditScore.mockRejectedValueOnce(
      new Error("Internal server error"),
    );

    const store = buildStore();
    await store.dispatch(fetchCreditScore(undefined) as any);

    const state = store.getState().credit;
    expect(state.needsWallet).toBe(false);
    expect(state.error).toBe("Internal server error");
  });

  it("stores the score and derived factors on success", async () => {
    creditService.getCreditScore.mockResolvedValueOnce({
      score: 720,
      score_grade: "Good",
    });
    creditService.getScoreFactors.mockReturnValueOnce([
      { name: "Payment History", value: 80 },
    ]);

    const store = buildStore();
    await store.dispatch(fetchCreditScore(undefined) as any);

    const state = store.getState().credit;
    expect(state.score?.score).toBe(720);
    expect(state.scoreFactors).toEqual([
      { name: "Payment History", value: 80 },
    ]);
  });

  it("updates the score after a forced recalculation", async () => {
    creditService.calculateCreditScore.mockResolvedValueOnce({
      score: 740,
      score_grade: "Very Good",
    });

    const store = buildStore();
    await store.dispatch(calculateScore(undefined) as any);

    expect(store.getState().credit.score?.score).toBe(740);
  });

  it("stores credit history results", async () => {
    creditService.getCreditHistory.mockResolvedValueOnce({
      history: [{ id: "1" }],
      pagination: { page: 1, pages: 1 },
    });

    const store = buildStore();
    await store.dispatch(fetchCreditHistory({ page: 1, perPage: 20 }) as any);

    expect(store.getState().credit.history?.history).toHaveLength(1);
  });
});
