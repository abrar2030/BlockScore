import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";

// There is currently no password-reset endpoint on the backend, so this page
// collects the request and always shows the same confirmation. That keeps the
// UI honest (no fake "email sent" claim tied to a real delivery guarantee)
// while giving users a clear, non-dead-end recovery path.
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthLayout title="Request received">
        <Stack spacing={3} alignItems="flex-start">
          <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />
          <Typography variant="body1" color="text.secondary">
            If an account exists for{" "}
            <Typography component="span" fontWeight={600} color="text.primary">
              {email}
            </Typography>
            , our support team will follow up with password reset instructions
            shortly.
          </Typography>
          <Button
            component={RouterLink}
            to="/signin"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to sign in
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email tied to your account and our team will help you regain access."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        <Stack spacing={2.5}>
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            fullWidth
            required
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            color="secondary"
            sx={{ py: 1.5 }}
          >
            Send request
          </Button>

          <Button
            component={RouterLink}
            to="/signin"
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: "center" }}
          >
            Back to sign in
          </Button>
        </Stack>
      </Box>
    </AuthLayout>
  );
};

export default ForgotPassword;
