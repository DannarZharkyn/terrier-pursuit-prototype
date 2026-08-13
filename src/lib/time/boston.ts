export const BOSTON_TIME_ZONE = "America/New_York";

type BostonDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BOSTON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function parseBostonDateTime(dateText: string, timeText: string) {
  const dateMatch = dateText.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeText.trim().match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) return "";

  const desired: BostonDateTimeParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };

  if (!isValidWallTime(desired)) return "";

  const desiredAsUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let instant = desiredAsUtc;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    instant = desiredAsUtc - getBostonOffsetMilliseconds(new Date(instant));
  }

  const result = new Date(instant);
  const actual = getBostonDateTimeParts(result);

  return sameWallTime(actual, desired) ? result.toISOString() : "";
}

export function getBostonInputValues(value: string | Date) {
  const parts = getBostonDateTimeParts(new Date(value));
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(Math.floor(parts.minute / 5) * 5)}`,
  };
}

export function formatBostonDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOSTON_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatBostonDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOSTON_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(value));
}

function getBostonOffsetMilliseconds(date: Date) {
  const parts = partsRecord(date);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const instantWithoutMilliseconds = Math.floor(date.getTime() / 1000) * 1000;
  return representedAsUtc - instantWithoutMilliseconds;
}

function getBostonDateTimeParts(date: Date): BostonDateTimeParts {
  const parts = partsRecord(date);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function partsRecord(date: Date) {
  return Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

function isValidWallTime(parts: BostonDateTimeParts) {
  if (
    parts.month < 1 || parts.month > 12 ||
    parts.day < 1 || parts.day > 31 ||
    parts.hour < 0 || parts.hour > 23 ||
    parts.minute < 0 || parts.minute > 59 ||
    parts.minute % 5 !== 0
  ) return false;

  const normalized = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return normalized.getUTCFullYear() === parts.year
    && normalized.getUTCMonth() === parts.month - 1
    && normalized.getUTCDate() === parts.day;
}

function sameWallTime(left: BostonDateTimeParts, right: BostonDateTimeParts) {
  return left.year === right.year
    && left.month === right.month
    && left.day === right.day
    && left.hour === right.hour
    && left.minute === right.minute;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
