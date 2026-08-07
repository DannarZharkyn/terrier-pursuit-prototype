import {
  builtInPlatformTemplates,
  type PlatformTemplates,
} from "@/lib/templates/defaults";

type EventInvitation = {
  eventName: string;
  gameCode: string;
  startsAt: string;
  submissionDeadline: string;
  rules: string;
  participantUrl: string;
  templates?: Pick<
    PlatformTemplates,
    "emailSubject" | "emailBody" | "participantInstructions"
  >;
};

export function createEventInvitationEmail(invitation: EventInvitation) {
  const startsAt = formatUsDateTime(invitation.startsAt);
  const submissionDeadline = formatUsDateTime(invitation.submissionDeadline);
  const templates = invitation.templates ?? builtInPlatformTemplates;
  const values = {
    eventName: invitation.eventName,
    gameCode: invitation.gameCode,
    startsAt,
    submissionDeadline,
    participantUrl: invitation.participantUrl,
    rules: invitation.rules,
    participantInstructions: templates.participantInstructions,
  };
  const subject = renderTemplate(templates.emailSubject, values);
  const body = renderTemplate(templates.emailBody, values);

  return { subject, body };
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([a-zA-Z]+)\}\}/g, (placeholder, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : placeholder;
  });
}

export function replaceEventInvitationUrl(body: string, participantUrl: string) {
  return body.replace(/^Sign in here:.*$/m, `Sign in here: ${participantUrl}`);
}

function formatUsDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}
