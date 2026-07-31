import { Box } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
// Components
import LoadingScreen from "./components/common/LoadingScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// Layouts
import MainLayout from "./layouts/MainLayout";
// Landing is the default route, so it stays eagerly bundled for the
// fastest first paint. Everything else loads on demand.
import Landing from "./pages/Landing";

const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LoanCalculator = lazy(() => import("./pages/LoanCalculator"));
const Profile = lazy(() => import("./pages/Profile"));
const CreditHistory = lazy(() => import("./pages/CreditHistory"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
        <Suspense fallback={<LoadingScreen />}>
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
        </Suspense>
      </AnimatePresence>
    </Box>
  );
}

export default App;
