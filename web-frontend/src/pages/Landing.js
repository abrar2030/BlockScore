import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import HeroIllustration from "../components/common/HeroIllustration";
import LandingNavbar from "../components/navigation/LandingNavbar";
import { useAuth } from "../contexts/AuthContext";

const stats = [
  { value: "300–850", label: "Score range, same scale lenders already read" },
  {
    value: "8",
    label: "Scoring factors, from repayment history to on-chain activity",
  },
  {
    value: "2",
    label: "Data sources blended into one number: financial + wallet",
  },
];

const features = [
  {
    icon: LinkRoundedIcon,
    title: "Wallet-aware scoring",
    description:
      "Link a wallet and its on-chain history becomes part of your score, alongside the financial factors a traditional bureau already checks.",
  },
  {
    icon: ShieldOutlinedIcon,
    title: "Every factor shown",
    description:
      "No single hidden number. See the eight factors behind your score and exactly how each one is trending.",
  },
  {
    icon: BoltRoundedIcon,
    title: "Instant loan estimates",
    description:
      "Model a loan amount, term, and rate against your real score before you apply, and see your approval odds change live.",
  },
  {
    icon: TrendingUpRoundedIcon,
    title: "A record that updates",
    description:
      "Recalculate whenever your situation changes and keep a running history of what moved your score and by how much.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0D1220",
          backgroundImage:
            "radial-gradient(circle at 82% 8%, rgba(20,184,166,0.20), transparent 42%)",
          pt: { xs: 16, md: 20 },
          pb: { xs: 10, md: 14 },
          color: "white",
        }}
      >
        <LandingNavbar />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                <Typography
                  component="span"
                  sx={{
                    display: "inline-block",
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: "0.78rem",
                    letterSpacing: 1.2,
                    color: "#14B8A6",
                    border: "1px solid rgba(20,184,166,0.35)",
                    borderRadius: 999,
                    px: 1.5,
                    py: 0.5,
                    mb: 3,
                  }}
                >
                  AI-NATIVE CREDIT SCORING
                </Typography>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "2.4rem", md: "3rem" },
                    lineHeight: 1.12,
                    mb: 2.5,
                  }}
                >
                  Your on-chain activity is data.
                  <br />
                  We turn it into credit.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4.5,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  BlockScore reads your financial history and your wallet side
                  by side, then gives you one transparent score, and every
                  factor behind it.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() =>
                      navigate(isAuthenticated ? "/dashboard" : "/signup")
                    }
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Check your score"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/loan-calculator")}
                    sx={{
                      px: 4,
                      py: 1.5,
                      color: "white",
                      borderColor: "rgba(255,255,255,0.3)",
                      "&:hover": {
                        borderColor: "white",
                        bgcolor: "rgba(255,255,255,0.06)",
                      },
                    }}
                  >
                    Estimate a loan
                  </Button>
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <Box sx={{ maxWidth: 480, mx: "auto" }}>
                  <HeroIllustration style={{ width: "100%", height: "auto" }} />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats strip */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ py: { xs: 5, md: 6 } }}>
            {stats.map((stat) => (
              <Grid item xs={12} sm={4} key={stat.value}>
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 600,
                    fontSize: "2rem",
                    color: "text.primary",
                    mb: 0.5,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
        <Box sx={{ maxWidth: 560, mb: 6 }}>
          <Typography
            variant="overline"
            sx={{ color: "primary.dark", fontWeight: 700 }}
          >
            How it works
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              mt: 1,
              fontSize: { xs: "1.8rem", md: "2.2rem" },
            }}
          >
            Built like an instrument panel, not a black box
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <Card sx={{ height: "100%", p: 3.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#0D1220",
                        mb: 2.5,
                      }}
                    >
                      <Icon sx={{ color: "#14B8A6", fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* CTA */}
      <Container maxWidth="lg" sx={{ pb: { xs: 9, md: 12 } }}>
        <Box
          sx={{
            borderRadius: 5,
            px: { xs: 4, md: 8 },
            py: { xs: 6, md: 8 },
            backgroundColor: "#0D1220",
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(20,184,166,0.18), transparent 45%)",
            textAlign: "center",
            color: "white",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: "1.7rem", md: "2.1rem" },
            }}
          >
            See where your score stands today
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.65)",
              mb: 4,
              maxWidth: 520,
              mx: "auto",
            }}
          >
            Create an account, add a wallet if you have one, and get your first
            score with a full factor breakdown in minutes.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/signup")}
            sx={{ px: 4, py: 1.5 }}
          >
            {isAuthenticated ? "Go to your dashboard" : "Create your account"}
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", py: 4 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} BlockScore. All rights reserved.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Credit scoring built from financial and on-chain data.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
