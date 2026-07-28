import { render, screen } from "@testing-library/react";
import CreditFactors from "../../components/dashboard/CreditFactors";

describe("CreditFactors", () => {
  it("shows a placeholder when no breakdown is available", () => {
    render(<CreditFactors scoreBreakdown={undefined} />);
    expect(
      screen.getByText(/factor breakdown will appear here/i),
    ).toBeInTheDocument();
  });

  it("renders each present factor from the real score_breakdown shape", () => {
    render(
      <CreditFactors
        scoreBreakdown={{
          payment_history: 82,
          credit_utilization: 45,
          length_of_history: 60,
          // credit_mix intentionally omitted to verify graceful filtering
          new_credit: 70,
          income_stability: 55,
          debt_to_income: 30,
          blockchain_activity: 90,
        }}
      />,
    );

    expect(screen.getByText("Payment History")).toBeInTheDocument();
    expect(screen.getByText("82/100")).toBeInTheDocument();
    expect(screen.getByText("Credit Utilization")).toBeInTheDocument();
    expect(screen.getByText("Blockchain Activity")).toBeInTheDocument();
    expect(screen.getByText("90/100")).toBeInTheDocument();
    expect(screen.queryByText("Credit Mix")).not.toBeInTheDocument();
  });
});
