import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import CreditFactors from "../components/dashboard/CreditFactors";
import CreditScoreGauge from "../components/dashboard/CreditScoreGauge";
import { useAuth } from "../contexts/AuthContext";
import { useCredit } from "../contexts/CreditContext";
import {
  fetchCurrentUser,
  getLoanApplications,
  updateProfile,
} from "../utils/api";

const EMPLOYMENT_STATUSES = [
  "Employed",
  "Self-Employed",
  "Unemployed",
  "Student",
  "Retired",
];

const emptyForm = {
  first_name: "",
  last_name: "",
  phone_number: "",
  street_address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  annual_income: "",
  employment_status: "",
  employer_name: "",
  wallet_address: "",
};

const toFormValues = (profileData) => {
  const profile = profileData?.profile;
  if (!profile) return emptyForm;
  return {
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone_number: profile.phone_number || "",
    street_address: profile.address?.street_address || "",
    city: profile.address?.city || "",
    state: profile.address?.state || "",
    postal_code: profile.address?.postal_code || "",
    country: profile.address?.country || "",
    annual_income: profile.annual_income ?? "",
    employment_status: profile.employment_status || "",
    employer_name: profile.employer_name || "",
    wallet_address: profile.wallet_address || "",
  };
};

const statusColor = {
  approved: "success",
  disbursed: "success",
  under_review: "info",
  submitted: "info",
  rejected: "error",
  cancelled: "default",
  draft: "default",
};

