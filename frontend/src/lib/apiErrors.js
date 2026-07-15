export const SERVER_WAKE_UP_MESSAGE =
  "Server is waking up, please try again in 30 seconds.";

export function isServerWakeUpError(message) {
  return message === SERVER_WAKE_UP_MESSAGE;
}

export function toApiError(err) {
  if (err instanceof TypeError) return SERVER_WAKE_UP_MESSAGE;
  if (err?.message === "Failed to fetch") return SERVER_WAKE_UP_MESSAGE;
  return err?.message || SERVER_WAKE_UP_MESSAGE;
}
