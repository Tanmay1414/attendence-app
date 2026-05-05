import { distanceFromCenter } from "../utils/distanceCalculator";
import {
  GEOFENCE_RADIUS_METERS,
  ACCURACY_THRESHOLD_METERS,
  EFFECTIVE_ACCURACY_LIMIT,
} from "../constants/geofenceConfig";

export const ATTENDANCE_STATUS = {
  ALLOWED: "ALLOWED",
  OUTSIDE_RADIUS: "OUTSIDE_RADIUS",
  ACCURACY_POOR: "ACCURACY_POOR",
  ACCURACY_WARNING: "ACCURACY_WARNING",
  LOCATION_UNAVAILABLE: "LOCATION_UNAVAILABLE",
};

export const ATTENDANCE_MESSAGES = {
  [ATTENDANCE_STATUS.ALLOWED]:
    "You are inside the office zone. You may mark attendance.",
  [ATTENDANCE_STATUS.OUTSIDE_RADIUS]:
    "You are outside the allowed zone. Please move closer to the office.",
  [ATTENDANCE_STATUS.ACCURACY_POOR]:
    "GPS accuracy is too low to verify your location. Please move to an open area and try again.",
  [ATTENDANCE_STATUS.ACCURACY_WARNING]:
    "GPS accuracy is borderline. Attendance is allowed but location may not be precise.",
  [ATTENDANCE_STATUS.LOCATION_UNAVAILABLE]:
    "Location data is unavailable. Please enable GPS and try again.",
};

export function checkAttendanceEligibility(location) {
  if (!location || !location.coords) {
    return buildResult(ATTENDANCE_STATUS.LOCATION_UNAVAILABLE, null, null);
  }

  const { latitude, longitude, accuracy } = location.coords;

  const distance = distanceFromCenter(latitude, longitude);

  // Expo accuracy is a radius-of-uncertainty in meters (bigger = worse).
  if (accuracy > EFFECTIVE_ACCURACY_LIMIT) {
    return buildResult(ATTENDANCE_STATUS.ACCURACY_POOR, distance, accuracy);
  }

  if (accuracy > ACCURACY_THRESHOLD_METERS) {
    if (distance > GEOFENCE_RADIUS_METERS) {
      return buildResult(ATTENDANCE_STATUS.OUTSIDE_RADIUS, distance, accuracy);
    }
    return buildResult(ATTENDANCE_STATUS.ACCURACY_WARNING, distance, accuracy);
  }

  if (distance > GEOFENCE_RADIUS_METERS) {
    return buildResult(ATTENDANCE_STATUS.OUTSIDE_RADIUS, distance, accuracy);
  }

  return buildResult(ATTENDANCE_STATUS.ALLOWED, distance, accuracy);
}

function buildResult(status, distance, accuracy) {
  return {
    status,
    message: ATTENDANCE_MESSAGES[status],
    distance,
    accuracy,
    isEligible:
      status === ATTENDANCE_STATUS.ALLOWED ||
      status === ATTENDANCE_STATUS.ACCURACY_WARNING,
  };
}
