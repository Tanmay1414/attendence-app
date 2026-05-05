import React, { useEffect } from "react";
import { StatusBar, Platform, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./frontend/navigation/AppNavigator";

// Suppress known harmless warnings from third-party libraries
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "expo-location: background location",
  "AsyncStorage has been extracted",
]);

export default function App() {
  useEffect(() => {
    // Place global side effects here if needed
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content" // dark icons on light background
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
