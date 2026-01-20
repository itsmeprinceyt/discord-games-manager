/**
 * Returns the current UTC date-time in ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 *
 * @returns {string} The current date-time in UTC ISO format.
 */
export function getCurrentDateTime(): string {
  return new Date().toISOString();
}
