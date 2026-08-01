import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Calculate loan",
    description: "Check loan eligibility",
    icon: CalculateOutlinedIcon,
    path: "/loan-calculator",
  },
  {
    title: "View history",
    description: "See transaction details",
    icon: HistoryRoundedIcon,
    path: "/history",
  },
  {
    title: "Improve score",
    description: "Get improvement tips",
    icon: TrendingUpRoundedIcon,
    path: "/profile",
  },
  {
    title: "Get help",
    description: "Support and resources",
    icon: HelpOutlineRoundedIcon,
    path: "/help",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Grid container spacing={1.5}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Grid item xs={6} key={action.title}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => navigate(action.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(action.path);
              }}
              sx={{
                height: "100%",
                cursor: "pointer",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                transition: "border-color 0.15s ease, transform 0.15s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#0D1220",
                  mb: 1.25,
                }}
              >
                <Icon sx={{ fontSize: 18, color: "#14B8A6" }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {action.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {action.description}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default QuickActions;
