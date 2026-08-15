export const APPROVED_ORGANIZER_EMAILS = [
  "studentwellbeing@bu.edu",
  "anab@bu.edu",
] as const;

export function isApprovedOrganizerEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  return Boolean(
    normalizedEmail && APPROVED_ORGANIZER_EMAILS.some((approved) => approved === normalizedEmail),
  );
}
