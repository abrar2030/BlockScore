import { act, render, waitFor } from "@testing-library/react";
import { CreditProvider, useCredit } from "../../contexts/CreditContext";
import {
  calculateCreditScore,
  getCreditHistory,
  getCreditScore,
} from "../../utils/api";

vi.mock("../../utils/api", () => ({
  calculateCreditScore: vi.fn(),
  getCreditHistory: vi.fn(),
  getCreditScore: vi.fn(),
}));

const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseWeb3 = vi.fn();
vi.mock("../../contexts/Web3Context", () => ({
  useWeb3: () => mockUseWeb3(),
}));

let credit;
const Probe = () => {
  credit = useCredit();
  return <div>{credit.loading ? "loading" : "idle"}</div>;
};

const renderProvider = () =>
  render(
    <CreditProvider>
      <Probe />
    </CreditProvider>,
  );

describe("CreditContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseWeb3.mockReturnValue({ accounts: [] });
  });

  it("does not fetch when the user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    renderProvider();
    await waitFor(() => expect(credit.creditData).toBeNull());
    expect(getCreditScore).not.toHaveBeenCalled();
  });

  it("loads the credit score and history on mount when authenticated", async () => {
    getCreditScore.mockResolvedValueOnce({
      score: 720,
      score_grade: "Good",
      score_breakdown: { payment_history: 80 },
    });
    getCreditHistory.mockResolvedValueOnce({
      history: [{ id: "1", event_title: "Score calculated" }],
    });

    renderProvider();

    await waitFor(() => expect(credit.creditData?.score).toBe(720));
    expect(credit.history).toHaveLength(1);
    expect(credit.needsWallet).toBe(false);
  });

  it("sets needsWallet instead of a hard error when no wallet is on file", async () => {
    getCreditScore.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: "Wallet Address Required",
          message: "Wallet address is required for credit score calculation.",
        },
      },
    });
    getCreditHistory.mockResolvedValueOnce({ history: [] });

    renderProvider();

    await waitFor(() => expect(credit.needsWallet).toBe(true));
    expect(credit.error).toBeNull();
    expect(credit.creditData).toBeNull();
  });

  it("surfaces a real error message for genuine failures", async () => {
    getCreditScore.mockRejectedValueOnce({
      response: { status: 500, data: { message: "Server exploded" } },
    });
    getCreditHistory.mockResolvedValueOnce({ history: [] });

    renderProvider();

    await waitFor(() => expect(credit.error).toBe("Server exploded"));
    expect(credit.needsWallet).toBe(false);
  });

  it("recalculates the score on demand", async () => {
    getCreditScore.mockResolvedValueOnce({ score: 650, score_grade: "Fair" });
    getCreditHistory.mockResolvedValueOnce({ history: [] });
    calculateCreditScore.mockResolvedValueOnce({
      score: 700,
      score_grade: "Good",
    });

    renderProvider();
    await waitFor(() => expect(credit.creditData?.score).toBe(650));

    await act(async () => {
      await credit.recalculateCreditScore();
    });

    expect(calculateCreditScore).toHaveBeenCalledWith(undefined, true);
    expect(credit.creditData.score).toBe(700);
  });

  it("passes the connected wallet address through to the API calls", async () => {
    mockUseWeb3.mockReturnValue({ accounts: ["0xabc123"] });
    getCreditScore.mockResolvedValueOnce({ score: 710 });
    getCreditHistory.mockResolvedValueOnce({ history: [] });

    renderProvider();

    await waitFor(() =>
      expect(getCreditScore).toHaveBeenCalledWith("0xabc123"),
    );
  });
});
