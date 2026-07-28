import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreditFactors from "../components/dashboard/CreditFactors";
// Components
import CreditScoreGauge from "../components/dashboard/CreditScoreGauge";
import QuickActions from "../components/dashboard/QuickActions";
import TransactionHistory from "../components/dashboard/TransactionHistory";
import { useAuth } from "../contexts/AuthContext";
import { useCredit } from "../contexts/CreditContext";

const gradeColor = {
  Excellent: "success",
  "Very Good": "success",
  Good: "primary",
  Fair: "warning",
  Poor: "error",
};

const Dashboard = () => {
  const _theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    creditData,
    history,
    loading,
    error,
    needsWallet,
    recalculateCreditScore,
  } = useCredit();
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateCreditScore();
    } catch {
      // Error state is already surfaced via the credit context.
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back{user?.email ? `, ${user.email}` : ""}! Here's your
          current credit status and history.
        </Typography>
      </Box>

      {needsWallet && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/profile")}
            >
              Add wallet
            </Button>
          }
        >
          Add a wallet address to your profile to calculate your credit score.
        </Alert>
      )}

      {error && !needsWallet && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Credit Score Card */}
        <Grid item xs={12} md={6} lg={4}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Your Credit Score
                </Typography>

                <Box sx={{ my: 2, width: "100%", maxWidth: 250 }}>
                  <CreditScoreGauge score={creditData?.score || 0} />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  {creditData?.calculated_at
                    ? `Last updated: ${new Date(
                        creditData.calculated_at,
                      ).toLocaleDateString()}`
                    : "Not calculated yet"}
                </Typography>

                <Divider sx={{ width: "100%", my: 2 }} />

                <Box sx={{ width: "100%", textAlign: "center" }}>
                  <Typography variant="body2" gutterBottom>
                    Score Category:
                  </Typography>
                  <Chip
                    label={creditData?.score_grade || "Not available"}
                    color={gradeColor[creditData?.score_grade] || "default"}
                    sx={{ fontWeight: 500, mb: 2 }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleRecalculate}
                    disabled={recalculating}
                  >
                    {recalculating ? "Recalculating..." : "Recalculate Score"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Credit Factors */}
        <Grid item xs={12} md={6} lg={4}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CreditFactors scoreBreakdown={creditData?.score_breakdown} />
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6} lg={4}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>

                <QuickActions />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Credit History */}
        <Grid item xs={12}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TransactionHistory history={history} />
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default Dashboard;
