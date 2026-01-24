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

export { formatTime };
