import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  formatCoordinate,
  formatDistance,
  formatAccuracy,
  formatAccuracyLabel,
} from "../../backend/utils/formatters";
import {
  GEOFENCE_RADIUS_METERS,
  ACCURACY_THRESHOLD_METERS,
} from "../../backend/constants/geofenceConfig";
export default function LocationCard({
  latitude,
  longitude,
  accuracy,
  distance,
  isLoading,
}) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Your Location</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching GPS location...</Text>
        </View>
      </View>
    );
  }

  const accuracyColor = getAccuracyColor(accuracy);
  const accuracyLabel = formatAccuracyLabel(accuracy);

  const distanceColor = getDistanceColor(distance);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📍 Your Location</Text>

      <View style={styles.row}>
        <View style={styles.dataBlock}>
          <Text style={styles.label}>Latitude</Text>
          <Text style={styles.value}>
            {latitude !== null ? formatCoordinate(latitude) : "--"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.dataBlock}>
          <Text style={styles.label}>Longitude</Text>
          <Text style={styles.value}>
            {longitude !== null ? formatCoordinate(longitude) : "--"}
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.row}>
        <View style={styles.dataBlock}>
          <Text style={styles.label}>GPS Accuracy</Text>
          <Text style={[styles.value, { color: accuracyColor }]}>
            {formatAccuracy(accuracy)}
          </Text>
          <Text style={[styles.subLabel, { color: accuracyColor }]}>
            {accuracyLabel}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.dataBlock}>
          <Text style={styles.label}>Distance from Office</Text>
          <Text style={[styles.value, { color: distanceColor }]}>
            {formatDistance(distance)}
          </Text>
          <Text style={styles.subLabel}>
            Radius: {GEOFENCE_RADIUS_METERS} m
          </Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.thresholdRow}>
        <Text style={styles.thresholdText}>
          ℹ️ Accuracy threshold:{" "}
          <Text style={styles.thresholdValue}>
            ± {ACCURACY_THRESHOLD_METERS} m
          </Text>
          {"  "}|{"  "}
          Allowed radius:{" "}
          <Text style={styles.thresholdValue}>{GEOFENCE_RADIUS_METERS} m</Text>
        </Text>
      </View>
    </View>
  );
}

function getAccuracyColor(accuracy) {
  if (accuracy === null || accuracy === undefined) return "#6B7280";
  if (accuracy <= 10) return "#16A34A";
  if (accuracy <= 25) return "#65A30D";
  if (accuracy <= 50) return "#D97706";
  return "#DC2626";
}

function getDistanceColor(distance) {
  if (distance === null || distance === undefined) return "#6B7280";
  if (distance <= 50) return "#16A34A";
  if (distance <= 100) return "#D97706";
  return "#DC2626";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },

  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  dataBlock: {
    flex: 1,
    alignItems: "center",
  },

  divider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    alignSelf: "stretch",
  },

  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: "center",
  },

  value: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  subLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },

  thresholdRow: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },

  thresholdText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },

  thresholdValue: {
    fontWeight: "700",
    color: "#374151",
  },
});
