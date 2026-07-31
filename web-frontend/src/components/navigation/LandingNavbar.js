import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Navbar shown only on the public Landing page. It intentionally has no
// sidebar and no app navigation, just branding plus Sign in / Get Started (or
// a single "Go to Dashboard" action once the user is authenticated). The full
// app sidebar only appears after sign in, inside MainLayout.
const LandingNavbar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar
      position="absolute"
      elevation={0}
      sx={{
        background: "transparent",
        boxShadow: "none",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              color: "white",
              flexGrow: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "white",
                color: "primary.main",
                mr: 1.5,
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              B
            </Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}
            >
              BlockScore
            </Typography>
          </Box>

          {isAuthenticated ? (
            <Button
              variant="contained"
              color="inherit"
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
              }}
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
                  borderColor: "rgba(255,255,255,0.6)",
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
                color="inherit"
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                }}
                onClick={() => navigate("/signup")}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default LandingNavbar;
