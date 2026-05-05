import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile } from "./userStorage";

const STORAGE_KEYS = {
  ATTENDANCE_RECORDS: "@attendance_app:attendance_records",
};

// Used by history UI to distinguish check-in vs check-out.
export const RECORD_TYPE = {
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
};

export async function saveAttendanceRecord(
  locationData,
  distance,
  status,
  recordType = RECORD_TYPE.CHECK_IN,
) {
  try {
    const { success: profileSuccess, profile } = await getUserProfile();

    if (!profileSuccess || !profile) {
      return {
        success: false,
        record: null,
        error: "User profile not found. Please complete onboarding.",
      };
    }

    const record = {
      id: `${Date.now()}_${profile.employeeId}`,
      name: profile.name,
      employeeId: profile.employeeId,
      timestamp: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      distance: distance,
      status: status,
      recordType,
    };

    const existing = await loadAllRecords();
    const updated = [record, ...existing];

    await AsyncStorage.setItem(
      STORAGE_KEYS.ATTENDANCE_RECORDS,
      JSON.stringify(updated),
    );

    return {
      success: true,
      record,
      error: null,
    };
  } catch (error) {
    console.error("[storageService] Failed to save record:", error);
    return {
      success: false,
      record: null,
      error: "Failed to save attendance. Please try again.",
    };
  }
}

export async function getAttendanceRecords() {
  try {
    const records = await loadAllRecords();
    return {
      success: true,
      records,
      error: null,
    };
  } catch (error) {
    console.error("[storageService] Failed to get records:", error);
    return {
      success: false,
      records: [],
      error: "Failed to load attendance history.",
    };
  }
}

export async function clearAttendanceRecords() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
    return { success: true, error: null };
  } catch (error) {
    console.error("[storageService] Failed to clear records:", error);
    return {
      success: false,
      error: "Failed to clear attendance records.",
    };
  }
}

export async function getAttendanceCount() {
  try {
    const records = await loadAllRecords();
    return records.length;
  } catch (error) {
    console.error("[storageService] Failed to get count:", error);
    return 0;
  }
}

async function loadAllRecords() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
  if (raw === null) return [];
  return JSON.parse(raw);
}
