type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

type ResendSuccess = {
  id: string;
};

type ResendFailure = {
  message?: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: process.env.RESEND_REPLY_TO || undefined,
    }),
  });
  const result = (await response.json()) as ResendSuccess | ResendFailure;

  if (!response.ok || !("id" in result)) {
    throw new Error("message" in result && result.message
      ? result.message
      : `Email provider returned ${response.status}.`);
  }

  return result.id;
}
