import LogoutIcon from "@mui/icons-material/LogoutRounded";
import MenuIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// A slim, light top strip above the canvas. Branding already lives in the
// dark sidebar rail, so this bar's only job is context (mobile menu) and
// account actions, not a second logo competing for attention.
const Navbar = ({ onDrawerToggle }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const initial = (user?.email || "?").charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setAnchorEl(null);
    await signOut();
    navigate("/");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "background.default",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, sm: 3 } }}>
        <IconButton
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 1.5, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton sx={{ color: "text.secondary" }}>
          <Badge badgeContent={3} color="error">
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>

        <IconButton
          sx={{ ml: 1 }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="account menu"
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: "secondary.main",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {initial}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {user?.email ? (
            <MenuItem disabled sx={{ opacity: "1 !important" }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </MenuItem>
          ) : null}
          {user?.email ? <Divider /> : null}
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              navigate("/profile");
            }}
          >
            <ListItemIcon>
              <PersonOutlineRoundedIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
