/**
 * Tests for credit.service.ts against the real backend contract
 * (/api/credit/calculate-score, /api/credit/history).
 */

jest.mock("../http.client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import * as creditService from "../credit.service";
import httpClient from "../http.client";

const mockedClient = httpClient as jest.Mocked<typeof httpClient>;

describe("credit.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("gets the credit score with force_recalculation=false (cache-or-get semantics)", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { success: true, data: { score: 720, score_grade: "Good" } },
    });

    const result = await creditService.getCreditScore("0xabc");

    expect(mockedClient.post).toHaveBeenCalledWith(
      "/api/credit/calculate-score",
      { walletAddress: "0xabc", force_recalculation: false },
    );
    expect(result.score).toBe(720);
  });

  it("forces a fresh calculation with force_recalculation=true", async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: { success: true, data: { score: 730, score_grade: "Good" } },
    });

    await creditService.calculateCreditScore("0xabc");

    expect(mockedClient.post).toHaveBeenCalledWith(
      "/api/credit/calculate-score",
      { walletAddress: "0xabc", force_recalculation: true },
    );
  });

  it("fetches paginated credit history from /api/credit/history", async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: { success: true, data: { history: [], pagination: { page: 2 } } },
    });

    await creditService.getCreditHistory(2, 10);

    expect(mockedClient.get).toHaveBeenCalledWith("/api/credit/history", {
      params: { page: 2, per_page: 10 },
    });
  });

  describe("getScoreFactors", () => {
    it("returns an empty array when there is no result", () => {
      expect(creditService.getScoreFactors(null)).toEqual([]);
    });

    it("prefers the detailed factors array when present", () => {
      const factors = creditService.getScoreFactors({
        score: 700,
        score_grade: "Good",
        factors: [
          {
            factor_type: "payment_history",
            factor_name: "Payment History",
            factor_description: "On-time payments",
            normalized_value: 0.8,
            contribution: 82,
          },
        ],
      } as any);

      expect(factors).toEqual([
        {
          name: "Payment History",
          value: 82,
          description: "On-time payments",
        },
      ]);
    });

    it("falls back to score_breakdown when factors are absent (cached score)", () => {
      const factors = creditService.getScoreFactors({
        score: 700,
        score_grade: "Good",
        score_breakdown: {
          payment_history: 75,
          credit_utilization: 60,
        },
      } as any);

      expect(factors).toEqual([
        { name: "Payment History", value: 75 },
        { name: "Credit Utilization", value: 60 },
      ]);
    });
  });
});
