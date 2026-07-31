import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    question: "How is my credit score calculated?",
    answer:
      "Your score is calculated from eight factors: payment history, credit utilization, length of history, credit mix, new credit, income stability, debt-to-income ratio, and on-chain blockchain activity. Each factor contributes a weighted portion of your overall score.",
  },
  {
    question: "Why do I need a wallet address?",
    answer:
      "Your wallet address lets BlockScore include your on-chain activity in the scoring model. You can add one from your Profile page, or connect a wallet directly from the navigation bar.",
  },
  {
    question: "How often can I recalculate my score?",
    answer:
      "You can request a recalculation at any time from your Dashboard. Recalculations are rate-limited to protect the scoring service, so allow a short pause between requests.",
  },
  {
    question: "What happens after I apply for a loan?",
    answer:
      "Your application is evaluated against your current credit score and financial details. You can track the status of every application you've submitted from your Profile page.",
  },
];

// Minimal static support page reached from the Dashboard's "Get Help" quick
// action. No backend dependency; purely informational.
const Help = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Answers to common questions about BlockScore.
        </Typography>
      </Box>

      <Box>
        {faqs.map((faq) => (
          <Accordion key={faq.question} disableGutters sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Paper
        sx={{ p: 3, mt: 4, borderRadius: 3, textAlign: "center" }}
        variant="outlined"
      >
        <Typography sx={{ fontWeight: 500, mb: 1 }}>
          Still need help?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reach out to our support team from your Profile page and we&rsquo;ll
          get back to you as soon as possible.
        </Typography>
      </Paper>
    </motion.div>
  );
};

export default Help;
