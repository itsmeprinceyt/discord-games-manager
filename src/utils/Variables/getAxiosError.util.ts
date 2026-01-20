import axios from "axios";

export default function getAxiosErrorMessage(
  err: unknown,
  fallback = "Unexpected error"
): string {
  if (typeof err === "string") return err;
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      fallback
    );
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
