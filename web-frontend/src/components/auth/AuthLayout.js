import { Box, Container, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

// Shared shell for the sign in / sign up / forgot password pages: a branded
// gradient header above a centered card, matching the Landing page's hero
// styling so the auth flow feels like part of the same product.
const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              color: "white",
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
        </Container>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          py: { xs: 4, md: 6 },
          mt: { xs: -3, md: -4 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: "100%" }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 600,
                mb: subtitle ? 1 : 3,
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {subtitle}
              </Typography>
            ) : null}
            {children}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AuthLayout;
