/**
 * Formats a timestamp string into a localized time string (HH:MM format).
 * If the input is null or invalid, returns a fallback value.
 *
 * @param {string | null} timestamp - The timestamp string to format (e.g., ISO 8601 string)
 * @returns {string} - Formatted time string (e.g., "14:30") or "--" if invalid
 *
 * @example
 * formatTime("2024-01-24T14:30:00Z"); // Returns: "14:30"
 * formatTime(null); // Returns: "--"
 * formatTime("invalid-date"); // Returns: "invalid-date"
 */
const formatTime = (timestamp: string | null) => {
  if (!timestamp) return "--";

  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

/**
 * Formats a date string into a human-readable relative time string.
 * Returns time difference in minutes, hours, or days based on the elapsed time.
 *
 * @param {string} dateString - The date string to format (e.g., ISO 8601 string)
 * @returns {string} - Relative time string (e.g., "5m ago", "3h ago", "2d ago")
 *                    Returns the original string if parsing fails
 *
 * @example
 * formatDate("2024-01-24T14:25:00Z"); // If current time is 14:30: Returns "5m ago"
 * formatDate("2024-01-24T11:30:00Z"); // If current time is 14:30: Returns "3h ago"
 * formatDate("2024-01-22T14:30:00Z"); // If current time is 2024-01-24: Returns "2d ago"
 * formatDate("invalid-date"); // Returns: "invalid-date"
 */
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  } catch {
    return dateString;
  }
};

/**
 * Formats a timestamp string into a full date and time string.
 * Returns date and time in format: "DD Mon, YYYY | HH:MM"
 *
 * @param {string | null} timestamp - The timestamp string to format (e.g., ISO 8601 string)
 * @returns {string} - Formatted date and time string (e.g., "24 Jan, 2026 | 21:12")
 *                    Returns "--" if timestamp is null or invalid
 *
 * @example
 * formatDateTime("2026-01-24T21:12:00Z"); // Returns: "24 Jan, 2026 | 21:12"
 * formatDateTime("2024-12-31T23:59:59Z"); // Returns: "31 Dec, 2024 | 23:59"
 * formatDateTime(null); // Returns: "--"
 * formatDateTime("invalid-date"); // Returns: "--"
 */
const formatDateTime = (timestamp: string | null): string => {
  if (!timestamp) return "--";

  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "--";
    }

    // Format date part: "24 Jan, 2026"
    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', ''); // Removes the comma after year

    // Format time part: "21:12"
    const timeStr = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    });

    return `${dateStr} • ${timeStr}`;
  } catch {
    return "--";
  }
};

export { formatTime, formatDate, formatDateTime };
