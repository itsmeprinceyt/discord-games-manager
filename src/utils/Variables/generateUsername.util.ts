import { v4 as uuidv4 } from "uuid";

/**
 * Generates a clean, unique, and length-safe username.
 *
 * Example:
 *  generateUsername("Prince Kumar") → "prince_kum_3fa9c1"
 *
 * Rules:
 * - Lowercase and underscores only
 * - Always includes a 6-character unique suffix
 * - Total length ≤ 20 characters
 */
export default function generateUsername(name: string): string {
  const MAX_LENGTH = 20;
  const SUFFIX_LENGTH = 7; // includes "_" + 6 chars
  const uniqueId = `_${uuidv4().replace(/-/g, "").slice(0, 6)}`;

  // Normalize and sanitize name
  let cleanName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") // replace spaces with underscores
    .replace(/[^a-z0-9_]/g, ""); // remove invalid characters

  // Trim name to fit within total length limit
  const maxNameLength = MAX_LENGTH - SUFFIX_LENGTH;
  if (cleanName.length > maxNameLength) {
    cleanName = cleanName.slice(0, maxNameLength);
  }

  return `${cleanName}${uniqueId}`;
}
