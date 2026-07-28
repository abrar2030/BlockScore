import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCreditHistory } from "../utils/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const formatAmount = (amount, currency = "USD") => {
  if (amount === null || amount === undefined) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
};

// Full, paginated view of the authenticated user's credit history, backed by
// GET /api/credit/history. Reached from the Dashboard's "View History" quick
// action.
const CreditHistory = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (targetPage) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCreditHistory(targetPage, 20);
      setEvents(data?.history || []);
      setPages(data?.pagination?.pages || 1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "We could not load your credit history right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

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
          Credit History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          A complete record of the events that have affected your credit score.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography color="text.secondary">
            No credit events recorded yet.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Score Change</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {event.event_title || event.event_type}
                    </TableCell>
                    <TableCell>{event.event_description || "-"}</TableCell>
                    <TableCell align="right">
                      {typeof event.score_change === "number" &&
                      event.score_change !== 0 ? (
                        <Chip
                          size="small"
                          label={
                            event.score_change > 0
                              ? `+${event.score_change}`
                              : event.score_change
                          }
                          color={event.score_change > 0 ? "success" : "error"}
                          variant="outlined"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatAmount(event.amount, event.currency)}
                    </TableCell>
                    <TableCell align="right">
                      {formatDate(event.event_date || event.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </motion.div>
  );
};

export default CreditHistory;
