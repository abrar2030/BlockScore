import { Box, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const BlockMark = ({ size = 34 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    role="img"
    aria-label="BlockScore"
  >
    <rect width="32" height="32" rx="9" fill="#14B8A6" />
    <path
      d="M9 20.5 A 9 9 0 1 1 23 20.5"
      stroke="#0D1220"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="21.6" cy="12.2" r="1.9" fill="#0D1220" />
  </svg>
);

const points = [
  "One score built from your financial history and on-chain activity",
  "Instant loan eligibility estimates before you apply",
  "A full, transparent record of every event that moved your score",
];

// Split-screen shell for sign in / sign up / forgot password: a dark brand
// panel that carries the score-dial motif, next to a plain, well-lit form.
// The form itself never has to compete with decoration for attention.
const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "42%",
          minWidth: 420,
          p: 6,
          backgroundColor: "#0D1220",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(20,184,166,0.16), transparent 45%)",
          color: "white",
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.25,
            textDecoration: "none",
            color: "white",
          }}
        >
          <BlockMark />
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 600,
              fontSize: "1.1rem",
            }}
          >
            BlockScore
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 600,
              fontSize: { md: "2rem", lg: "2.35rem" },
              lineHeight: 1.15,
              mb: 3,
              maxWidth: 420,
            }}
          >
            Your credit score, read like an instrument, not a black box.
          </Typography>

          <Stack spacing={2}>
            {points.map((point) => (
              <Box key={point} sx={{ display: "flex", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#14B8A6",
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
                  {point}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} BlockScore
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.25,
              mb: 4,
            }}
          >
            <BlockMark size={28} />
            <Typography
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
              }}
            >
              BlockScore
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: subtitle ? 1 : 3.5,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>
              {subtitle}
            </Typography>
          ) : null}
          {children}
        </motion.div>
      </Box>
    </Box>
  );
};

export default AuthLayout;
