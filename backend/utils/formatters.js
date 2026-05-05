export function formatTimestamp(isoString) {
  if (!isoString) return "Unknown time";

  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    console.error("[formatters] formatTimestamp error:", error);
    return "Unknown time";
  }
}

export function formatTimeOnly(isoString) {
  if (!isoString) return "--:--";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "--:--";

    return date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    return "--:--";
  }
}

export function formatDateOnly(isoString) {
  if (!isoString) return "Unknown date";

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch (error) {
    return "Unknown date";
  }
}

export function formatDistance(meters) {
  if (meters === null || meters === undefined) return "-- m";

  if (typeof meters !== "number" || isNaN(meters)) return "-- m";

  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatAccuracy(meters) {
  if (meters === null || meters === undefined) return "± -- m";
  if (typeof meters !== "number" || isNaN(meters)) return "± -- m";

  return `± ${meters.toFixed(1)} m`;
}

export function formatAccuracyLabel(meters) {
  if (meters === null || meters === undefined) return "Unknown";

  if (meters <= 10) return "Excellent";
  if (meters <= 25) return "Good";
  if (meters <= 50) return "Fair";
  return "Poor";
}

export function formatCoordinate(value) {
  if (value === null || value === undefined) return "--°";
  if (typeof value !== "number" || isNaN(value)) return "--°";

  return `${value.toFixed(6)}°`;
}

export function formatCoordinates(latitude, longitude) {
  return `${formatCoordinate(latitude)}, ${formatCoordinate(longitude)}`;
}

export function formatStatus(status) {
  const STATUS_LABELS = {
    ALLOWED: "✅ Marked",
    ACCURACY_WARNING: "⚠️ Marked (Low Accuracy)",
    OUTSIDE_RADIUS: "❌ Outside Zone",
    ACCURACY_POOR: "❌ Poor GPS",
    LOCATION_UNAVAILABLE: "❌ No Location",
  };

  return STATUS_LABELS[status] || "Unknown";
}

export function formatRecordId(id) {
  if (!id) return "REC-UNKNOWN";
  const base = id.split("_")[0];
  return `REC-${base}`;
}

export function formatRecordType(recordType) {
  const labels = {
    CHECK_IN: " Check In",
    CHECK_OUT: " Check Out",
  };

  return labels[recordType] || labels.CHECK_IN;
}
