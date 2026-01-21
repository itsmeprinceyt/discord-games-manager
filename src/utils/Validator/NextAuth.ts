/**
 * Sanitizes an unknown input into a safe string.
 * - Trims leading and trailing whitespace
 * - Ensures the value is a string
 * - Enforces a maximum length
 *
 * @param value - The input value to sanitize
 * @param maxLen - Maximum allowed string length (default: 255)
 * @returns A sanitized string or an empty string if input is invalid
 */
function sanitizeString(value: unknown, maxLen = 255): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/**
 * Validates whether a string is a properly formatted email address.
 *
 * @param email - Email string to validate
 * @returns True if the email is valid, otherwise false
 */
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Determines whether the provided identifier is an email address.
 * Acts as a semantic wrapper around email validation logic.
 *
 * @param identifier - Identifier string to check
 * @returns True if the identifier is an email, otherwise false
 */
function isEmail(identifier: string): boolean {
  return isValidEmail(identifier);
}

export { sanitizeString, isEmail, isValidEmail };
