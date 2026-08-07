export function createEventParticipantUrl(
  baseUrl: string,
  gameCode: string,
  eventId?: string,
) {
  const url = new URL("/participant/welcome", baseUrl);
  url.searchParams.set("gameCode", gameCode.trim().toUpperCase());

  if (eventId) {
    url.searchParams.set("event", eventId);
  }

  return url.toString();
}
