import { Box, Link, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: "auto",
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "text.primary", fontWeight: 500 }}
      >
        © {new Date().getFullYear()} BlockScore | All rights reserved
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <Link href="#" sx={{ mx: 1, color: "grey.700" }} underline="hover">
          Privacy Policy
        </Link>
        <Link href="#" sx={{ mx: 1, color: "grey.700" }} underline="hover">
          Terms of Service
        </Link>
        <Link href="#" sx={{ mx: 1, color: "grey.700" }} underline="hover">
          Contact
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
