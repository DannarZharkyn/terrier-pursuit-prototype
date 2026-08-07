import type { ParsedEventLocation } from "./event-locations";
import type { ParsedParticipant } from "./participants";

export type CreateEventDraft = {
  event: {
    name: string;
    startsAt: string;
    submissionDeadline: string;
    rules: string;
    disclaimer: string;
  };
  participants: ParsedParticipant[];
  locations: ParsedEventLocation[];
  templates: {
    emailSubject: string;
    emailBody: string;
    participantInstructions: string;
  };
  savedAt: string;
};

export const createEventDraftStorageKey = "terrier-pursuit:create-event-draft";

export function saveCreateEventDraft(draft: CreateEventDraft) {
  window.sessionStorage.setItem(createEventDraftStorageKey, JSON.stringify(draft));
}

export function readCreateEventDraft(): CreateEventDraft | undefined {
  const storedDraft = window.sessionStorage.getItem(createEventDraftStorageKey);

  if (!storedDraft) {
    return undefined;
  }

  try {
    return JSON.parse(storedDraft) as CreateEventDraft;
  } catch {
    return undefined;
  }
}
