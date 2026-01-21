function prepareUsername(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim() // remove leading/trailing spaces
    .toLowerCase() // convert to lowercase for consistency (optional)
    .replace(/\s+/g, "_") // replace spaces with underscore
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "") // remove emojis
    .replace(/[^a-zA-Z0-9_]/g, "") // keep only alphanumeric + underscore
    .replace(/_+/g, "_") // replace multiple underscores with single underscore
    .replace(/^_+|_+$/g, ""); // remove leading/trailing underscores
}

export default prepareUsername;
