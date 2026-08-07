export const APPROVED_ORGANIZER_EMAIL = "studentwellbeing@bu.edu";

export function isApprovedOrganizerEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === APPROVED_ORGANIZER_EMAIL;
}
