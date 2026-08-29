export function hasEventStarted(startsAt: string | null | undefined, now = Date.now()) {
  if (!startsAt) return false;
  const startTime = new Date(startsAt).getTime();
  return Number.isFinite(startTime) && startTime <= now;
}
