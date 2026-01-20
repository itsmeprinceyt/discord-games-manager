import { v4 as uuidv4 } from "uuid";
import GenerateHexIdOptions from "../../types/generateHexID.type";

/**
 * @description Generates a random hexadecimal ID based on UUID v4 with extensive customization options.
 * This function provides flexible ID generation for various use cases including invite codes,
 * database IDs, tokens, and unique identifiers.
 *
 * @overloads
 * - generateHexId(length: number): string
 * - generateHexId(options: GenerateHexIdOptions): string
 *
 * @param {number} [length] - Desired length of the ID. If not provided, defaults to 36 (full UUID length)
 * @param {GenerateHexIdOptions} [options] - Configuration object for advanced customization
 * @param {number} [options.length] - Desired length of the ID
 * @param {boolean} [options.uppercase] - Convert output to uppercase (default: false)
 * @param {boolean} [options.includeHyphens] - Include UUID hyphens. Auto-detected based on length if undefined
 * @param {string} [options.prefix] - Prefix to prepend to the generated ID
 * @param {string} [options.suffix] - Suffix to append to the generated ID
 *
 * @returns {string} Generated hexadecimal ID
 *
 * @workflow
 * 1. Generate base UUID v4
 * 2. Apply hyphen rules (auto-detect or explicit)
 * 3. Handle length requirements (truncate or repeat)
 * 4. Apply case transformation
 * 5. Add prefix/suffix
 *
 * @autoHyphenLogic
 * - If includeHyphens is undefined (default):
 *   - length ≤ 12: Hyphens removed
 *   - length > 12: Hyphens preserved
 * - If includeHyphens is explicitly true/false: Respect the explicit setting
 *
 * @examples
 *
 * ## BASIC USAGE
 *
 * Default full UUID
 * generateHexId() // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *
 * Simple length specification
 * generateHexId(8)  // "a1b2c3d4"
 * generateHexId(12) // "a1b2c3d4e5f6"
 * generateHexId(20) // "a1b2c3d4-e5f6-7890-ab"
 *
 * ## INVITE CODES & TOKENS
 *
 * Standard invite token (36 chars, uppercase, with hyphens)
 * generateHexId({
 *   length: 36,
 *   uppercase: true
 * }) // "A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
 *
 * Compact token (16 chars, uppercase, no hyphens)
 * generateHexId({
 *   length: 16,
 *   uppercase: true,
 *   includeHyphens: false
 * }) // "A1B2C3D4E5F67890"
 *
 * Prefixed invite code
 * generateHexId({
 *   uppercase: true,
 *   prefix: "INV_"
 * }) // "INV_A1B2C3D4-E5F6-7890-ABCD-EF1234567890"
 *
 * ## DATABASE IDS
 *
 * Short ID for database primary key
 * generateHexId(12) // "a1b2c3d4e5f6"
 *
 * Full UUID for external references
 * generateHexId() // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *
 * Custom length with prefix
 * generateHexId({
 *   length: 20,
 *   prefix: "usr_"
 * }) // "usr_a1b2c3d4-e5f6-7890"
 *
 * ## API TOKENS & SECRETS
 *
 * API key format
 * generateHexId({
 *   length: 32,
 *   uppercase: true,
 *   includeHyphens: false,
 *   prefix: "sk_"
 * }) // "sk_A1B2C3D4E5F67890ABCDEF1234567890"
 *
 * Session token
 * generateHexId({
 *   length: 48,
 *   uppercase: false,
 *   includeHyphens: true
 * }) // "a1b2c3d4-e5f6-7890-abcd-ef1234567890-abcdef12-3456"
 *
 * ## FILE NAMES & SLUGS
 *
 * Unique file name
 * generateHexId({
 *   length: 16,
 *   prefix: "file_",
 *   suffix: ".jpg"
 * }) // "file_a1b2c3d4e5f67890.jpg"
 *
 * URL-safe slug
 * generateHexId({
 *   length: 12,
 *   prefix: "item-"
 * }) // "item-a1b2c3d4e5f6"
 *
 * @variations
 *
 * ## LENGTH-BASED VARIANTS
 *
 * Ultra-short (4-8 chars): Quick references, mini-codes
 * generateHexId(6)  // "a1b2c3"
 * generateHexId(8)  // "a1b2c3d4"
 *
 * Standard short (9-16 chars): Database IDs, compact tokens
 * generateHexId(12) // "a1b2c3d4e5f6"
 * generateHexId(16) // "a1b2c3d4e5f67890"
 *
 * Medium (17-32 chars): Session IDs, temporary tokens
 * generateHexId(24) // "a1b2c3d4-e5f6-7890-abcd-ef"
 * generateHexId(32) // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *
 * Full UUID (36 chars): External references, invite codes
 * generateHexId(36) // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *
 * Extended (>36 chars): Very long tokens, concatenated IDs
 * generateHexId(48) // "a1b2c3d4-e5f6-7890-abcd-ef1234567890-a1b2c3d4-e5f6"
 *
 * ## USE CASE PATTERNS
 *
 * Pattern 1: Database Entities
 * generateHexId(12) // Short, efficient primary keys
 *
 * Pattern 2: User-Facing Codes
 * generateHexId({
 *   length: 12,
 *   uppercase: true
 * }) // "A1B2C3D4E5F6" - Easy to read/type
 *
 * Pattern 3: System Tokens
 * generateHexId({
 *   length: 32,
 *   uppercase: true,
 *   includeHyphens: false
 * }) // "A1B2C3D4E5F67890ABCDEF1234567890" - Machine-readable
 *
 * Pattern 4: External References
 * generateHexId() // Full UUID for APIs and external systems
 *
 * @notes
 * - The function uses cryptographically secure UUID v4 generation
 * - When length > available characters, the ID is repeated to fill space
 * - Prefix and suffix are applied after all other transformations
 * - Total output length = prefix.length + generated.length + suffix.length
 * - For maximum uniqueness, use full 36-character UUID when possible
 */
export function generateHexId(length?: number): string;
export function generateHexId(options: GenerateHexIdOptions): string;
export function generateHexId(
  lengthOrOptions?: number | GenerateHexIdOptions
): string {
  const defaultOptions: GenerateHexIdOptions = {
    length: 36,
    uppercase: false,
    includeHyphens: undefined,
    prefix: "",
    suffix: "",
  };

  let options: GenerateHexIdOptions;
  if (typeof lengthOrOptions === "number") {
    options = { ...defaultOptions, length: lengthOrOptions };
  } else {
    options = { ...defaultOptions, ...lengthOrOptions };
  }

  const { length, uppercase, prefix, suffix } = options;
  let { includeHyphens } = options;

  let id: string = uuidv4();
  if (includeHyphens === undefined) {
    includeHyphens = (length || 36) > 12;
  }

  if (!includeHyphens) {
    id = id.replace(/-/g, "");
  }

  if (length && length > 0) {
    if (id.length < length) {
      id = id.repeat(Math.ceil(length / id.length));
    }
    id = id.slice(0, length);
  }

  if (uppercase) {
    id = id.toUpperCase();
  }

  id = prefix + id + suffix;

  return id;
}
