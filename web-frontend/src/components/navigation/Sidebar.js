import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalculateIcon from "@mui/icons-material/CalculateOutlined";
import DashboardIcon from "@mui/icons-material/GridViewRounded";
import HelpIcon from "@mui/icons-material/HelpOutlineRounded";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import { Box, Drawer, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 248;

const menuItems = [
  { text: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { text: "Loan Calculator", icon: CalculateIcon, path: "/loan-calculator" },
  { text: "Profile", icon: AccountBalanceWalletIcon, path: "/profile" },
  { text: "Credit History", icon: HistoryIcon, path: "/history" },
  { text: "Help & Support", icon: HelpIcon, path: "/help" },
];

// The block-mark: a rounded square housing a short calibrated arc, the same
// gesture as the score dial elsewhere in the product. Used everywhere the
// wordmark appears so the brand always points back to "a score you can read".
const BlockMark = ({ size = 30 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    role="img"
    aria-label="BlockScore"
  >
    <rect width="32" height="32" rx="9" fill="#14B8A6" />
    <path
      d="M9 20.5 A 9 9 0 1 1 23 20.5"
      stroke="#0D1220"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="21.6" cy="12.2" r="1.9" fill="#0D1220" />
  </svg>
);

const NavList = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Stack sx={{ height: "100%" }}>
      <Box
        sx={{
          height: 68,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 2.5,
        }}
      >
        <BlockMark />
        <Typography
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
            fontSize: "1.05rem",
            color: "#ffffff",
          }}
        >
          BlockScore
        </Typography>
      </Box>

      <Stack component="nav" spacing={0.5} sx={{ px: 1.5, pt: 1, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const selected = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Box
              key={item.text}
              role="button"
              tabIndex={0}
              onClick={() => {
                navigate(item.path);
                onNavigate?.();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(item.path);
                  onNavigate?.();
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1.75,
                py: 1.1,
                borderRadius: 2,
                cursor: "pointer",
                color: selected ? "#ffffff" : "rgba(255,255,255,0.62)",
                backgroundColor: selected
                  ? "rgba(20, 184, 166, 0.16)"
                  : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                "&:hover": {
                  backgroundColor: selected
                    ? "rgba(20, 184, 166, 0.2)"
                    : "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                },
              }}
            >
              <Icon
                fontSize="small"
                sx={{ color: selected ? "#14B8A6" : "inherit" }}
              />
              <Typography
                variant="body2"
                sx={{ fontWeight: selected ? 600 : 500 }}
              >
                {item.text}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.35)", letterSpacing: 0.4 }}
        >
          BlockScore v1.0.0
        </Typography>
      </Box>
    </Stack>
  );
};

const railSx = {
  boxSizing: "border-box",
  width: drawerWidth,
  backgroundColor: "#0D1220",
  border: "none",
};

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": railSx,
        }}
      >
        <NavList onNavigate={onDrawerToggle} />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": railSx,
        }}
        open
      >
        <NavList />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
