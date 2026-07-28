import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  TextField,
  Typography,
  useTheme,
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

// Mirrors models/loan.py LoanType values.
const LOAN_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "mortgage", label: "Mortgage" },
  { value: "auto", label: "Auto" },
  { value: "student", label: "Student" },
  { value: "crypto_backed", label: "Crypto-Backed" },
];

const LoanCalculator = () => {
  const theme = useTheme();

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
    labels: paymentSchedule.slice(0, 12).map((item) => `Month ${item.month}`),
    datasets: [
      {
        label: "Principal",
        data: paymentSchedule.slice(0, 12).map((item) => item.principal),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
      },
      {
        label: "Interest",
        data: paymentSchedule.slice(0, 12).map((item) => item.interest),
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.main,
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
        backgroundColor: [theme.palette.success.main, theme.palette.grey[300]],
        borderWidth: 0,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Loan Calculator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Estimate your loan eligibility and monthly payments based on your
          credit score.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Loan Parameters */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Loan Parameters
                </Typography>

                <Box sx={{ mt: 3 }}>
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

                  <Typography gutterBottom>
                    Loan Amount: ${amount.toLocaleString()}
                  </Typography>
                  <Slider
                    value={amount}
                    onChange={(_e, newValue) => setAmount(newValue)}
                    min={1000}
                    max={50000}
                    step={500}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                    sx={{ mb: 4 }}
                  />

                  <Typography gutterBottom>Interest Rate: {rate}%</Typography>
                  <Slider
                    value={rate}
                    onChange={(_e, newValue) => setRate(newValue)}
                    min={1}
                    max={20}
                    step={0.1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                    sx={{ mb: 4 }}
                  />

                  <Typography gutterBottom>Loan Term: {term} months</Typography>
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
                    fullWidth
                    size="large"
                    onClick={calculateLoanEligibility}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Calculate"}
                  </Button>

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Loan Eligibility Results
                </Typography>

                {!result ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexGrow: 1,
                    }}
                  >
                    <Typography color="text.secondary">
                      Adjust parameters and click Calculate to see results
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2, flexGrow: 1 }}>
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
                                cutout: "70%",
                                plugins: {
                                  legend: {
                                    display: false,
                                  },
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
                              color:
                                result.approval_probability > 70
                                  ? "success.main"
                                  : result.approval_probability > 50
                                    ? "primary.main"
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
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: "background.default",
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            Monthly Payment
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            ${result.monthly_payment.toFixed(2)}
                          </Typography>

                          <Divider sx={{ my: 1.5 }} />

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Loan Amount:
                            </Typography>
                            <Typography variant="body2">
                              ${amount.toLocaleString()}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Interest Rate:
                            </Typography>
                            <Typography variant="body2">{rate}%</Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Loan Term:
                            </Typography>
                            <Typography variant="body2">
                              {term} months
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Total Payment:
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
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
                              Total Interest:
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              ${result.total_interest.toFixed(2)}
                            </Typography>
                          </Box>
                        </Paper>
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
                                title: {
                                  display: true,
                                  text: "Amount ($)",
                                },
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
                      sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="secondary"
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
              </CardContent>
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
