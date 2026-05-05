import { useState, useEffect, useCallback, useRef } from "react";
import {
  requestLocationPermission,
  checkLocationPermission,
  watchLocation,
  stopWatchingLocation,
  getCurrentLocation,
} from "../../backend/services/locationService";
import { checkAttendanceEligibility } from "../../backend/services/geofenceService";
import { validateLocation } from "../../backend/utils/validators";

const INITIAL_STATE = {
  permissionGranted: false,
  permissionChecked: false,

  location: null,
  latitude: null,
  longitude: null,
  accuracy: null,

  distance: null,
  isEligible: false,
  attendanceStatus: null,
  statusMessage: "",

  isLoading: true,
  isRefreshing: false,
  error: null,
};

export function useLocation() {
  const [state, setState] = useState(INITIAL_STATE);

  const subscriberRef = useRef(null);

  const handleLocationUpdate = useCallback((result) => {
    if (!result.success || !result.location) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: result.error || "Failed to get location.",
      }));
      return;
    }

    const location = result.location;

    const validation = validateLocation(location);
    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: validation.error,
      }));
      return;
    }

    const eligibility = checkAttendanceEligibility(location);

    setState((prev) => ({
      ...prev,
      location,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      distance: eligibility.distance,
      isEligible: eligibility.isEligible,
      attendanceStatus: eligibility.status,
      statusMessage: eligibility.message,
      isLoading: false,
      isRefreshing: false,
      error: null,
    }));
  }, []);

  const handleWatchError = useCallback((errorMessage) => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isRefreshing: false,
      error: errorMessage,
    }));
  }, []);

  const startWatching = useCallback(async () => {
    stopWatchingLocation(subscriberRef.current);
    subscriberRef.current = null;

    const subscriber = await watchLocation(
      handleLocationUpdate,
      handleWatchError,
    );

    subscriberRef.current = subscriber;
  }, [handleLocationUpdate, handleWatchError]);

  useEffect(() => {
    let isMounted = true;

    async function initialise() {
      const { granted } = await requestLocationPermission();

      if (!isMounted) return;

      if (!granted) {
        setState((prev) => ({
          ...prev,
          permissionGranted: false,
          permissionChecked: true,
          isLoading: false,
          error:
            "Location permission denied. Please enable it in device settings.",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        permissionGranted: true,
        permissionChecked: true,
      }));

      await startWatching();
    }

    initialise();

    return () => {
      isMounted = false;
      stopWatchingLocation(subscriberRef.current);
      subscriberRef.current = null;
    };
  }, [startWatching]);

  const recheckPermission = useCallback(async () => {
    const { granted } = await checkLocationPermission();

    if (granted && !state.permissionGranted) {
      setState((prev) => ({
        ...prev,
        permissionGranted: true,
        isLoading: true,
        error: null,
      }));
      await startWatching();
    }
  }, [state.permissionGranted, startWatching]);

  const refresh = useCallback(async () => {
    if (!state.permissionGranted) return;

    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    const result = await getCurrentLocation();
    handleLocationUpdate(result);
  }, [state.permissionGranted, handleLocationUpdate]);

  // We fetch a one-time snapshot here so the check-in uses the freshest reading.
  const getFreshLocationForMarking = useCallback(async () => {
    const result = await getCurrentLocation();

    if (!result.success || !result.location) {
      return {
        success: false,
        location: null,
        eligibility: null,
        error: result.error,
      };
    }

    const eligibility = checkAttendanceEligibility(result.location);

    return {
      success: true,
      location: result.location,
      eligibility,
      error: null,
    };
  }, []);

  return {
    ...state,

    refresh,
    recheckPermission,
    getFreshLocationForMarking,
  };
}
