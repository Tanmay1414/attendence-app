export function validateName(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: "Name cannot be empty." };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters." };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "Name must not exceed 50 characters." };
  }

  const nameRegex = /^[a-zA-Z\s.\-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Name can only contain letters, spaces, dots, or hyphens.",
    };
  }

  return { valid: true, error: null };
}

export function validateEmployeeId(employeeId) {
  if (!employeeId || !employeeId.trim()) {
    return { valid: false, error: "Employee ID cannot be empty." };
  }

  const trimmed = employeeId.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: "Employee ID must be at least 3 characters.",
    };
  }

  if (trimmed.length > 20) {
    return {
      valid: false,
      error: "Employee ID must not exceed 20 characters.",
    };
  }

  const idRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!idRegex.test(trimmed)) {
    return {
      valid: false,
      error:
        "Employee ID can only contain letters, numbers, hyphens, or underscores.",
    };
  }

  return { valid: true, error: null };
}

export function validateUserProfile(name, employeeId) {
  const nameResult = validateName(name);
  if (!nameResult.valid) return nameResult;

  const idResult = validateEmployeeId(employeeId);
  if (!idResult.valid) return idResult;

  return { valid: true, error: null };
}

export function validateLocation(location) {
  if (!location) {
    return { valid: false, error: "Location data is missing." };
  }

  if (!location.coords) {
    return { valid: false, error: "Location coordinates are missing." };
  }

  const { latitude, longitude, accuracy } = location.coords;

  if (typeof latitude !== "number" || isNaN(latitude)) {
    return { valid: false, error: "Invalid latitude value." };
  }

  if (typeof longitude !== "number" || isNaN(longitude)) {
    return { valid: false, error: "Invalid longitude value." };
  }

  if (typeof accuracy !== "number" || isNaN(accuracy) || accuracy < 0) {
    return { valid: false, error: "Invalid GPS accuracy value." };
  }

  return { valid: true, error: null };
}
