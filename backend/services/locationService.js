import * as Location from "expo-location";
import {
  LOCATION_TIMEOUT_MS,
  MAX_LOCATION_AGE_MS,
  WATCH_INTERVAL_MS,
} from "../constants/geofenceConfig";

export const PERMISSION_STATUS = {
  GRANTED: "granted",
  DENIED: "denied",
  UNDETERMINED: "undetermined",
};

export async function requestLocationPermission() {
  try {
    const { status, canAskAgain } =
      await Location.requestForegroundPermissionsAsync();

    return {
      granted: status === PERMISSION_STATUS.GRANTED,
      status,
      canAskAgain,
    };
  } catch (error) {
    console.error("[locationService] Permission request failed:", error);
    return {
      granted: false,
      status: PERMISSION_STATUS.DENIED,
      canAskAgain: false,
    };
  }
}

export async function checkLocationPermission() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === PERMISSION_STATUS.GRANTED,
      status,
    };
  } catch (error) {
    console.error("[locationService] Permission check failed:", error);
    return {
      granted: false,
      status: PERMISSION_STATUS.DENIED,
    };
  }
}

export async function getCurrentLocation() {
  try {
    const { granted } = await checkLocationPermission();
    if (!granted) {
      return {
        success: false,
        location: null,
        error: "Location permission not granted.",
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      timeInterval: WATCH_INTERVAL_MS,
      maximumAge: MAX_LOCATION_AGE_MS,
      timeout: LOCATION_TIMEOUT_MS,
    });

    return {
      success: true,
      location,
      error: null,
    };
  } catch (error) {
    console.error("[locationService] Failed to get location:", error);

    const errorMessage = resolveLocationError(error);
    return {
      success: false,
      location: null,
      error: errorMessage,
    };
  }
}

export async function watchLocation(onLocationUpdate, onError) {
  try {
    const { granted } = await checkLocationPermission();
    if (!granted) {
      onError("Location permission not granted.");
      return null;
    }

    const subscriber = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: WATCH_INTERVAL_MS,
        distanceInterval: 1,
      },
      (location) => {
        onLocationUpdate({
          success: true,
          location,
          error: null,
        });
      },
    );

    return subscriber;
  } catch (error) {
    console.error("[locationService] Watcher failed:", error);
    const errorMessage = resolveLocationError(error);
    onError(errorMessage);
    return null;
  }
}

export function stopWatchingLocation(subscriber) {
  if (subscriber) {
    subscriber.remove();
  }
}

function resolveLocationError(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("timeout")) {
    return "Location request timed out. Please ensure GPS is enabled and try again.";
  }
  if (message.includes("unavailable") || message.includes("disabled")) {
    return "Location services are disabled. Please enable GPS in your device settings.";
  }
  if (message.includes("permission")) {
    return "Location permission was revoked. Please grant permission in settings.";
  }

  return "Unable to retrieve location. Please try again.";
}
