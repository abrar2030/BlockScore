import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";

// Renders real credit history events from GET /api/credit/history
// (models/credit.py CreditHistory.to_dict()): event_title, event_description,
// event_date, amount (nullable), score_change, transaction_id.
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatAmount = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
};

const TransactionHistory = ({ history = [] }) => {
  if (!history.length) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Credit History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No credit events recorded yet. Activity such as loan payments and
            score recalculations will appear here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Credit History
        </Typography>

        <List disablePadding>
          {history.map((event, index) => {
            const amount = formatAmount(event.amount, event.currency);
            const scoreChange = event.score_change;
            return (
              <motion.div
                key={event.id || event.transaction_id || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <ListItem
                  disableGutters
                  divider={index < history.length - 1}
                  sx={{ py: 1.5 }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {event.event_title || "Credit Event"}
                        </Typography>
                        {typeof scoreChange === "number" &&
                          scoreChange !== 0 && (
                            <Chip
                              size="small"
                              label={
                                scoreChange > 0
                                  ? `+${scoreChange}`
                                  : scoreChange
                              }
                              color={scoreChange > 0 ? "success" : "error"}
                              variant="outlined"
                            />
                          )}
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {event.event_description || event.event_type}
                          {event.transaction_id
                            ? ` • ${event.transaction_id}`
                            : ""}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          {amount && (
                            <Typography variant="body2" color="text.secondary">
                              {amount}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(event.event_date || event.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </motion.div>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
