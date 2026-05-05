import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocation } from "../hooks/useLocation";
import LocationCard from "../components/LocationCard";
import StatusBadge from "../components/StatusBadge";
import {
  saveAttendanceRecord,
  RECORD_TYPE,
} from "../../backend/storage/storageService";
import {
  getUserProfile,
  clearUserProfile,
} from "../../backend/storage/userStorage";
import { ATTENDANCE_STATUS } from "../../backend/services/geofenceService";
import { formatTimestamp } from "../../backend/utils/formatters";
export default function HomeScreen({ navigation }) {
  const {
    latitude,
    longitude,
    accuracy,
    distance,
    isEligible,
    attendanceStatus,
    statusMessage,
    isLoading,
    isRefreshing,
    error,
    permissionGranted,
    permissionChecked,
    refresh,
    recheckPermission,
    getFreshLocationForMarking,
  } = useLocation();

  const [userProfile, setUserProfile] = useState(null);
  const [isMarking, setIsMarking] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastRecord, setLastRecord] = useState(null);
  const [markSuccess, setMarkSuccess] = useState(false);
  const [successType, setSuccessType] = useState(RECORD_TYPE.CHECK_IN);

  const successAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      recheckPermission();
    }, []),
  );

  const loadUserProfile = async () => {
    const { success, profile } = await getUserProfile();
    if (success && profile) {
      setUserProfile(profile);
    }
  };

  const playSuccessAnimation = (type = RECORD_TYPE.CHECK_IN) => {
    setMarkSuccess(true);
    setSuccessType(type);
    successAnim.setValue(0);

    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setMarkSuccess(false));
  };

  const replaceToOnboarding = () => {
    const rootNav =
      navigation?.getParent?.()?.getParent?.() ??
      navigation?.getParent?.() ??
      navigation;

    if (typeof rootNav?.replace === "function") {
      rootNav.replace("Onboarding");
      return;
    }

    rootNav?.navigate?.("Onboarding");
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMarkAttendance = async () => {
    if (isMarking || !isEligible) return;

    animateButtonPress();
    setIsMarking(true);

    try {
      const {
        success,
        location,
        eligibility,
        error: locationError,
      } = await getFreshLocationForMarking();

      if (!success || !location) {
        Alert.alert(
          "Location Error",
          locationError || "Failed to get current location. Please try again.",
          [{ text: "OK" }],
        );
        return;
      }

      // Edge case: user was inside but moved outside in the last few seconds.
      if (!eligibility.isEligible) {
        Alert.alert("Cannot Mark Attendance", eligibility.message, [
          { text: "OK" },
        ]);
        return;
      }

      const {
        success: saveSuccess,
        record,
        error: saveError,
      } = await saveAttendanceRecord(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
        eligibility.distance,
        eligibility.status,
        RECORD_TYPE.CHECK_IN,
      );

      if (!saveSuccess) {
        Alert.alert(
          "Save Failed",
          saveError || "Failed to save attendance. Please try again.",
          [{ text: "OK" }],
        );
        return;
      }

      setLastRecord(record);
      playSuccessAnimation(RECORD_TYPE.CHECK_IN);
    } catch (error) {
      console.error("[HomeScreen] Mark attendance error:", error);
      Alert.alert(
        "Unexpected Error",
        "Something went wrong. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setIsMarking(false);
    }
  };

  const handleCheckOut = () => {
    if (isCheckingOut) return;

    Alert.alert(
      "Check Out",
      "This will save a checkout record and take you back to the employee details screen. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check Out",
          style: "destructive",
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              const { success, location, eligibility } =
                await getFreshLocationForMarking();

              const locationData =
                success && location
                  ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      accuracy: location.coords.accuracy,
                    }
                  : {
                      latitude: latitude ?? 0,
                      longitude: longitude ?? 0,
                      accuracy: accuracy ?? 0,
                    };

              const distanceVal = eligibility?.distance ?? distance ?? 0;
              const statusVal =
                eligibility?.status ??
                attendanceStatus ??
                ATTENDANCE_STATUS.LOCATION_UNAVAILABLE;

              await saveAttendanceRecord(
                locationData,
                distanceVal,
                statusVal,
                RECORD_TYPE.CHECK_OUT,
              );

              await clearUserProfile();
              replaceToOnboarding();
            } catch (err) {
              console.error("[HomeScreen] Check out error:", err);
              Alert.alert("Error", "Checkout failed. Please try again.", [
                { text: "OK" },
              ]);
            } finally {
              setIsCheckingOut(false);
            }
          },
        },
      ],
    );
  };

  if (permissionChecked && !permissionGranted) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.permissionEmoji}>📍</Text>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionMessage}>
          This app needs location permission to verify you are inside the office
          zone before marking attendance.
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          }}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={recheckPermission}
        >
          <Text style={styles.retryButtonText}>I've granted permission →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor="#4F46E5"
            colors={["#4F46E5"]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              👋 Hello, {userProfile?.name?.split(" ")[0] || "there"}
            </Text>
            <Text style={styles.employeeId}>
              🪪 {userProfile?.employeeId || "---"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>

            <TouchableOpacity
              style={styles.checkoutHeaderButton}
              onPress={handleCheckOut}
              disabled={isCheckingOut}
              activeOpacity={0.85}
            >
              {isCheckingOut ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.checkoutHeaderButtonText}>🔴 Check Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error && !isLoading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.errorBannerRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <StatusBadge
          status={attendanceStatus}
          message={statusMessage}
          isLoading={isLoading}
        />

        <LocationCard
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          distance={distance}
          isLoading={isLoading}
        />

        {markSuccess && (
          <Animated.View
            style={[
              styles.successBanner,
              successType === RECORD_TYPE.CHECK_OUT
                ? styles.successBannerCheckout
                : styles.successBannerCheckin,
              { opacity: successAnim },
            ]}
          >
            <Text style={styles.successBannerText}>
              {successType === RECORD_TYPE.CHECK_OUT
                ? "🔴 Checked out successfully!"
                : "✅ Attendance marked successfully!"}
            </Text>
            {lastRecord && (
              <Text style={styles.successBannerTime}>
                {formatTimestamp(lastRecord.timestamp)}
              </Text>
            )}
          </Animated.View>
        )}

        {lastRecord && !markSuccess && (
          <View style={styles.lastRecordCard}>
            <Text style={styles.lastRecordTitle}>🕐 Last Marked</Text>
            <Text style={styles.lastRecordTime}>
              {formatTimestamp(lastRecord.timestamp)}
            </Text>
            <Text style={styles.lastRecordCoords}>
              📍 {lastRecord.latitude.toFixed(6)}°,{" "}
              {lastRecord.longitude.toFixed(6)}°
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.markButton,
                !isEligible && !isLoading ? styles.markButtonDisabled : null,
                isMarking ? styles.markButtonMarking : null,
              ]}
              onPress={handleMarkAttendance}
              disabled={!isEligible || isMarking || isLoading}
              activeOpacity={0.9}
            >
              {isMarking ? (
                <View style={styles.markButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.markButtonText}>Marking...</Text>
                </View>
              ) : (
                <View style={styles.markButtonContent}>
                  <Text style={styles.markButtonEmoji}>
                    {isEligible ? "✅" : "🚫"}
                  </Text>
                  <Text style={styles.markButtonText}>
                    {isLoading
                      ? "Getting Location..."
                      : isEligible
                        ? "Check In"
                        : "Cannot Mark Attendance"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {!isLoading && !isEligible && attendanceStatus && (
            <Text style={styles.buttonHelperText}>
              {getButtonHelperText(attendanceStatus)}
            </Text>
          )}

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckOut}
            disabled={isCheckingOut}
            activeOpacity={0.9}
          >
            {isCheckingOut ? (
              <View style={styles.checkoutButtonContent}>
                <ActivityIndicator size="small" color="#DC2626" />
                <Text style={styles.checkoutButtonText}>Checking out...</Text>
              </View>
            ) : (
              <View style={styles.checkoutButtonContent}>
                <Text style={styles.checkoutButtonEmoji}>🔴</Text>
                <Text style={styles.checkoutButtonText}>Check Out</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

function getButtonHelperText(status) {
  const hints = {
    [ATTENDANCE_STATUS.OUTSIDE_RADIUS]:
      "Move inside the office zone to enable this button.",
    [ATTENDANCE_STATUS.ACCURACY_POOR]:
      "Move to an open area to improve GPS accuracy.",
    [ATTENDANCE_STATUS.LOCATION_UNAVAILABLE]:
      "Enable GPS in your device settings.",
  };
  return hints[status] || "";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },

  employeeId: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  headerRight: {
    alignItems: "flex-end",
  },

  dateText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  checkoutHeaderButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },

  checkoutHeaderButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },

  errorBanner: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  errorBannerText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },

  errorBannerRetry: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "700",
    marginLeft: 8,
  },

  successBanner: {
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },

  successBannerCheckin: {
    backgroundColor: "#F0FDF4",
    borderLeftColor: "#22C55E",
  },

  successBannerCheckout: {
    backgroundColor: "#FFF1F2",
    borderLeftColor: "#DC2626",
  },

  successBannerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  successBannerTime: {
    fontSize: 12,
    color: "#6B7280",
  },

  lastRecordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4F46E5",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  lastRecordTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  lastRecordTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  lastRecordCoords: {
    fontSize: 12,
    color: "#6B7280",
  },

  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
  },

  markButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: "center",
    minWidth: 280,

    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  markButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },

  markButtonMarking: {
    backgroundColor: "#6366F1",
    shadowOpacity: 0.2,
  },

  markButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  markButtonEmoji: {
    fontSize: 20,
  },

  markButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  buttonHelperText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  checkoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    minWidth: 280,
    borderWidth: 2,
    borderColor: "#DC2626",
    marginTop: 14,
  },

  checkoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkoutButtonEmoji: {
    fontSize: 18,
  },

  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.3,
  },

  centeredScreen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  permissionEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },

  permissionMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  settingsButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,

    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  settingsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  retryButton: {
    padding: 12,
  },

  retryButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },

  bottomPadding: {
    height: 20,
  },
});
