
import React, { useState, useEffect, useRef } from "react";
import {View,Text,StyleSheet,Animated,ActivityIndicator} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { hasUserProfile } from "../../backend/storage/userStorage";
import { getAttendanceCount } from "../../backend/storage/storageService";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import HistoryScreen from "../screens/HistoryScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    loadCount();
  }, []);

  const loadCount = async () => {
    const count = await getAttendanceCount();
    setRecordCount(count);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,

          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,

          elevation: 8,
        },

        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },

        headerStyle: {
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },

        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#111827",
        },

        headerTintColor: "#4F46E5",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Attendance",
          headerTitle: "📍 Mark Attendance",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="🏠" focused={focused} color={color} />
          ),
          tabBarLabel: "Home",
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: "History",
          headerTitle: "📋 Attendance History",
          headerShown: false, // HistoryScreen has its own top bar
          tabBarIcon: ({ focused, color }) => (
            <TabIcon emoji="📋" focused={focused} color={color} />
          ),
          tabBarLabel: "History",
          tabBarBadge: recordCount > 0 ? recordCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#4F46E5",
            fontSize: 10,
            fontWeight: "700",
          },
        }}
        listeners={{
          tabPress: () => {
            loadCount();
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null); // "Onboarding" | "MainTabs"

  const splashFade = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initialisApp();
  }, []);

  const initialisApp = async () => {
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    const [profileExists] = await Promise.all([
      hasUserProfile(),
      new Promise((resolve) => setTimeout(resolve, 1500)), // min splash time
    ]);

    setInitialRoute(profileExists ? "MainTabs" : "Onboarding");

    Animated.parallel([
      Animated.timing(splashFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(splashScale, {
        toValue: 1.1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsReady(true);
    });
  };

  if (!isReady) {
    return (
      <Animated.View
        style={[
          styles.splashContainer,
          {
            opacity: splashFade,
            transform: [{ scale: splashScale }],
          },
        ]}
      >
        {/* Logo */}
        <Animated.View
          style={{
            transform: [
              {
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
            opacity: logoAnim,
          }}
        >
          <Text style={styles.splashEmoji}>📍</Text>
          <Text style={styles.splashTitle}>AttendApp</Text>
          <Text style={styles.splashSubtitle}>Geo-Fenced Attendance</Text>
        </Animated.View>

        {/* Loading indicator */}
        <ActivityIndicator
          size="small"
          color="#A5B4FC"
          style={styles.splashLoader}
        />
      </Animated.View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animationEnabled: true,
          cardStyleInterpolator: cardStyleInterpolator,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TabIcon({ emoji, focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.Text
      style={[styles.tabIcon, { transform: [{ scale: scaleAnim }] }]}
    >
      {emoji}
    </Animated.Text>
  );
}

function cardStyleInterpolator({ current, layouts }) {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width * 0.1, 0],
          }),
        },
      ],
    },
  };
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },

  splashEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: 16,
  },

  splashTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
  },

  splashSubtitle: {
    fontSize: 14,
    color: "#A5B4FC",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  splashLoader: {
    position: "absolute",
    bottom: 60,
  },

  tabIcon: {
    fontSize: 22,
  },
});
