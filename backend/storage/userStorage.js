import AsyncStorage from "@react-native-async-storage/async-storage";
import { validateUserProfile } from "../utils/validators";

const STORAGE_KEYS = {
  USER_PROFILE: "@attendance_app:user_profile",
};

export async function saveUserProfile(name, employeeId) {
  const validation = validateUserProfile(name, employeeId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const profile = {
      name: name.trim(),
      employeeId: employeeId.trim(),
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(profile),
    );

    return { success: true, error: null };
  } catch (error) {
    console.error("[userStorage] Failed to save profile:", error);
    return {
      success: false,
      error: "Failed to save profile. Please try again.",
    };
  }
}

export async function getUserProfile() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);

    if (raw === null) {
      return {
        success: true,
        profile: null,
        error: null,
      };
    }

    const profile = JSON.parse(raw);
    return {
      success: true,
      profile,
      error: null,
    };
  } catch (error) {
    console.error("[userStorage] Failed to get profile:", error);
    return {
      success: false,
      profile: null,
      error: "Failed to load user profile.",
    };
  }
}

export async function hasUserProfile() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw !== null;
  } catch (error) {
    console.error("[userStorage] Profile check failed:", error);
    return false;
  }
}

export async function clearUserProfile() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    return { success: true, error: null };
  } catch (error) {
    console.error("[userStorage] Failed to clear profile:", error);
    return {
      success: false,
      error: "Failed to clear profile.",
    };
  }
}
