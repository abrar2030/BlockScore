import { Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const BlockMark = ({ size = 30 }) => (
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

// Navbar shown only on the public Landing page. It intentionally has no
// sidebar and no app navigation, just branding plus Sign in / Get Started (or
// a single "Go to Dashboard" action once the user is authenticated). The full
// app sidebar only appears after sign in, inside MainLayout.
const LandingNavbar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 2.5 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              color: "white",
              flexGrow: 1,
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

          {isAuthenticated ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="outlined"
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.35)",
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
                onClick={() => navigate("/signin")}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/signup")}
              >
                Get started
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </Box>
  );
};

export default LandingNavbar;
