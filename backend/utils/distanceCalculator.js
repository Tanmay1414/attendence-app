import { CENTER_LOCATION } from "../constants/geofenceConfig";

const EARTH_RADIUS_METERS = 6_371_000;

// Haversine formula — accurate enough for short distances (<1km)
// and simpler than alternatives like Vincenty
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((EARTH_RADIUS_METERS * c).toFixed(2));
}

export function distanceFromCenter(userLat, userLon) {
  return haversineDistance(
    userLat,
    userLon,
    CENTER_LOCATION.latitude,
    CENTER_LOCATION.longitude,
  );
}
