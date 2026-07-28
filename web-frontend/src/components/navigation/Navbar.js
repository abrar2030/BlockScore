import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
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
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = ({ onDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleSignOut = async () => {
    setAnchorEl(null);
    await signOut();
    navigate("/");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        background: "linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => navigate("/dashboard")}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "white",
              color: "primary.main",
              mr: 1,
              fontWeight: 700,
              fontSize: "1.2rem",
            }}
          >
            B
          </Box>
          BlockScore
        </Typography>

        <Box sx={{ display: "flex" }}>
          <IconButton color="inherit" sx={{ ml: 1 }}>
            <Badge badgeContent={3} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            color="inherit"
            sx={{ ml: 1 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="account menu"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
              <AccountCircleIcon />
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
                <PersonIcon fontSize="small" />
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
