import { Box, Card, Chip, Stack, Typography } from "@mui/material";
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
      <Card sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 1 }}>Credit History</Typography>
        <Typography variant="body2" color="text.secondary">
          No credit events recorded yet. Activity such as loan payments and
          score recalculations will appear here.
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography sx={{ fontWeight: 600, mb: 2 }}>Credit History</Typography>

      <Stack
        divider={
          <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />
        }
      >
        {history.map((event, index) => {
          const amount = formatAmount(event.amount, event.currency);
          const scoreChange = event.score_change;
          return (
            <motion.div
              key={event.id || event.transaction_id || index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Box
                sx={{
                  py: 1.75,
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    mt: 0.9,
                    flexShrink: 0,
                    bgcolor:
                      typeof scoreChange === "number" && scoreChange < 0
                        ? "error.main"
                        : "primary.main",
                  }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.event_title || "Credit Event"}
                    </Typography>
                    {typeof scoreChange === "number" && scoreChange !== 0 && (
                      <Chip
                        size="small"
                        label={
                          scoreChange > 0 ? `+${scoreChange}` : scoreChange
                        }
                        color={scoreChange > 0 ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontFamily: '"IBM Plex Mono", monospace' }}
                      />
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 0.25,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {event.event_description || event.event_type}
                      {event.transaction_id ? ` • ${event.transaction_id}` : ""}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      {amount && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          {amount}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(event.event_date || event.created_at)}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </Stack>
    </Card>
  );
};

export default TransactionHistory;
