/**
 * Patient Registration Validation Rules & Constraints (HMS)
 * Strict Pakistani Hospital Standard Validations
 */

export interface PatientFormInputs {
  name: string;
  phone: string;
  age: string | number;
  gender: string;
  cnic?: string;
}

export interface PatientValidationErrors {
  name?: string;
  phone?: string;
  age?: string;
  gender?: string;
  cnic?: string;
  general?: string;
}

/**
 * Validates patient full legal name:
 * - Cannot start with space, number, or special character.
 * - Must start with an alphabet letter [a-zA-Z].
 * - Can contain alphabet letters, single spaces between words, dots, and hyphens.
 * - Cannot contain numbers or special symbols.
 * - Must be at least 2 characters and at most 70 characters.
 */
export function validatePatientName(name: string): string | null {
  if (!name || name.length === 0) {
    return "Patient full legal name is required.";
  }

  if (/^\s/.test(name)) {
    return "Name cannot start with a space.";
  }

  if (/^[0-9]/.test(name)) {
    return "Name cannot start with a number. Must start with a letter (A-Z).";
  }

  if (/^[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?`~-]/.test(name)) {
    return "Name cannot start with a special character or punctuation.";
  }

  if (/\d/.test(name)) {
    return "Name cannot contain numbers or digits.";
  }

  if (!/^[a-zA-Z][a-zA-Z\s.'-]*$/.test(name.trim())) {
    return "Name can only contain alphabet letters, spaces, dots (.), and hyphens (-).";
  }

  const lettersOnly = name.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length < 2) {
    return "Name must contain at least 2 alphabet letters (e.g., Ali, Dr. Khan).";
  }

  if (name.trim().length > 70) {
    return "Name cannot exceed 70 characters.";
  }

  return null;
}

/**
 * Validates Pakistani phone numbers:
 * - Cannot start with spaces, letters, or invalid symbols.
 * - Standard 11-digit mobile: 03XX-XXXXXXX or 03XXXXXXXXX (starts with 03).
 * - Standard international: +923XXXXXXXXX or 923XXXXXXXXX.
 * - PTA mobile operator code must be between 0300 and 0359 (Jazz, Zong, Telenor, Ufone, SCOM).
 */
export function validatePakistaniPhone(phone: string): string | null {
  if (!phone || phone.length === 0) {
    return "Pakistani mobile phone number is required.";
  }

  if (/^\s/.test(phone)) {
    return "Phone number cannot start with a space.";
  }

  if (/^[a-zA-Z]/.test(phone)) {
    return "Phone number cannot start with letters. Enter digits only.";
  }

  if (/^[!@#$%^&*()_=\[\]{};':"\\|,.<>\/?`~-]/.test(phone) && !phone.startsWith("+")) {
    return "Phone cannot start with special symbols (except optional '+92').";
  }

  const clean = phone.trim();
  const digits = clean.replace(/\D/g, "");

  // Must match either 03XX... or +923XX... or 923XX...
  const is03 = /^03\d{2}[-\s]?\d{7}$/.test(clean) || (clean.startsWith("03") && digits.length === 11);
  const is92 =
    /^(\+92|0092|92)3\d{2}[-\s]?\d{7}$/.test(clean) ||
    ((clean.startsWith("+92") || clean.startsWith("92")) &&
      digits.length === 12 &&
      digits.startsWith("923"));

  if (!is03 && !is92) {
    return "Must be a valid Pakistani mobile number (e.g., 0300-1234567, 11 digits starting with 03).";
  }

  // Operator code verification
  const prefix = digits.startsWith("03") ? digits.substring(0, 4) : "0" + digits.substring(2, 5);
  const pNum = parseInt(prefix, 10);
  if (isNaN(pNum) || pNum < 300 || pNum > 359) {
    return `Invalid Pakistani mobile network code (${prefix}). Must be between 0300 and 0359 (Jazz, Zong, Telenor, Ufone, SCOM).`;
  }

  return null;
}

/**
 * Validates patient age:
 * - Cannot start with space, negative sign (-), plus sign (+), or letters.
 * - Must be an integer without decimals.
 * - Must be a realistic human age between 0 (infants) and 125 years.
 */
export function validatePatientAge(age: string | number): string | null {
  const str = String(age);
  if (!str || str.length === 0) {
    return "Patient age is required.";
  }

  if (/^\s/.test(str)) {
    return "Age cannot start with a space.";
  }

  if (/^[-+]/.test(str)) {
    return "Age must be a positive whole number without negative or plus signs.";
  }

  if (/[^0-9]/.test(str.trim())) {
    return "Age must contain numbers only (no letters, symbols, or decimals).";
  }

  const num = Number(str.trim());
  if (isNaN(num) || !Number.isInteger(num)) {
    return "Age must be a valid whole integer.";
  }

  if (num < 0 || num > 125) {
    return "Age must be between 0 (newborn) and 125 years.";
  }

  return null;
}

/**
 * Validates gender selection
 */
export function validatePatientGender(gender: string): string | null {
  if (!gender || !["Male", "Female", "Other"].includes(gender)) {
    return "Please select a valid gender (Male, Female, or Other).";
  }
  return null;
}

/**
 * Validates Pakistani CNIC (Optional):
 * - If omitted or blank, valid (optional field).
 * - If provided, must be 13 digits (format: 35201-1234567-1 or 3520112345671).
 */
export function validatePakistaniCnic(cnic?: string | null): string | null {
  if (!cnic || cnic.trim() === "") {
    return null; // Optional
  }
  const clean = cnic.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.length !== 13) {
    return "CNIC must be 13 digits (e.g. 35201-1234567-1).";
  }
  return null;
}

/**
 * Full composite validation function for patient registration
 */
export function validateAllPatientFields(inputs: PatientFormInputs): PatientValidationErrors {
  const errors: PatientValidationErrors = {};

  const nameErr = validatePatientName(inputs.name);
  if (nameErr) errors.name = nameErr;

  const phoneErr = validatePakistaniPhone(inputs.phone);
  if (phoneErr) errors.phone = phoneErr;

  const ageErr = validatePatientAge(inputs.age);
  if (ageErr) errors.age = ageErr;

  const genderErr = validatePatientGender(inputs.gender);
  if (genderErr) errors.gender = genderErr;

  if (inputs.cnic) {
    const cnicErr = validatePakistaniCnic(inputs.cnic);
    if (cnicErr) errors.cnic = cnicErr;
  }

  return errors;
}

