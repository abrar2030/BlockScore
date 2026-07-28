import { Box, CircularProgress } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Guards routes that require an authenticated session. While the initial
// session restore is in flight we render a spinner so an already-signed-in
// user does not briefly flash the sign in screen.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    );
  }

  return children;
};

export default ProtectedRoute;
