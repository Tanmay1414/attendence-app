# AttendanceApp — Geo-Fenced Attendance System

A React Native mobile application built with Expo that allows employees to mark attendance only when physically present within a defined geographic boundary.

## Download APK

[Download Latest APK](https://expo.dev/artifacts/eas/nqxjq5QcSFqPQNbPiyeinE.apk)

## Setup Instructions

### Prerequisites

- Node.js (v18 or above)
- Expo Go app installed on your Android device
- npm

### Installation

```bash
git clone https://github.com/Tanmay1414/attendence-app.git
cd attendence-app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Project Structure

```
attendence-app/
├── App.js
├── frontend/
│   ├── screens/
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   └── HistoryScreen.js
│   ├── components/
│   │   ├── LocationCard.js
│   │   ├── StatusBadge.js
│   │   └── AttendanceRecord.js
│   ├── hooks/
│   │   └── useLocation.js
│   └── navigation/
│       └── AppNavigator.js
└── backend/
    ├── constants/
    │   └── geofenceConfig.js
    ├── utils/
    │   ├── distanceCalculator.js
    │   ├── formatters.js
    │   └── validators.js
    ├── services/
    │   ├── geofenceService.js
    │   └── locationService.js
    └── storage/
        ├── userStorage.js
        └── storageService.js
```

## Assumptions Made

- One user per device — onboarding is done once and profile is stored locally.
- The office location is hardcoded (SLS DAV Public School, Mausam Vihar, Delhi).
- Checkout is allowed from anywhere — employee may already be leaving the building when they check out.
- Internet is not required — all data is stored locally using AsyncStorage.

## Geo-Fencing Logic

The app defines a fixed center point (office location) and a radius. On every GPS update, it calculates the straight-line distance between the user and the center using the Haversine formula. If the distance is within the allowed radius AND GPS accuracy is acceptable, the user is allowed to mark attendance.

```
User Location (lat, lng)
│
▼
Haversine Distance Calculation
│
▼
distance < GEOFENCE_RADIUS (200m)?
│
Yes  │  No
│   └── OUTSIDE_RADIUS ❌
▼
accuracy acceptable?
│
Yes  │  No
│   └── ACCURACY_POOR ❌
▼
ALLOWED ✅
```

## Distance Calculation

The app uses the **Haversine formula** to calculate the distance between two GPS coordinates on Earth's surface.

Simple latitude/longitude subtraction does not account for Earth's curvature and becomes inaccurate even at short distances. The Haversine formula treats Earth as a sphere and calculates the great-circle distance between two points, which is accurate to within ~0.3% for the distances involved in this use case (under 1km).

```javascript
const a =
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = EARTH_RADIUS_METERS * c;
```

## Accuracy Threshold and Edge Case Decision

### Threshold

GPS accuracy is defined as the radius of uncertainty in meters. A reading of `accuracy = 30` means the user could be anywhere within a 30m circle. Given our geofence radius is 200m, the accuracy threshold is **100 meters**.

### Edge Case — Fluctuation near the boundary

**Problem:** If the threshold is 100m and the device reports 98m one second and 105m the next, the app flickers between allowed and blocked states — confusing the user.

**Solution — Hysteresis approach:**

- Attendance is blocked only when accuracy degrades past **110m** (threshold + 10m buffer)
- Once blocked, it stays blocked until accuracy recovers below **100m**
- This one-way gate eliminates flickering at the boundary

**Trade-off:** The app is slightly more lenient near the boundary (allows up to 110m in the buffer zone with a warning), but the user experience is stable and predictable.

```
accuracy <= 100m  → ALLOWED ✅
accuracy 101-110m → ACCURACY_WARNING ⚠️ (allowed with warning)
accuracy > 110m   → ACCURACY_POOR ❌ (hard block)
```

## Features

- **Onboarding** — collects name and employee ID, stored locally
- **Live GPS tracking** — updates every 3 seconds
- **Geofence check** — real-time inside/outside status
- **Check In** — marks attendance with timestamp, coordinates, accuracy
- **Check Out** — saves checkout record and returns to login screen
- **Attendance History** — grouped by date, expandable records
- **Pull to refresh** — manual GPS refresh on both screens
- **Permission handling** — graceful UI for denied location permission
- **GPS accuracy display** — color coded (Excellent / Good / Fair / Poor)

## Known Limitations

- No backend/server — all data is stored on device only. Records are lost if app is uninstalled.
- Single user per device — no multi-user support.
- No offline map — center location is hardcoded, not configurable from UI.
- History cannot be exported — no PDF or CSV export.
- No duplicate check — user can mark attendance multiple times in the same day.

## One Improvement With More Time

I would add a **backend API with a database** (e.g. Firebase or a Node.js + PostgreSQL server) to:

- Sync attendance records across devices
- Allow admins to view all employee records in a dashboard
- Prevent duplicate check-ins on the same day with server-side validation
- Send push notifications for missed check-ins

This would transform the app from a local prototype into a production-ready system.
