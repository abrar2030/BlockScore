import { Box } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import Sidebar from "../components/navigation/Sidebar";

const drawerWidth = 248;

// The authenticated app shell: a fixed ink rail on the left, a slim top bar
// for context + account actions, and the page content on a light canvas.
// No footer here by design - this is a workspace people return to daily,
// not a document that needs a copyright line under every screen.
const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      <Box
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar onDrawerToggle={handleDrawerToggle} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, sm: 3, md: 4 },
            maxWidth: 1320,
            width: "100%",
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
