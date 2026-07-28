import { Box } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
// Components
import LoadingScreen from "./components/common/LoadingScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// Layouts
import MainLayout from "./layouts/MainLayout";
// Pages
import CreditHistory from "./pages/CreditHistory";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Help from "./pages/Help";
import Landing from "./pages/Landing";
import LoanCalculator from "./pages/LoanCalculator";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

const Protected = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Authenticated application area (with sidebar) */}
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/loan-calculator"
              element={
                <Protected>
                  <LoanCalculator />
                </Protected>
              }
            />
            <Route
              path="/profile"
              element={
                <Protected>
                  <Profile />
                </Protected>
              }
            />
            <Route
              path="/history"
              element={
                <Protected>
                  <CreditHistory />
                </Protected>
              }
            />
            <Route
              path="/help"
              element={
                <Protected>
                  <Help />
                </Protected>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Box>
  );
}

export default App;
