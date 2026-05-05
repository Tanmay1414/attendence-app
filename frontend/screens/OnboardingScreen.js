import React, { useState, useRef } from "react";
import {View,Text,TextInput,  TouchableOpacity,  StyleSheet, ScrollView,  Animated,  KeyboardAvoidingView,  Platform,
  ActivityIndicator,
} from "react-native";
import { saveUserProfile } from "../../backend/storage/userStorage";
import { validateUserProfile } from "../../backend/utils/validators";
export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [nameError, setNameError] = useState(null);
  const [employeeIdError, setEmployeeIdError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const employeeIdRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateNameField = () => {
    validateUserProfile(name, "placeholder");
    if (!name.trim()) {
      setNameError("Name cannot be empty.");
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
    } else {
      setNameError(null);
    }
  };

  const validateEmployeeIdField = () => {
    if (!employeeId.trim()) {
      setEmployeeIdError("Employee ID cannot be empty.");
    } else if (employeeId.trim().length < 3) {
      setEmployeeIdError("Employee ID must be at least 3 characters.");
    } else {
      setEmployeeIdError(null);
    }
  };

  const handleSubmit = async () => {
    setNameError(null);
    setEmployeeIdError(null);
    setGeneralError(null);

    const validation = validateUserProfile(name, employeeId);
    if (!validation.valid) {
      triggerShake();

      const errorMsg = validation.error.toLowerCase();
      if (errorMsg.includes("name")) {
        setNameError(validation.error);
      } else {
        setEmployeeIdError(validation.error);
      }
      return;
    }

    setIsLoading(true);
    const result = await saveUserProfile(name, employeeId);
    setIsLoading(false);

    if (!result.success) {
      setGeneralError(result.error);
      triggerShake();
      return;
    }

    navigation.replace("MainTabs");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.heroEmoji}>🏢</Text>
          <Text style={styles.heroTitle}>Welcome</Text>
          <Text style={styles.heroSubtitle}>
            Set up your profile to start marking attendance
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <Text style={styles.cardTitle}>Your Details</Text>
          <Text style={styles.cardSubtitle}>
            This information will be saved with each attendance record.
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(null);
              }}
              onBlur={validateNameField}
              returnKeyType="next"
              onSubmitEditing={() => employeeIdRef.current?.focus()}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
            {nameError ? (
              <Text style={styles.errorText}>⚠ {nameError}</Text>
            ) : null}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Employee ID</Text>
            <TextInput
              ref={employeeIdRef}
              style={[styles.input, employeeIdError ? styles.inputError : null]}
              placeholder="e.g. EMP001"
              placeholderTextColor="#9CA3AF"
              value={employeeId}
              onChangeText={(text) => {
                setEmployeeId(text.toUpperCase());
                if (employeeIdError) setEmployeeIdError(null);
              }}
              onBlur={validateEmployeeIdField}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
            {employeeIdError ? (
              <Text style={styles.errorText}>⚠ {employeeIdError}</Text>
            ) : null}
          </View>

          {generalError ? (
            <View style={styles.generalErrorBox}>
              <Text style={styles.generalErrorText}>❌ {generalError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading ? styles.submitButtonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Get Started →</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.privacyNote, { opacity: fadeAnim }]}>
          <Text style={styles.privacyText}>
            🔒 Your data is stored locally on this device only.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 4,
  },

  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 20,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },

  inputError: {
    borderColor: "#F87171",
    backgroundColor: "#FFF5F5",
  },

  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 6,
    marginLeft: 4,
  },

  generalErrorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  generalErrorText: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
  },

  submitButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,

    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  submitButtonDisabled: {
    backgroundColor: "#A5B4FC",
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  privacyNote: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 24,
  },

  privacyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
