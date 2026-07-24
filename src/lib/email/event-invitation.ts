type EventInvitation = {
  firstName: string;
  eventName: string;
  gameCode: string;
  startsAt: string;
  participantUrl: string;
};

export function createEventInvitationEmail(invitation: EventInvitation) {
  const startsAt = formatUsDateTime(invitation.startsAt);
  const subject = `You're invited to ${invitation.eventName}`;
  const text = [
    `Hi ${invitation.firstName},`,
    "",
    `You have been invited to join ${invitation.eventName}.`,
    `Game code: ${invitation.gameCode}`,
    `Starts: ${startsAt}`,
    "",
    `Open Terrier Pursuit: ${invitation.participantUrl}`,
    "",
    "Enter your name, email address, and game code to join.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:auto">
      <h1 style="color:#cc0000">Terrier Pursuit</h1>
      <p>Hi ${escapeHtml(invitation.firstName)},</p>
      <p>You have been invited to join <strong>${escapeHtml(invitation.eventName)}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Game code:</strong> ${escapeHtml(invitation.gameCode)}</p>
        <p style="margin:0"><strong>Starts:</strong> ${escapeHtml(startsAt)}</p>
      </div>
      <a href="${escapeHtml(invitation.participantUrl)}" style="display:inline-block;background:#cc0000;color:white;text-decoration:none;font-weight:bold;border-radius:8px;padding:12px 18px">
        Join the game
      </a>
      <p style="font-size:13px;color:#6b7280;margin-top:20px">
        Enter your name, email address, and game code on the participant sign-in page.
      </p>
    </div>
  `.trim();

  return { subject, text, html };
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
