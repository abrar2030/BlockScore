import { render, screen } from "@testing-library/react";
import TransactionHistory from "../../components/dashboard/TransactionHistory";

describe("TransactionHistory", () => {
  it("shows an empty state with no events", () => {
    render(<TransactionHistory history={[]} />);
    expect(
      screen.getByText(/no credit events recorded yet/i),
    ).toBeInTheDocument();
  });

  it("renders real credit history events with title, score change and amount", () => {
    render(
      <TransactionHistory
        history={[
          {
            id: "evt-1",
            event_title: "Loan Payment",
            event_description: "On-time payment",
            event_date: "2026-01-15T00:00:00Z",
            amount: 250.5,
            currency: "USD",
            score_change: 8,
            transaction_id: "TX-ABC123",
          },
          {
            id: "evt-2",
            event_title: "Credit Score Calculated",
            event_type: "score_calculation",
            event_date: "2026-01-01T00:00:00Z",
            score_change: 0,
          },
        ]}
      />,
    );

    expect(screen.getByText("Loan Payment")).toBeInTheDocument();
    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByText("$250.50")).toBeInTheDocument();
    expect(screen.getByText(/TX-ABC123/)).toBeInTheDocument();
    expect(screen.getByText("Credit Score Calculated")).toBeInTheDocument();
  });
});
