import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <CircularProgress
          size={44}
          thickness={4}
          sx={{ color: "primary.main" }}
        />
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Typography
          variant="h6"
          sx={{
            mt: 3,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
          }}
        >
          Loading BlockScore
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          AI-native credit scoring
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
