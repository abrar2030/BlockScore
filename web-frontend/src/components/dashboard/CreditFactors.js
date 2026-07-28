import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";

// Maps the backend's score_breakdown keys (each 0-100) to display labels and
// short explanations, matching services/credit_service.py's
// _calculate_*_score methods.
const FACTOR_META = [
  {
    key: "payment_history",
    label: "Payment History",
    description: "On-time vs. late loan repayments",
  },
  {
    key: "credit_utilization",
    label: "Credit Utilization",
    description: "How much of your available credit is in use",
  },
  {
    key: "length_of_history",
    label: "Length of History",
    description: "How long you have had active credit accounts",
  },
  {
    key: "credit_mix",
    label: "Credit Mix",
    description: "Diversity of your loan and credit types",
  },
  {
    key: "new_credit",
    label: "New Credit",
    description: "Recent credit inquiries and new accounts",
  },
  {
    key: "income_stability",
    label: "Income Stability",
    description: "Consistency of reported income over time",
  },
  {
    key: "debt_to_income",
    label: "Debt to Income",
    description: "Your total debt relative to your income",
  },
  {
    key: "blockchain_activity",
    label: "Blockchain Activity",
    description: "On-chain transaction history and wallet activity",
  },
];

const getColor = (value) => {
  if (value >= 75) return "success";
  if (value >= 50) return "info";
  if (value >= 25) return "warning";
  return "error";
};

const CreditFactors = ({ scoreBreakdown }) => {
  const factors = FACTOR_META.map((meta) => ({
    ...meta,
    value: scoreBreakdown?.[meta.key],
  })).filter((factor) => factor.value !== undefined && factor.value !== null);

  if (!factors.length) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Score Factors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Factor breakdown will appear here once your credit score has been
            calculated.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Score Factors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Each factor is scored from 0 to 100 and contributes to your overall
          credit score.
        </Typography>

        {factors.map((factor, index) => (
          <motion.div
            key={factor.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Tooltip title={factor.description} arrow placement="top">
              <Box sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {factor.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(factor.value)}/100
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, factor.value))}
                  color={getColor(factor.value)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Tooltip>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CreditFactors;