// Fields counted toward the completion meter on the identity card. Purely a
// visual nudge, not sent anywhere.
const COMPLETION_FIELDS = [
  "first_name",
  "last_name",
  "phone_number",
  "street_address",
  "city",
  "country",
  "annual_income",
  "employment_status",
  "wallet_address",
];

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const { creditData, needsWallet } = useCredit();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchCurrentUser();
      setProfileData(data);
      setForm(toFormValues(data));
    } catch (err) {
      setLoadError(
        err?.response?.data?.message || "We could not load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const data = await getLoanApplications(1, 5);
      setApplications(data?.applications || []);
    } catch (err) {
      console.error("Error loading loan applications:", err);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadApplications();
  }, [loadProfile, loadApplications]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        annual_income:
          form.annual_income === "" ? null : Number(form.annual_income),
        wallet_address: form.wallet_address || null,
      };
      const updated = await updateProfile(payload);
      setProfileData(updated);
      setForm(toFormValues(updated));
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(
        err?.response?.data?.message ||
          "We could not save your profile changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(toFormValues(profileData));
    setIsEditing(false);
    setSaveError(null);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const profile = profileData?.profile;
  const displayName = profile?.full_name?.trim() || authUser?.email || "";
  const completion = Math.round(
    (COMPLETION_FIELDS.filter((key) => !!form[key]).length /
      COMPLETION_FIELDS.length) *
      100,
  );

  return (
    <Container maxWidth="lg" disableGutters sx={{ py: 0 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
              letterSpacing: 1.4,
            }}
          >
            Account
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5 }}>
            Profile
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your account details and view your credit summary.
          </Typography>
        </Box>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Identity card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: "center" }}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "secondary.main",
                  fontSize: 26,
                  fontWeight: 600,
                }}
              >
                {(displayName || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {profile?.full_name || "Add your name"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData?.email}
              </Typography>
              <Chip
                size="small"
                label={profile?.kyc_status?.replace(/_/g, " ") || "not started"}
                sx={{ textTransform: "capitalize", mt: 1 }}
                color={
                  profile?.kyc_status === "verified" ? "success" : "default"
                }
              />

              <Box sx={{ mt: 2.5, textAlign: "left" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Profile completeness
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      color: "text.secondary",
                    }}
                  >
                    {completion}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completion}
                  sx={{ height: 6 }}
                />
              </Box>

              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={1.75} sx={{ textAlign: "left" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PhoneOutlinedIcon
                    fontSize="small"
                    sx={{ color: "primary.dark" }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Phone
                    </Typography>
                    <Typography variant="body2">
                      {profile?.phone_number || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PersonOutlineRoundedIcon
                    fontSize="small"
                    sx={{ color: "primary.dark" }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Employment
                    </Typography>
                    <Typography variant="body2">
                      {profile?.employment_status || "Not provided"}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <EventRoundedIcon
                    fontSize="small"
                    sx={{ color: "primary.dark" }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Member since
                    </Typography>
                    <Typography variant="body2">
                      {profileData?.created_at
                        ? new Date(profileData.created_at).toLocaleDateString()
                        : "-"}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<LogoutRoundedIcon />}
                sx={{ mt: 2.5 }}
                onClick={logout}
              >
                Sign Out
              </Button>
            </Card>

            {/* Credit summary */}
            <Card sx={{ p: 3, mt: 3, textAlign: "center" }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Credit Score
              </Typography>
              {needsWallet ? (
                <Typography variant="body2" color="text.secondary">
                  Add a wallet address below to calculate your score.
                </Typography>
              ) : (
                <>
                  <Box sx={{ maxWidth: 190, mx: "auto" }}>
                    <CreditScoreGauge score={creditData?.score || 0} />
                  </Box>
                  <Chip
                    label={creditData?.score_grade || "Not calculated"}
                    color={
                      creditData?.score_grade === "Excellent" ||
                      creditData?.score_grade === "Very Good"
                        ? "success"
                        : creditData?.score_grade === "Good"
                          ? "primary"
                          : creditData?.score_grade === "Fair"
                            ? "warning"
                            : "default"
                    }
                    sx={{ mt: 1 }}
                  />
                </>
              )}
            </Card>
          </Grid>

          {/* Editable profile details */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  Personal Details
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditRoundedIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={handleCancel} disabled={saving}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveRoundedIcon />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </Box>
                )}
              </Box>

              {saveError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {saveError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First name"
                    fullWidth
                    value={form.first_name}
                    onChange={handleChange("first_name")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last name"
                    fullWidth
                    value={form.last_name}
                    onChange={handleChange("last_name")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone number"
                    fullWidth
                    value={form.phone_number}
                    onChange={handleChange("phone_number")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Employment status"
                    fullWidth
                    value={form.employment_status}
                    onChange={handleChange("employment_status")}
                    disabled={!isEditing}
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    {EMPLOYMENT_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Employer name"
                    fullWidth
                    value={form.employer_name}
                    onChange={handleChange("employer_name")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Annual income"
                    type="number"
                    fullWidth
                    value={form.annual_income}
                    onChange={handleChange("annual_income")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Street address"
                    fullWidth
                    value={form.street_address}
                    onChange={handleChange("street_address")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="City"
                    fullWidth
                    value={form.city}
                    onChange={handleChange("city")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="State / Province"
                    fullWidth
                    value={form.state}
                    onChange={handleChange("state")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Postal code"
                    fullWidth
                    value={form.postal_code}
                    onChange={handleChange("postal_code")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Country"
                    fullWidth
                    value={form.country}
                    onChange={handleChange("country")}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Wallet address"
                    fullWidth
                    value={form.wallet_address}
                    onChange={handleChange("wallet_address")}
                    disabled={!isEditing}
                    placeholder="0x..."
                    helperText="Used to include your on-chain activity in your credit score"
                    InputProps={{
                      sx: {
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: "0.9rem",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Card>

            {creditData?.score_breakdown && (
              <Box sx={{ mb: 3 }}>
                <CreditFactors scoreBreakdown={creditData.score_breakdown} />
              </Box>
            )}

            {/* Loan applications */}
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 2 }}>
                My Loan Applications
              </Typography>
              {applicationsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : applications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You have not applied for any loans yet.
                </Typography>
              ) : (
                <Stack divider={<Divider />} spacing={1.5}>
                  {applications.map((application) => (
                    <Box
                      key={application.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                        py: 0.5,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {application.loan_type
                            ?.replace(/_/g, " ")
                            .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                          Loan
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: "0.8rem",
                          }}
                        >
                          {`$${Number(application.requested_amount).toLocaleString()} over ${application.requested_term_months} months`}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={application.status?.replace(/_/g, " ")}
                        color={statusColor[application.status] || "default"}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={() => setSaveSuccess(false)}
        message="Profile updated successfully"
      />
    </Container>
  );
};

export default Profile;
