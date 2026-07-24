import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bucketName = "game-submissions";
const maxFileSize = 10 * 1024 * 1024;
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UploadFile = {
  name: string;
  type: string;
  size: number;
};

type UploadedFile = UploadFile & {
  path: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId")?.trim() ?? "";
  const participantId = url.searchParams.get("participantId")?.trim() ?? "";

  if (!uuidPattern.test(teamId) || !uuidPattern.test(participantId)) {
    return json({ ok: false, error: "Team or participant ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const context = await getSubmissionContext(supabase, teamId, participantId);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  const submission = await supabase
    .from("team_hunt_submissions")
    .select("id, submitted_at, team_submission_photos(count)")
    .eq("team_id", teamId)
    .maybeSingle();

  if (submission.error) {
    return json({ ok: false, error: submission.error.message }, 500);
  }

  const photoCounts = submission.data?.team_submission_photos as unknown as
    | { count: number }[]
    | undefined;

  return json({
    ok: true,
    submitted: Boolean(submission.data),
    submissionId: submission.data?.id,
    submittedAt: submission.data?.submitted_at,
    photoCount: photoCounts?.[0]?.count ?? 0,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Request body must be valid JSON." }, 400);
  }

  if (!isRecord(body)) {
    return json({ ok: false, error: "Please check the submission request." }, 400);
  }

  const action = stringValue(body.action);
  const teamId = stringValue(body.teamId);
  const participantId = stringValue(body.participantId);

  if (!uuidPattern.test(teamId) || !uuidPattern.test(participantId)) {
    return json({ ok: false, error: "Team or participant ID is invalid." }, 400);
  }

  const supabase = createSupabaseAdminClient();
  const context = await getSubmissionContext(supabase, teamId, participantId);

  if (!context.ok) {
    return json({ ok: false, error: context.error }, context.status);
  }

  if (new Date(context.deadline).getTime() <= Date.now()) {
    return json({ ok: false, error: "The submission deadline has ended." }, 409);
  }

  const existing = await supabase
    .from("team_hunt_submissions")
    .select("id")
    .eq("team_id", teamId)
    .maybeSingle();

  if (existing.error) {
    return json({ ok: false, error: existing.error.message }, 500);
  }

  if (existing.data) {
    return json({ ok: false, error: "This team has already submitted its pictures." }, 409);
  }

  if (action === "prepare") {
    const files = readFiles(body.files);
    const fileError = validateFiles(files);

    if (fileError) {
      return json({ ok: false, error: fileError }, 400);
    }

    const bucket = await ensureSubmissionBucket(supabase);

    if (bucket) {
      return json({ ok: false, error: bucket }, 500);
    }

    const uploads = await Promise.all(files.map(async (file) => {
      const extension = safeExtension(file.name, file.type);
      const path = `${context.eventId}/${teamId}/${crypto.randomUUID()}.${extension}`;
      const signed = await supabase.storage.from(bucketName).createSignedUploadUrl(path);

      if (signed.error) {
        throw new Error(signed.error.message);
      }

      return { path, token: signed.data.token };
    }));

    return json({ ok: true, uploads });
  }

  if (action === "finalize") {
    const files = readUploadedFiles(body.files);
    const fileError = validateFiles(files);

    if (fileError || files.some((file) => !file.path.startsWith(`${context.eventId}/${teamId}/`))) {
      return json({ ok: false, error: fileError || "An uploaded file path is invalid." }, 400);
    }

    const submission = await supabase
      .from("team_hunt_submissions")
      .insert({
        event_id: context.eventId,
        team_id: teamId,
        submitted_by_participant_id: participantId,
        status: "submitted",
      })
      .select("id")
      .single();

    if (submission.error || !submission.data) {
      await supabase.storage.from(bucketName).remove(files.map((file) => file.path));
      return json({ ok: false, error: submission.error?.message || "Could not create submission." }, 500);
    }

    const photos = await supabase.from("team_submission_photos").insert(
      files.map((file, index) => ({
        submission_id: submission.data.id,
        uploaded_by_participant_id: participantId,
        storage_path: file.path,
        original_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        position: index + 1,
      })),
    );

    if (photos.error) {
      await supabase.from("team_hunt_submissions").delete().eq("id", submission.data.id);
      await supabase.storage.from(bucketName).remove(files.map((file) => file.path));
      return json({ ok: false, error: photos.error.message }, 500);
    }

    return json({ ok: true, submissionId: submission.data.id, photoCount: files.length });
  }

  return json({ ok: false, error: "Submission action is invalid." }, 400);
}

async function getSubmissionContext(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  teamId: string,
  participantId: string,
) {
  const membership = await supabase
    .from("team_memberships")
    .select("teams!inner(event_id, events!inner(submission_deadline))")
    .eq("team_id", teamId)
    .eq("participant_id", participantId)
    .maybeSingle();

  if (membership.error || !membership.data) {
    return { ok: false as const, error: "You are not a current member of this team.", status: 403 };
  }

  const teams = membership.data.teams as unknown as {
    event_id: string;
    events: { submission_deadline: string };
  };

  return {
    ok: true as const,
    eventId: teams.event_id,
    deadline: teams.events.submission_deadline,
  };
}

async function ensureSubmissionBucket(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const existing = await supabase.storage.getBucket(bucketName);

  if (!existing.error) {
    return undefined;
  }

  const created = await supabase.storage.createBucket(bucketName, {
    public: false,
    allowedMimeTypes,
    fileSizeLimit: maxFileSize,
  });

  return created.error?.message;
}

function readFiles(value: unknown): UploadFile[] {
  return Array.isArray(value)
    ? value.map((file) => isRecord(file) ? {
      name: stringValue(file.name),
      type: stringValue(file.type),
      size: Number(file.size),
    } : { name: "", type: "", size: 0 })
    : [];
}

function readUploadedFiles(value: unknown): UploadedFile[] {
  return Array.isArray(value)
    ? value.map((file) => isRecord(file) ? {
      name: stringValue(file.name),
      type: stringValue(file.type),
      size: Number(file.size),
      path: stringValue(file.path),
    } : { name: "", type: "", size: 0, path: "" })
    : [];
}

function validateFiles(files: UploadFile[]) {
  if (files.length === 0) return "Select at least one picture.";
  if (files.length > 100) return "Select no more than 100 pictures at once.";
  if (files.some((file) => !file.name || !allowedMimeTypes.includes(file.type))) {
    return "Only JPEG, PNG, WebP, HEIC, and HEIF pictures are supported.";
  }
  if (files.some((file) => !Number.isFinite(file.size) || file.size <= 0 || file.size > maxFileSize)) {
    return "Each picture must be 10 MB or smaller.";
  }
  return undefined;
}

function safeExtension(name: string, type: string) {
  const extension = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (extension && extension.length <= 5) return extension;
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function json(response: Record<string, unknown>, status = 200) {
  return NextResponse.json(response, { status });
}
