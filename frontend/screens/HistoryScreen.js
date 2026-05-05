import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AttendanceRecord from "../components/AttendanceRecord";
import {
  getAttendanceRecords,
  clearAttendanceRecords,
} from "../../backend/storage/storageService";
import { formatDateOnly } from "../../backend/utils/formatters";
export default function HistoryScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [groupedRecords, setGroupedRecords] = useState([]); // [{date, data}]
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadRecords = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const {
        success,
        records: fetchedRecords,
        error: fetchError,
      } = await getAttendanceRecords();

      if (!success) {
        setError(fetchError || "Failed to load records.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const grouped = groupRecordsByDate(fetchedRecords);

      setRecords(fetchedRecords);
      setGroupedRecords(grouped);
      setTotalCount(fetchedRecords.length);
      setIsLoading(false);
      setIsRefreshing(false);

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim],
  );

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Records",
      `This will permanently delete all ${totalCount} attendance record${
        totalCount !== 1 ? "s" : ""
      }. This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            const { success, error: clearError } =
              await clearAttendanceRecords();
            setIsClearing(false);

            if (!success) {
              Alert.alert("Error", clearError || "Failed to clear records.", [
                { text: "OK" },
              ]);
              return;
            }

            setRecords([]);
            setGroupedRecords([]);
            setTotalCount(0);
          },
        },
      ],
    );
  };

  const renderSectionHeader = (date, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderDate}>{date}</Text>
      <View style={styles.sectionHeaderBadge}>
        <Text style={styles.sectionHeaderCount}>
          {count} record{count !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );


  const renderItem = ({ item, index }) => {
    if (item.type === "header") {
      return renderSectionHeader(item.date, item.count);
    }
    return <AttendanceRecord record={item.record} index={item.recordIndex} />;
  };

  const keyExtractor = (item, index) =>
    item.type === "header" ? `header-${item.date}` : `record-${item.record.id}`;

  if (isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading attendance history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadRecords()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Attendance History</Text>
        </View>
        <View style={styles.centeredScreen}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Records Yet</Text>
          <Text style={styles.emptyMessage}>
            Your attendance records will appear here once you mark attendance
            from the Home screen.
          </Text>
          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.goHomeButtonText}>Go to Home →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const flatData = flattenGroupedRecords(groupedRecords);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Attendance History</Text>
          <Text style={styles.topBarSubtitle}>
            {totalCount} record{totalCount !== 1 ? "s" : ""} total
          </Text>
        </View>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAll}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text style={styles.clearButtonText}>🗑 Clear All</Text>
          )}
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRecords(true)}
              tintColor="#4F46E5"
              colors={["#4F46E5"]}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          ListFooterComponent={
            <View style={styles.listFooter}>
              <Text style={styles.listFooterText}>— End of records —</Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}

function groupRecordsByDate(records) {
  const groups = {};

  records.forEach((record) => {
    const dateKey = formatDateOnly(record.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
  });

  return Object.entries(groups).map(([date, recs]) => ({
    date,
    records: recs,
  }));
}

function flattenGroupedRecords(groupedRecords) {
  const flat = [];
  let globalIndex = 0;

  groupedRecords.forEach(({ date, records }) => {
    flat.push({
      type: "header",
      date,
      count: records.length,
    });

    records.forEach((record) => {
      flat.push({
        type: "record",
        record,
        recordIndex: globalIndex++,
      });
    });
  });

  return flat;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  listContainer: {
    flex: 1,
  },

  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  topBarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  topBarSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  clearButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  clearButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  sectionHeaderDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  sectionHeaderBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },

  sectionHeaderCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },

  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },

  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  retryButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },

  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  emptyMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  goHomeButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,

    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  goHomeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  listFooter: {
    alignItems: "center",
    paddingVertical: 24,
  },

  listFooterText: {
    fontSize: 12,
    color: "#D1D5DB",
  },
});
