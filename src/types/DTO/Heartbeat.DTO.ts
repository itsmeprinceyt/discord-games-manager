export interface HeartbeatResponseDTO {
  /**
   * Indicates whether the heartbeat operation succeeded.
   * - `true`: MySQL and Redis connections are active.
   * - `false`: One or more connection checks failed.
   */
  success: boolean;

  /**
   * A human-readable message describing the status of the heartbeat check.
   */
  message: string;

  /**
   * ISO 8601 timestamp marking when the response was generated.
   * Present only on successful responses.
   */
  timestamp?: string;

  /**
   * Optional error message, included only if `success` is false.
   */
  error?: string;
}
