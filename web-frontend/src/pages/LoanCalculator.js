import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { motion } from "framer-motion";
import { useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import { applyForLoan, calculateLoan } from "../utils/api";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
);

const INK = "#0D1220";
const SIGNAL = "#14B8A6";
const AMBER = "#F2A93B";

// Mirrors models/loan.py LoanType values.
const LOAN_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "mortgage", label: "Mortgage" },
  { value: "auto", label: "Auto" },
  { value: "student", label: "Student" },
  { value: "credit_line", label: "Credit Line" },
  { value: "defi", label: "DeFi / Crypto-Backed" },
];

const LoanCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [rate, setRate] = useState(5);
  const [term, setTerm] = useState(36);
  const [loanType, setLoanType] = useState("personal");
  const [purpose, setPurpose] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [applySuccess, setApplySuccess] = useState(null);

  const calculateLoanEligibility = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await calculateLoan(amount, rate, term);
      setResult(data);
    } catch (err) {
      console.error("Error calculating loan:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to calculate loan eligibility. Please try again later.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      const application = await applyForLoan({
        loanType,
        amount,
        termMonths: term,
        rate,
        purpose: purpose || undefined,
      });
      setApplySuccess(
        `Application ${application?.application_number || ""} submitted successfully.`,
      );
    } catch (err) {
      setApplyError(
        err?.response?.data?.message ||
          "We could not submit your application. Please try again later.",
      );
    } finally {
      setApplying(false);
    }
  };

  // Calculate a month-by-month payment schedule locally for the chart; the
  // backend only returns the aggregate totals, not a full amortization table.
  const generatePaymentSchedule = () => {
    if (!result) return [];

    const monthlyPayment = result.monthly_payment;
    const schedule = [];
    let remainingBalance = amount;
    let totalInterest = 0;

    for (let month = 1; month <= term; month++) {
      const interestPayment = remainingBalance * (rate / 100 / 12);
      const principalPayment = monthlyPayment - interestPayment;
      totalInterest += interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        totalInterest,
        balance: Math.max(0, remainingBalance),
      });
    }

    return schedule;
  };

  const paymentSchedule = generatePaymentSchedule();
  const chartData = {
    labels: paymentSchedule.slice(0, 12).map((item) => `M${item.month}`),
    datasets: [
      {
        label: "Principal",
        data: paymentSchedule.slice(0, 12).map((item) => item.principal),
        backgroundColor: INK,
        borderColor: INK,
      },
      {
        label: "Interest",
        data: paymentSchedule.slice(0, 12).map((item) => item.interest),
        backgroundColor: AMBER,
        borderColor: AMBER,
      },
    ],
  };

  const approvalChartData = {
    labels: ["Approval", "Rejection"],
    datasets: [
      {
        data: result
          ? [result.approval_probability, 100 - result.approval_probability]
          : [50, 50],
        backgroundColor: [SIGNAL, "rgba(13, 18, 32, 0.08)"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.4 }}
        >
          Model a loan
        </Typography>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, mt: 0.5 }}
        >
          Loan Calculator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Estimate your loan eligibility and monthly payments based on your
          credit score.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Loan Parameters */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ height: "100%" }}
          >
            <Card sx={{ p: 3, height: "100%" }}>
              <Typography sx={{ fontWeight: 600, mb: 2.5 }}>
                Loan Parameters
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="loan-type-label">Loan Type</InputLabel>
                <Select
                  labelId="loan-type-label"
                  label="Loan Type"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                >
                  {LOAN_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loan Amount
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 500,
                  }}
                >
                  ${amount.toLocaleString()}
                </Typography>
              </Box>
              <Slider
                value={amount}
                onChange={(_e, newValue) => setAmount(newValue)}
                min={1000}
                max={50000}
                step={500}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Interest Rate
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 500,
                  }}
                >
                  {rate}%
                </Typography>
              </Box>
              <Slider
                value={rate}
                onChange={(_e, newValue) => setRate(newValue)}
                min={1}
                max={20}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Loan Term
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 500,
                  }}
                >
                  {term} months
                </Typography>
              </Box>
              <Slider
                value={term}
                onChange={(_e, newValue) => setTerm(newValue)}
                min={12}
                max={60}
                step={12}
                marks={[
                  { value: 12, label: "1 yr" },
                  { value: 24, label: "2 yr" },
                  { value: 36, label: "3 yr" },
                  { value: 48, label: "4 yr" },
                  { value: 60, label: "5 yr" },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} months`}
                sx={{ mb: 4 }}
              />

              <TextField
                label="Purpose (optional)"
                fullWidth
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Debt consolidation, home renovation"
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={calculateLoanEligibility}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Calculate"
                )}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Card>
          </motion.div>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ height: "100%" }}
          >
            <Card
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 2 }}>
                Loan Eligibility Results
              </Typography>

              {!result ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexGrow: 1,
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    Adjust parameters and click Calculate to see results
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 1, flexGrow: 1 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          mb: 3,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Approval Probability
                        </Typography>
                        <Box sx={{ width: 150, height: 150 }}>
                          <Doughnut
                            data={approvalChartData}
                            options={{
                              cutout: "72%",
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: (context) =>
                                      `${context.label}: ${context.raw}%`,
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h5"
                          sx={{
                            mt: 2,
                            fontWeight: 600,
                            fontFamily: '"IBM Plex Mono", monospace',
                            color:
                              result.approval_probability > 70
                                ? "success.main"
                                : result.approval_probability > 50
                                  ? "primary.dark"
                                  : "warning.main",
                          }}
                        >
                          {result.approval_probability.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Based on credit score: {result.credit_score}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "background.default",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Monthly Payment
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 600,
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          ${result.monthly_payment.toFixed(2)}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Loan Amount
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                            >
                              ${amount.toLocaleString()}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Interest Rate
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                            >
                              {rate}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Loan Term
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                            >
                              {term} months
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Total Payment
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                            >
                              ${result.total_payment.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Total Interest
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                            >
                              ${result.total_interest.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Payment Breakdown (First Year)
                    </Typography>
                    <Box sx={{ height: 200 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: { display: true, text: "Amount ($)" },
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {applyError && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                      {applyError}
                    </Alert>
                  )}

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "center" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleApply}
                      disabled={applying}
                    >
                      {applying ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        "Apply for Loan"
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Snackbar
        open={!!applySuccess}
        autoHideDuration={6000}
        onClose={() => setApplySuccess(null)}
        message={applySuccess}
      />
    </motion.div>
  );
};

export default LoanCalculator;
