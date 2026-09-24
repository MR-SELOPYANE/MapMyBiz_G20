/**
 * @file Input validators.
 * @description Pure validation utilities focused on South African
 * formats (email, +27 phone numbers, SA ID, CIPC numbers) with a
 * generic required-fields helper and an input sanitizer.
 */

/**
 * Validates an email address.
 *
 * @param {string} email - The email to validate.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { valid: false, message: "Email is required." };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    return { valid: false, message: "Please enter a valid email address." };
  }
  return { valid: true, message: "" };
}

/**
 * Validates a South African phone number.
 * Accepts formats like `+27 61 855 7707`, `+27618557707`, or `061 855 7707`.
 * Normalises to the E.164 `+27XXXXXXXXX` form.
 *
 * @param {string} phone - The phone number to validate.
 * @returns {{ valid: boolean, message: string, formatted?: string }}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return { valid: false, message: "Phone number is required." };
  }

  let raw = phone.trim();
  const digits = raw.replace(/[\s.\-()]/g, "");

  if (/^0\d{9}$/.test(digits)) {
    raw = "+27" + digits.slice(1);
  }

  const valid = /^\+27\d{9}$/.test(raw);
  if (!valid) {
    return {
      valid: false,
      message: "Enter a valid SA number starting with +27 followed by 9 digits.",
    };
  }

  return { valid: true, message: "", formatted: raw };
}

/**
 * Validates a South African ID number.
 * Must be exactly 13 digits and pass the Luhn checksum.
 *
 * @param {string} id - The SA ID number.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateSAId(id) {
  if (!id || typeof id !== "string" || !id.trim()) {
    return { valid: false, message: "South African ID is required." };
  }

  const trimmed = id.trim();
  if (!/^\d{13}$/.test(trimmed)) {
    return { valid: false, message: "SA ID must be exactly 13 digits." };
  }

  let sum = 0;
  let alternate = false;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    let num = parseInt(trimmed.charAt(i), 10);
    if (alternate) {
      num *= 2;
      if (num > 9) num -= 9;
    }
    sum += num;
    alternate = !alternate;
  }

  if (sum % 10 !== 0) {
    return { valid: false, message: "Invalid SA ID checksum." };
  }

  return { valid: true, message: "" };
}

/**
 * Validates a CIPC registration number.
 * Accepts the format `YYYY/NNNNNN/NN` (e.g. `2024/123456/07`).
 *
 * @param {string} number - The CIPC number.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCIPCNumber(number) {
  if (!number || typeof number !== "string" || !number.trim()) {
    return { valid: false, message: "CIPC registration number is required." };
  }

  const re = /^\d{4}\/\d{6}\/\d{2}$/;
  if (!re.test(number.trim())) {
    return {
      valid: false,
      message: "CIPC number must follow the format YYYY/NNNNNN/NN.",
    };
  }

  return { valid: true, message: "" };
}

/**
 * Validates that every key in the provided object has a non-empty value.
 *
 * @param {Object} fields - A map of field names to values.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateRequiredFields(fields) {
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return { valid: false, message: `${name} is required.` };
    }
  }
  return { valid: true, message: "" };
}

/**
 * Sanitises a string for safe insertion into HTML or storage by escaping
 * dangerous characters.
 *
 * @param {string} input - The raw input.
 * @returns {string} The sanitised string.
 */
export function sanitizeInput(input) {
  if (input === undefined || input === null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
}

export default {
  validateEmail,
  validatePhone,
  validateSAId,
  validateCIPCNumber,
  validateRequiredFields,
  sanitizeInput,
};