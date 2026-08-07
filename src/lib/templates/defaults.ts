import { defaultEventDisclaimer } from "@/lib/disclaimer/default";
import { defaultEventRules } from "@/lib/rules/default";

export type PlatformTemplates = {
  rules: string;
  disclaimer: string;
  emailSubject: string;
  emailBody: string;
  participantInstructions: string;
};

export const defaultParticipantInstructions = `1. Open the sign-in link.
2. Enter your first name, last name, and email address. The event link will fill in the game code automatically.
3. Create a team, join an existing team, or wait for the organizer to assign you.
4. Destination clues will become visible when the game starts.`;

export const defaultInvitationEmailSubject = `You're invited to play {{eventName}}`;

export const defaultInvitationEmailBody = `Dear Participant,

Welcome to the Terrier Pursuit game!

Game: {{eventName}}
Game starts: {{startsAt}}
Submission deadline: {{submissionDeadline}}
Game code: {{gameCode}}

Sign in here: {{participantUrl}}

Instructions:
{{participantInstructions}}

Game rules:
{{rules}}

Good luck and have fun!
Terrier Pursuit`;

export const builtInPlatformTemplates: PlatformTemplates = {
  rules: defaultEventRules,
  disclaimer: defaultEventDisclaimer,
  emailSubject: defaultInvitationEmailSubject,
  emailBody: defaultInvitationEmailBody,
  participantInstructions: defaultParticipantInstructions,
};

export const platformTemplateKey = "event_defaults";
