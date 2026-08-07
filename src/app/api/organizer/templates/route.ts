import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { platformTemplateKey } from "@/lib/templates/defaults";

type TemplateSection = "rules" | "disclaimer" | "invitationEmail" | "participantInstructions";
type TemplateValidation =
  | { values: Record<string, string>; error?: never }
  | { error: string; values?: never };

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  if (!isRecord(body)) {
    return json({ ok: false, error: "Template update is invalid." }, 400);
  }

  const section = stringValue(body.section) as TemplateSection;
  const values = isRecord(body.values) ? body.values : {};
  const update = validateSection(section, values);

  if ("error" in update) {
    return json({ ok: false, error: update.error }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("platform_templates")
    .update(update.values)
    .eq("template_key", platformTemplateKey)
    .select("updated_at")
    .maybeSingle();

  if (result.error) {
    return json({ ok: false, error: result.error.message }, 500);
  }

  if (!result.data) {
    return json({ ok: false, error: "Default templates were not found." }, 404);
  }

  revalidatePath("/organizer/templates");
  revalidatePath("/organizer/create-event");

  return json({
    ok: true,
    section,
    updatedAt: result.data.updated_at as string,
  });
}

function validateSection(
  section: TemplateSection,
  values: Record<string, unknown>,
): TemplateValidation {
  if (section === "rules") {
    return requiredTextUpdate("rules", values.rules, "Game rules", 50_000);
  }

  if (section === "disclaimer") {
    return requiredTextUpdate("disclaimer", values.disclaimer, "Participant disclaimer", 50_000);
  }

  if (section === "participantInstructions") {
    return requiredTextUpdate(
      "participant_instructions",
      values.participantInstructions,
      "Participant instructions",
      20_000,
    );
  }

  if (section === "invitationEmail") {
    const subject = stringValue(values.emailSubject).trim();
    const emailBody = stringValue(values.emailBody).trim();

    if (!subject || subject.length > 200) {
      return { error: "Email subject must be between 1 and 200 characters." };
    }

    if (!emailBody || emailBody.length > 50_000) {
      return { error: "Email message must be between 1 and 50,000 characters." };
    }

    return { values: { email_subject: subject, email_body: emailBody } };
  }

  return { error: "Template section is not supported." };
}

function requiredTextUpdate(
  column: string,
  value: unknown,
  label: string,
  maxLength: number,
): TemplateValidation {
  const text = stringValue(value).trim();

  if (!text || text.length > maxLength) {
    return { error: `${label} must be between 1 and ${maxLength.toLocaleString()} characters.` };
  }

  return { values: { [column]: text } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}
