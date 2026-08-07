import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  builtInPlatformTemplates,
  platformTemplateKey,
  type PlatformTemplates,
} from "./defaults";

type PlatformTemplateRow = {
  rules: string;
  disclaimer: string;
  email_subject: string;
  email_body: string;
  participant_instructions: string;
};

export async function getPlatformTemplates(): Promise<PlatformTemplates> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("platform_templates")
    .select("rules, disclaimer, email_subject, email_body, participant_instructions")
    .eq("template_key", platformTemplateKey)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Could not load default templates: ${result.error.message}`);
  }

  if (result.data) {
    return fromRow(result.data as PlatformTemplateRow);
  }

  const insert = await supabase
    .from("platform_templates")
    .insert({
      template_key: platformTemplateKey,
      rules: builtInPlatformTemplates.rules,
      disclaimer: builtInPlatformTemplates.disclaimer,
      email_subject: builtInPlatformTemplates.emailSubject,
      email_body: builtInPlatformTemplates.emailBody,
      participant_instructions: builtInPlatformTemplates.participantInstructions,
    })
    .select("rules, disclaimer, email_subject, email_body, participant_instructions")
    .single();

  if (insert.error || !insert.data) {
    throw new Error(
      `Could not initialize default templates: ${insert.error?.message ?? "Unknown database error."}`,
    );
  }

  return fromRow(insert.data as PlatformTemplateRow);
}

function fromRow(row: PlatformTemplateRow): PlatformTemplates {
  return {
    rules: row.rules,
    disclaimer: row.disclaimer,
    emailSubject: row.email_subject,
    emailBody: row.email_body,
    participantInstructions: row.participant_instructions,
  };
}
