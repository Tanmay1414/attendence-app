export const CENTER_LOCATION = {
  latitude: 28.6466,
  longitude: 77.2892,
  label:
    "Muthoot Finance Gold Loan, 1st Floor, A-20, Main Rd, Jagat Puri, Krishna Nagar, New Delhi, Delhi, 110051",
};

export const GEOFENCE_RADIUS_METERS = 500;
export const ACCURACY_THRESHOLD_METERS = 100;
export const ACCURACY_BUFFER_METERS = 10;

// We use a buffer on top of the threshold to avoid flickering near the boundary.
// e.g. if threshold is 100m, we only block when accuracy degrades past 110m,
// and only unblock when it recovers below 100m (hysteresis).
export const EFFECTIVE_ACCURACY_LIMIT =
  ACCURACY_THRESHOLD_METERS + ACCURACY_BUFFER_METERS;

export const LOCATION_TIMEOUT_MS = 10000;
export const MAX_LOCATION_AGE_MS = 5000;
export const WATCH_INTERVAL_MS = 3000;
