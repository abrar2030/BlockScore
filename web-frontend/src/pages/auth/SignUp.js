import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

// Mirrors the backend's UserRegistrationSchema: min 8 characters is the only
// hard requirement, but we encourage a stronger password with extra checks.
const passwordRules = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
];

const SignUp = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passed = useMemo(
    () => passwordRules.filter((rule) => rule.test(password)).length,
    [password],
  );
  const strengthPct = (passed / passwordRules.length) * 100;
  const strengthColor =
    strengthPct === 100 ? "success" : strengthPct >= 66 ? "warning" : "error";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    const result = await signUp({ email, password, confirmPassword });
    setSubmitting(false);
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join BlockScore to build a transparent, on-chain credit profile."
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

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
            required
          />

          {password ? (
            <Box>
              <LinearProgress
                variant="determinate"
                value={strengthPct}
                color={strengthColor}
                sx={{ height: 6, borderRadius: 3, mb: 1 }}
              />
              <Grid container spacing={0.5}>
                {passwordRules.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <Grid item xs={12} sm={6} key={rule.label}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {ok ? (
                          <CheckCircleIcon
                            sx={{ fontSize: 14, color: "success.main" }}
                          />
                        ) : (
                          <RadioButtonUncheckedIcon
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          color={ok ? "success.main" : "text.secondary"}
                        >
                          {rule.label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ) : null}

          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
            required
            error={!!confirmPassword && confirmPassword !== password}
            helperText={
              confirmPassword && confirmPassword !== password
                ? "Passwords do not match."
                : " "
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I agree to the{" "}
                <Link href="#" underline="hover">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" underline="hover">
                  Privacy Policy
                </Link>
                .
              </Typography>
            }
            sx={{ alignItems: "flex-start", mt: 0 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            color="secondary"
            endIcon={<ArrowForwardIcon />}
            disabled={submitting}
            sx={{ py: 1.5 }}
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Already have an account?{" "}
            <Link component={RouterLink} to="/signin" underline="hover">
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
};

export default SignUp;
