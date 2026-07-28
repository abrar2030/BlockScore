/**
 * Credit History Screen
 * Displays the current user's real credit history and score trend, backed by
 * GET /api/credit/history via the credit Redux slice.
 */

import { useNavigation } from "@react-navigation/native";
import { Icon } from "@rneui/themed";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCreditHistory } from "../store/slices/creditSlice";
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from "../utils/responsive";

// Define modern color palette (same as other screens)
const colors = {
  primary: "#4A90E2", // Modern Blue
  accent: "#50E3C2", // Teal/Mint Green
  secondaryAccent: "#F5A623", // Orange
  background: "#F8F9FA", // Light Gray
  cardBackground: "#FFFFFF", // White
  textPrimary: "#333333", // Dark Gray
  textSecondary: "#777777", // Medium Gray
  border: "#EAEAEA", // Light Gray
  success: "#50E3C2",
  info: "#4A90E2",
  warning: "#F5A623",
  error: "#D0021B", // Red for negative changes
};

const chartConfig = {
  backgroundGradientFrom: colors.cardBackground,
  backgroundGradientTo: colors.cardBackground,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 15,
  },
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: colors.border,
  },
};

const formatDate = (value) => {
  if (!value) {
    return { month: "-", day: "-" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { month: "-", day: "-" };
  }
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
};

const CreditHistoryScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { history, isLoading } = useAppSelector((state) => state.credit);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCreditHistory({ page, perPage: 10 }));
  }, [dispatch, page]);

  const events = history?.history || [];
  const pagination = history?.pagination;

  // Build the score trend chart from real events that recorded a score,
  // oldest first. Falls back to a single flat point when there is no
  // score-affecting history yet.
  const scoredEvents = events
    .filter((event) => typeof event.score_after === "number")
    .slice()
    .reverse();

  const chartData = {
    labels: scoredEvents.length
      ? scoredEvents.map((event) => formatDate(event.event_date).month)
      : ["-"],
    datasets: [
      {
        data: scoredEvents.length
          ? scoredEvents.map((event) => event.score_after)
          : [0],
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Credit Score Trend"],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name="arrow-back-ios"
            type="material"
            color={colors.cardBackground}
            size={responsiveFontSize(2.5)}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit History</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {scoredEvents.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Score Trend</Text>
          <LineChart
            data={chartData}
            width={responsiveWidth(90)}
            height={responsiveHeight(30)}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: responsiveHeight(3) }}
          />
        ) : events.length === 0 ? (
          <Text style={styles.emptyText}>No credit events recorded yet.</Text>
        ) : (
          events.map((item, index) => {
            const { month, day } = formatDate(
              item.event_date || item.created_at,
            );
            return (
              <View
                key={item.id || index}
                style={[
                  styles.historyItem,
                  index === events.length - 1 ? styles.historyItemLast : null,
                ]}
              >
                <View style={styles.historyDate}>
                  <Text style={styles.dateText}>{month}</Text>
                  <Text style={styles.dateNumber}>{day}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>
                    {item.event_title || item.event_type}
                  </Text>
                  <Text style={styles.historyDescription}>
                    {item.event_description || ""}
                  </Text>
                </View>
                <View style={styles.historyScore}>
                  {typeof item.score_change === "number" &&
                  item.score_change !== 0 ? (
                    <Text
                      style={[
                        styles.scoreChange,
                        item.score_change < 0
                          ? styles.negative
                          : styles.positive,
                      ]}
                    >
                      {item.score_change > 0
                        ? `+${item.score_change}`
                        : item.score_change}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      {pagination && (pagination.has_prev || pagination.has_next) && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              !pagination.has_prev && styles.pageButtonDisabled,
            ]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.has_prev}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>
            Page {pagination.page} of {pagination.pages}
          </Text>
          <TouchableOpacity
            style={[
              styles.pageButton,
              !pagination.has_next && styles.pageButtonDisabled,
            ]}
            onPress={() => setPage((p) => p + 1)}
            disabled={!pagination.has_next}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row", // Align items horizontally
    alignItems: "center", // Center items vertically
    justifyContent: "space-between", // Space out back button, title, placeholder
    paddingVertical: responsiveHeight(2.5),
    paddingHorizontal: responsiveWidth(4),
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: responsiveWidth(1),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.8),
    fontWeight: "bold",
    color: colors.cardBackground,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: responsiveWidth(8), // Match approx width of back button for balance
  },
  chartContainer: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
    marginBottom: responsiveHeight(2),
    padding: responsiveHeight(2),
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: responsiveHeight(2),
    alignSelf: "flex-start",
    marginLeft: responsiveWidth(2),
  },
  chart: {
    marginVertical: responsiveHeight(1),
    borderRadius: 15,
  },
  historyContainer: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(2),
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(3),
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(1.8),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyItemLast: {
    borderBottomWidth: 0,
  },
  historyDate: {
    width: responsiveWidth(13),
    alignItems: "center",
    justifyContent: "center",
    marginRight: responsiveWidth(3),
    paddingVertical: responsiveHeight(0.5),
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  dateText: {
    fontSize: responsiveFontSize(1.5),
    color: colors.textSecondary,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dateNumber: {
    fontSize: responsiveFontSize(2),
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: responsiveFontSize(1.9),
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: responsiveHeight(0.3),
  },
  historyDescription: {
    fontSize: responsiveFontSize(1.6),
    color: colors.textSecondary,
  },
  historyScore: {
    width: responsiveWidth(12),
    alignItems: "flex-end",
    justifyContent: "center",
  },
  scoreChange: {
    fontSize: responsiveFontSize(1.9),
    fontWeight: "bold",
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  actionButton: {
    flexDirection: "row", // Align icon and text
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: responsiveHeight(1.8),
    borderRadius: 10,
    marginHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(4),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonIcon: {
    marginRight: responsiveWidth(2),
  },
  actionButtonText: {
    color: colors.cardBackground,
    fontSize: responsiveFontSize(2.2),
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: responsiveFontSize(1.8),
    color: colors.textSecondary,
    textAlign: "center",
    marginVertical: responsiveHeight(3),
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: responsiveWidth(5),
    marginBottom: responsiveHeight(4),
  },
  pageButton: {
    paddingVertical: responsiveHeight(1),
    paddingHorizontal: responsiveWidth(4),
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: colors.border,
  },
  pageButtonText: {
    color: colors.cardBackground,
    fontWeight: "600",
    fontSize: responsiveFontSize(1.7),
  },
  pageIndicator: {
    color: colors.textSecondary,
    fontSize: responsiveFontSize(1.6),
  },
});

export default CreditHistoryScreen;
