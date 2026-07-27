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
    .select("id, status, submitted_at")
    .eq("team_id", teamId)
    .maybeSingle();

  if (submission.error) {
    return json({ ok: false, error: submission.error.message }, 500);
  }

  const locations = await supabase
    .from("event_locations")
    .select("id, position, clue")
    .eq("event_id", context.eventId)
    .order("position", { ascending: true });

  if (locations.error) {
    return json({ ok: false, error: locations.error.message }, 500);
  }

  const photos = submission.data
    ? await supabase
        .from("team_submission_photos")
        .select(
          "id, event_location_id, storage_path, original_name, created_at, uploaded_by_participant_id, participants(first_name, last_name)",
        )
        .eq("submission_id", submission.data.id)
    : { data: [], error: null };

  if (photos.error) {
    return json({ ok: false, error: photos.error.message }, 500);
  }

  const photoRows = photos.data ?? [];
  const signedPhotos = await Promise.all(
    photoRows.map(async (photo) => {
      const signed = await supabase.storage
        .from(bucketName)
        .createSignedUrl(photo.storage_path as string, 3600);
      const uploader = Array.isArray(photo.participants)
        ? photo.participants[0]
        : photo.participants;

      return {
        id: photo.id,
        locationId: photo.event_location_id,
        originalName: photo.original_name,
        signedUrl: signed.data?.signedUrl ?? "",
        uploadedAt: photo.created_at,
        uploadedBy: uploader
          ? `${uploader.first_name} ${uploader.last_name}`
          : "Former team member",
      };
    }),
  );

  return json({
    ok: true,
    submitted: submission.data?.status !== "draft" && Boolean(submission.data),
    submissionId: submission.data?.id,
    submittedAt: submission.data?.submitted_at,
    locations: (locations.data ?? []).map((location) => ({
      id: location.id,
      position: location.position,
      clue: location.clue,
      photo:
        signedPhotos.find((photo) => photo.locationId === location.id) ?? null,
    })),
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
    .select("id, status")
    .eq("team_id", teamId)
    .maybeSingle();

  if (existing.error) {
    return json({ ok: false, error: existing.error.message }, 500);
  }

  if (existing.data && existing.data.status !== "draft") {
    return json({ ok: false, error: "This team has already submitted its pictures." }, 409);
  }

  if (action === "prepare") {
    const files = readFiles(body.files);
    const locationId = stringValue(body.locationId);
    const fileError = validateFiles(files);

    if (fileError || files.length !== 1 || !uuidPattern.test(locationId)) {
      return json(
        { ok: false, error: fileError || "Choose one valid clue for this picture." },
        400,
      );
    }

    const location = await supabase
      .from("event_locations")
      .select("id")
      .eq("id", locationId)
      .eq("event_id", context.eventId)
      .maybeSingle();

    if (location.error || !location.data) {
      return json({ ok: false, error: "That clue does not belong to this event." }, 400);
    }

    const bucket = await ensureSubmissionBucket(supabase);

    if (bucket) {
      return json({ ok: false, error: bucket }, 500);
    }

    const file = files[0];
    const extension = safeExtension(file.name, file.type);
    const path = `${context.eventId}/${teamId}/${locationId}/${crypto.randomUUID()}.${extension}`;
    const signed = await supabase.storage.from(bucketName).createSignedUploadUrl(path);

    if (signed.error) {
      return json({ ok: false, error: signed.error.message }, 500);
    }

    return json({ ok: true, uploads: [{ path, token: signed.data.token }] });
  }

  if (action === "save") {
    const files = readUploadedFiles(body.files);
    const locationId = stringValue(body.locationId);
    const fileError = validateFiles(files);

    if (
      fileError ||
      files.length !== 1 ||
      !uuidPattern.test(locationId) ||
      !files[0].path.startsWith(`${context.eventId}/${teamId}/${locationId}/`)
    ) {
      return json({ ok: false, error: fileError || "An uploaded file path is invalid." }, 400);
    }

    const location = await supabase
      .from("event_locations")
      .select("position")
      .eq("id", locationId)
      .eq("event_id", context.eventId)
      .maybeSingle();

    if (location.error || !location.data) {
      await supabase.storage.from(bucketName).remove([files[0].path]);
      return json({ ok: false, error: "That clue does not belong to this event." }, 400);
    }

    let submissionId = existing.data?.id as string | undefined;

    if (!submissionId) {
      const created = await supabase
        .from("team_hunt_submissions")
        .insert({
          event_id: context.eventId,
          team_id: teamId,
          submitted_by_participant_id: participantId,
          status: "draft",
          submitted_at: null,
        })
        .select("id")
        .single();

      if (created.error || !created.data) {
        if (created.error?.code === "23505") {
          const concurrentDraft = await supabase
            .from("team_hunt_submissions")
            .select("id, status")
            .eq("team_id", teamId)
            .maybeSingle();

          if (concurrentDraft.data?.status === "draft") {
            submissionId = concurrentDraft.data.id as string;
          } else {
            await supabase.storage.from(bucketName).remove([files[0].path]);
            return json(
              { ok: false, error: "The team entry was submitted while this photo was uploading." },
              409,
            );
          }
        } else {
          await supabase.storage.from(bucketName).remove([files[0].path]);
          return json(
            { ok: false, error: created.error?.message || "Could not save this photo." },
            500,
          );
        }
      } else {
        submissionId = created.data.id as string;
      }
    }

    const priorPhoto = await supabase
      .from("team_submission_photos")
      .select("id, storage_path")
      .eq("submission_id", submissionId)
      .eq("event_location_id", locationId)
      .maybeSingle();

    if (priorPhoto.error) {
      await supabase.storage.from(bucketName).remove([files[0].path]);
      return json({ ok: false, error: priorPhoto.error.message }, 500);
    }

    const file = files[0];
    const photoValues = {
        submission_id: submissionId,
        uploaded_by_participant_id: participantId,
        event_location_id: locationId,
        storage_path: file.path,
        original_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        position: location.data.position,
        created_at: new Date().toISOString(),
      };
    const saved = priorPhoto.data
      ? await supabase
          .from("team_submission_photos")
          .update(photoValues)
          .eq("id", priorPhoto.data.id)
      : await supabase.from("team_submission_photos").insert(photoValues);

    if (saved.error) {
      await supabase.storage.from(bucketName).remove([file.path]);
      return json({ ok: false, error: saved.error.message }, 500);
    }

    if (priorPhoto.data?.storage_path) {
      await supabase.storage.from(bucketName).remove([priorPhoto.data.storage_path]);
    }

    return json({ ok: true, submissionId });
  }

  if (action === "finalize") {
    if (!existing.data) {
      return json({ ok: false, error: "Save a photo for each clue before submitting." }, 409);
    }

    const locationCount = await supabase
      .from("event_locations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", context.eventId);
    const photoCount = await supabase
      .from("team_submission_photos")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", existing.data.id)
      .not("event_location_id", "is", null);

    if (locationCount.error || photoCount.error) {
      return json({ ok: false, error: locationCount.error?.message || photoCount.error?.message }, 500);
    }

    if (!locationCount.count || photoCount.count !== locationCount.count) {
      return json({ ok: false, error: "Save one photo for every clue before submitting." }, 409);
    }

    const finalized = await supabase
      .from("team_hunt_submissions")
      .update({
        status: "submitted",
        submitted_by_participant_id: participantId,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.data.id)
      .eq("status", "draft");

    if (finalized.error) {
      return json({ ok: false, error: finalized.error.message }, 500);
    }

    return json({ ok: true, submissionId: existing.data.id, photoCount: photoCount.count });
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
