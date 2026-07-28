import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SettingsIcon from "@mui/icons-material/Settings";
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

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
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
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "primary.main",
                    fontSize: 28,
                  }}
                >
                  {(displayName || "?").charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  {profile?.full_name || "Add your name"}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profileData?.email}
                </Typography>
                <Chip
                  size="small"
                  label={
                    profile?.kyc_status?.replace(/_/g, " ") || "not started"
                  }
                  sx={{ textTransform: "capitalize", mt: 1 }}
                  color={
                    profile?.kyc_status === "verified" ? "success" : "default"
                  }
                />

                <Divider sx={{ my: 2 }} />

                <List dense sx={{ textAlign: "left" }}>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PhoneIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={profile?.phone_number || "Not provided"}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Employment"
                      secondary={profile?.employment_status || "Not provided"}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EventIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Member since"
                      secondary={
                        profileData?.created_at
                          ? new Date(
                              profileData.created_at,
                            ).toLocaleDateString()
                          : "-"
                      }
                    />
                  </ListItem>
                </List>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  sx={{ mt: 2 }}
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Credit summary */}
            <Card sx={{ borderRadius: 3, mt: 3 }}>
              <CardContent sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  Credit Score
                </Typography>
                {needsWallet ? (
                  <Typography variant="body2" color="text.secondary">
                    Add a wallet address below to calculate your score.
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ maxWidth: 200, mx: "auto" }}>
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
              </CardContent>
            </Card>
          </Grid>

          {/* Editable profile details */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Personal Details</Typography>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
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
                        startIcon={<SaveIcon />}
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
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {creditData?.score_breakdown && (
              <Box sx={{ mb: 3 }}>
                <CreditFactors scoreBreakdown={creditData.score_breakdown} />
              </Box>
            )}

            {/* Loan applications */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  My Loan Applications
                </Typography>
                {applicationsLoading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 3 }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : applications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    You have not applied for any loans yet.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {applications.map((application, index) => (
                      <ListItem
                        key={application.id}
                        disableGutters
                        divider={index < applications.length - 1}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 1,
                              }}
                            >
                              <Typography sx={{ fontWeight: 500 }}>
                                {application.loan_type
                                  ?.replace(/_/g, " ")
                                  .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                                Loan
                              </Typography>
                              <Chip
                                size="small"
                                label={application.status?.replace(/_/g, " ")}
                                color={
                                  statusColor[application.status] || "default"
                                }
                                sx={{ textTransform: "capitalize" }}
                              />
                            </Box>
                          }
                          secondary={`$${Number(
                            application.requested_amount,
                          ).toLocaleString()} over ${application.requested_term_months} months`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
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
