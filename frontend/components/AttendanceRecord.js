import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import {
  formatTimestamp,
  formatDateOnly,
  formatTimeOnly,
  formatDistance,
  formatAccuracy,
  formatCoordinates,
  formatStatus,
  formatRecordId,
  formatRecordType,
} from "../../backend/utils/formatters";
export default function AttendanceRecord({ record, index }) {
  const [expanded, setExpanded] = React.useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  const entryAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.timing(expandAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false, // height animation needs false
    }).start();
  };

  const statusConfig = getStatusConfig(record.status);

  const expandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const entryOpacity = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const entryTranslate = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entryOpacity,
          transform: [{ translateY: entryTranslate }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.date}>
            {formatDateOnly(record.timestamp)}
          </Text>
          <Text style={styles.time}>
            🕐 {formatTimeOnly(record.timestamp)}
          </Text>
          <Text style={styles.recordId}>
            {formatRecordId(record.id)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusConfig.pillBackground },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: statusConfig.pillText },
              ]}
            >
              {statusConfig.label}
            </Text>
          </View>

          <Text style={styles.arrow}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      <View
        style={[
          styles.recordTypeBadge,
          record.recordType === "CHECK_OUT"
            ? styles.recordTypeBadgeCheckout
            : styles.recordTypeBadgeCheckin,
        ]}
      >
        <Text
          style={[
            styles.recordTypeBadgeText,
            record.recordType === "CHECK_OUT"
              ? styles.recordTypeBadgeTextCheckout
              : styles.recordTypeBadgeTextCheckin,
          ]}
        >
          {formatRecordType(record.recordType)}
        </Text>
      </View>

      <View style={styles.employeeRow}>
        <View style={styles.employeeChip}>
          <Text style={styles.employeeChipText}>👤 {record.name}</Text>
        </View>
        <View style={styles.employeeChip}>
          <Text style={styles.employeeChipText}>🪪 {record.employeeId}</Text>
        </View>
      </View>

      <Animated.View style={[styles.expandedContainer, { height: expandHeight }]}>
        <View style={styles.separator} />

        <DetailRow
          icon="🗓"
          label="Marked At"
          value={formatTimestamp(record.timestamp)}
        />

        <DetailRow
          icon="📍"
          label="Coordinates"
          value={formatCoordinates(record.latitude, record.longitude)}
        />

        <DetailRow
          icon="📏"
          label="Distance from Office"
          value={formatDistance(record.distance)}
        />

        <DetailRow
          icon="🎯"
          label="GPS Accuracy"
          value={formatAccuracy(record.accuracy)}
        />

        <DetailRow
          icon="📋"
          label="Status"
          value={formatStatus(record.status)}
        />
      </Animated.View>
    </Animated.View>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function getStatusConfig(status) {
  const configs = {
    ALLOWED: {
      label: "✅ Marked",
      pillBackground: "#DCFCE7",
      pillText: "#15803D",
    },
    ACCURACY_WARNING: {
      label: "⚠️ Marked",
      pillBackground: "#FEF3C7",
      pillText: "#B45309",
    },
    OUTSIDE_RADIUS: {
      label: "❌ Outside",
      pillBackground: "#FEE2E2",
      pillText: "#B91C1C",
    },
    ACCURACY_POOR: {
      label: "❌ Poor GPS",
      pillBackground: "#FEE2E2",
      pillText: "#B91C1C",
    },
    LOCATION_UNAVAILABLE: {
      label: "❌ No Location",
      pillBackground: "#F3F4F6",
      pillText: "#6B7280",
    },
  };

  return (
    configs[status] || {
      label: "Unknown",
      pillBackground: "#F3F4F6",
      pillText: "#6B7280",
    }
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 8,
  },

  headerLeft: {
    flex: 1,
  },

  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },

  date: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },

  time: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },

  recordId: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: "monospace",
  },

  arrow: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  employeeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  recordTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },

  recordTypeBadgeCheckin: {
    backgroundColor: "#DCFCE7",
  },

  recordTypeBadgeCheckout: {
    backgroundColor: "#FEE2E2",
  },

  recordTypeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },

  recordTypeBadgeTextCheckin: {
    color: "#15803D",
  },

  recordTypeBadgeTextCheckout: {
    color: "#B91C1C",
  },

  employeeChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  employeeChipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },

  expandedContainer: {
    overflow: "hidden",
    paddingHorizontal: 16,
  },

  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },

  detailIcon: {
    fontSize: 14,
    marginTop: 1,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },

  detailValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
});

