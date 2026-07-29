"use server";

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { logSecurityEvent } from "@/lib/audit-logger";
import { scanForThreats } from "@/lib/sanitizer";

export type ActionResult = {
  success: boolean;
  error?: string;
  warning?: string;
};

export type UploadRequest = {
  clientId: string;
  name: string;
  size: number;
  contentType: string;
};

export type UploadTicket = {
  clientId: string;
  path: string;
  token: string;
  size: number;
  contentType: string;
  signature: string;
};

export type UploadedImageProof = Omit<UploadTicket, "token">;

export type ProjectImageState =
  | { kind: "existing"; url: string }
  | { kind: "uploaded"; upload: UploadedImageProof };

export type PrepareUploadsResult = ActionResult & {
  uploads?: UploadTicket[];
};

type LoginAttempt = {
  count: number;
  lockUntil: number;
  lastAttempt: number;
};

type VerifiedUpload = {
  path: string;
  publicUrl: string;
};

const STORAGE_BUCKET = "portfolio";
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const PROJECT_PURGE_DAYS = 30;

const loginAttempts = new Map<string, LoginAttempt>();

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeEqual(value: string, expected: string): boolean {
  try {
    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    if (valueBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(valueBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

function getExpectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  const secret = getSessionSecret();

  if (!password || password.length < 8 || !secret) return null;

  return createHmac("sha256", secret)
    .update(`portfolio-admin:v2:${password}`)
    .digest("hex");
}

async function getClientInfo(): Promise<{
  ip: string;
  userAgent: string;
  key: string;
}> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown-ip";
  const userAgent =
    requestHeaders.get("user-agent")?.slice(0, 150) || "unknown-agent";

  return { ip, userAgent, key: `${ip}:${userAgent}` };
}

async function safeLog(
  event: Parameters<typeof logSecurityEvent>[0]
): Promise<void> {
  try {
    await logSecurityEvent(event);
  } catch (error) {
    console.error("Security log failed:", error);
  }
}

function checkRateLimit(key: string): {
  allowed: boolean;
  waitSeconds?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  if (record.lockUntil > now) {
    return {
      allowed: false,
      waitSeconds: Math.ceil((record.lockUntil - now) / 1000),
    };
  }

  if (now - record.lastAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = now + LOGIN_LOCK_MS;
    loginAttempts.set(key, {
      count: record.count,
      lockUntil,
      lastAttempt: now,
    });

    return {
      allowed: false,
      waitSeconds: Math.ceil((lockUntil - now) / 1000),
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || now - current.lastAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, {
      count: 1,
      lockUntil: 0,
      lastAttempt: now,
    });
    return;
  }

  loginAttempts.set(key, {
    count: current.count + 1,
    lockUntil: current.lockUntil,
    lastAttempt: now,
  });
}

function validateOptionalUrl(value: string, label: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return `${label} must use http:// or https://.`;
    }
    return null;
  } catch {
    return `${label} is not a valid URL.`;
  }
}

function validateProjectFields(formData: FormData): {
  title: string;
  description: string;
  demoLink: string;
  githubLink: string;
  error?: string;
} {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const demoLink = readText(formData, "demo_link");
  const githubLink = readText(formData, "github_link");

  if (!title || !description) {
    return {
      title,
      description,
      demoLink,
      githubLink,
      error: "Title and description are required.",
    };
  }

  if (title.length > 120) {
    return {
      title,
      description,
      demoLink,
      githubLink,
      error: "Project title must be 120 characters or fewer.",
    };
  }

  if (description.length > 1200) {
    return {
      title,
      description,
      demoLink,
      githubLink,
      error: "Project description must be 1,200 characters or fewer.",
    };
  }

  try {
    const threat = scanForThreats({
      title,
      description,
      demoLink,
      githubLink,
    });
    if (!threat.isSafe) {
      return {
        title,
        description,
        demoLink,
        githubLink,
        error: "Input contains invalid or suspicious security patterns.",
      };
    }
  } catch (error) {
    console.error("Input scanner failed:", error);
    return {
      title,
      description,
      demoLink,
      githubLink,
      error: "Input validation is temporarily unavailable.",
    };
  }

  const demoError = validateOptionalUrl(demoLink, "Live demo URL");
  if (demoError) {
    return { title, description, demoLink, githubLink, error: demoError };
  }

  const githubError = validateOptionalUrl(githubLink, "GitHub URL");
  if (githubError) {
    return { title, description, demoLink, githubLink, error: githubError };
  }

  return { title, description, demoLink, githubLink };
}

function validateUploadRequest(file: UploadRequest): string | null {
  if (!file.clientId || file.clientId.length > 200) {
    return "An uploaded image has an invalid client ID.";
  }
  if (!file.name || file.name.length > 255) {
    return "An uploaded image has an invalid file name.";
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    return `${file.name}: invalid file size.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} exceeds the 5 MB image limit.`;
  }

  const contentType = file.contentType.toLowerCase();
  if (!MIME_EXTENSIONS[contentType]) {
    return `${file.name} is not a supported image type.`;
  }

  return null;
}

function uploadSignaturePayload(upload: UploadedImageProof): string {
  return [
    "portfolio-upload:v2",
    upload.clientId,
    upload.path,
    upload.size,
    upload.contentType.toLowerCase(),
  ].join("|");
}

function createUploadSignature(
  upload: Omit<UploadedImageProof, "signature">
): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");

  const payload: UploadedImageProof = { ...upload, signature: "" };
  return createHmac("sha256", secret)
    .update(uploadSignaturePayload(payload))
    .digest("hex");
}

function verifyUploadSignature(upload: UploadedImageProof): boolean {
  const secret = getSessionSecret();
  if (!secret || !upload.signature) return false;

  const expected = createHmac("sha256", secret)
    .update(uploadSignaturePayload(upload))
    .digest("hex");

  return safeEqual(upload.signature, expected);
}

function parseStoredImageUrls(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
        .slice(0, MAX_IMAGES);
    }
  } catch {
    // Old records may contain one URL instead of JSON.
  }

  return [value];
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex >= 0) {
    const encodedPath = publicUrl
      .slice(markerIndex + marker.length)
      .split("?")[0];

    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  return null;
}

async function removeStorageFiles(paths: string[]): Promise<string | null> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return null;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(uniquePaths);

  return error?.message || null;
}

async function removeVerifiedUploadFiles(
  uploads: UploadedImageProof[]
): Promise<string | null> {
  const safePaths = uploads
    .filter(
      (upload) =>
        upload.path.startsWith("projects/") && verifyUploadSignature(upload)
    )
    .map((upload) => upload.path);

  return removeStorageFiles(safePaths);
}

function readUploadedProof(value: unknown): UploadedImageProof | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<UploadedImageProof>;
  if (
    typeof candidate.clientId !== "string" ||
    typeof candidate.path !== "string" ||
    typeof candidate.size !== "number" ||
    typeof candidate.contentType !== "string" ||
    typeof candidate.signature !== "string"
  ) {
    return null;
  }

  return {
    clientId: candidate.clientId,
    path: candidate.path,
    size: candidate.size,
    contentType: candidate.contentType,
    signature: candidate.signature,
  };
}

function parseUploadedProofs(formData: FormData): {
  uploads: UploadedImageProof[];
  error?: string;
} {
  const value = formData.get("uploaded_images");

  try {
    const parsed: unknown = JSON.parse(
      typeof value === "string" ? value : "[]"
    );
    if (!Array.isArray(parsed)) throw new Error("Invalid list");

    const uploads: UploadedImageProof[] = [];
    for (const item of parsed) {
      const upload = readUploadedProof(item);
      if (!upload) throw new Error("Invalid item");
      uploads.push(upload);
    }

    return { uploads };
  } catch {
    return { uploads: [], error: "Invalid uploaded image data." };
  }
}

function parseImageState(formData: FormData): {
  items: ProjectImageState[];
  error?: string;
} {
  const value = formData.get("image_state");

  try {
    const parsed: unknown = JSON.parse(
      typeof value === "string" ? value : "[]"
    );
    if (!Array.isArray(parsed)) throw new Error("Invalid state");

    const items: ProjectImageState[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") throw new Error("Invalid item");
      const candidate = item as {
        kind?: unknown;
        url?: unknown;
        upload?: unknown;
      };

      if (candidate.kind === "existing" && typeof candidate.url === "string") {
        items.push({ kind: "existing", url: candidate.url });
        continue;
      }

      if (candidate.kind === "uploaded") {
        const upload = readUploadedProof(candidate.upload);
        if (upload) {
          items.push({ kind: "uploaded", upload });
          continue;
        }
      }

      throw new Error("Invalid state item");
    }

    return { items };
  } catch {
    return { items: [], error: "Invalid image order data." };
  }
}

async function verifyUploadedImage(
  upload: UploadedImageProof
): Promise<{ image?: VerifiedUpload; error?: string }> {
  if (!verifyUploadSignature(upload)) {
    return { error: "An upload ticket is invalid or has been changed." };
  }

  const requestError = validateUploadRequest({
    clientId: upload.clientId,
    name: upload.path.split("/").pop() || "image",
    size: upload.size,
    contentType: upload.contentType,
  });
  if (requestError) return { error: requestError };

  if (!/^projects\/\d{4}\/[a-f0-9-]+\.(jpg|png|webp|gif|avif)$/i.test(upload.path)) {
    return { error: "An uploaded image has an invalid storage path." };
  }

  const slashIndex = upload.path.lastIndexOf("/");
  const folder = upload.path.slice(0, slashIndex);
  const fileName = upload.path.slice(slashIndex + 1);

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .list(folder, { limit: 20, search: fileName });

  const storedFile = data?.find((item) => item.name === fileName);
  if (error || !storedFile) {
    return {
      error: `The upload did not finish correctly: ${
        error?.message || fileName
      }`,
    };
  }

  const metadata = (storedFile.metadata || {}) as Record<string, unknown>;
  const metadataSize = Number(metadata.size);
  if (Number.isFinite(metadataSize) && metadataSize > 0) {
    if (metadataSize !== upload.size) {
      return { error: "The stored file size does not match the selected file." };
    }
    if (metadataSize > MAX_IMAGE_BYTES) {
      return { error: "One of the stored images exceeds the 5 MB limit." };
    }
  }

  const metadataType = String(
    metadata.mimetype || metadata.contentType || ""
  ).toLowerCase();
  if (metadataType && !MIME_EXTENSIONS[metadataType]) {
    return { error: "One of the stored files is not a supported image." };
  }
  if (metadataType && metadataType !== upload.contentType.toLowerCase()) {
    return { error: "The stored file type does not match the selected file." };
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(upload.path);

  return {
    image: {
      path: upload.path,
      publicUrl: publicData.publicUrl,
    },
  };
}

async function verifyUploadedImages(
  uploads: UploadedImageProof[]
): Promise<{ images: VerifiedUpload[]; error?: string }> {
  const uniquePaths = new Set<string>();

  for (const upload of uploads) {
    if (uniquePaths.has(upload.path)) {
      await removeVerifiedUploadFiles(uploads);
      return { images: [], error: "Duplicate uploaded images were detected." };
    }
    uniquePaths.add(upload.path);
  }

  const results = await Promise.all(
    uploads.map(async (upload) => verifyUploadedImage(upload))
  );
  const failed = results.find((result) => !result.image || result.error);

  if (failed) {
    await removeVerifiedUploadFiles(uploads);
    return {
      images: [],
      error: failed.error || "Unable to verify an uploaded image.",
    };
  }

  return {
    images: results.map((result) => result.image as VerifiedUpload),
  };
}

export async function verifyAdminAuth(): Promise<boolean> {
  const expectedToken = getExpectedToken();
  if (!expectedToken) return false;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  return Boolean(sessionToken && safeEqual(sessionToken, expectedToken));
}

export async function loginAdmin(password: string): Promise<ActionResult> {
  const client = await getClientInfo();
  const rateLimit = checkRateLimit(client.key);

  if (!rateLimit.allowed) {
    await safeLog({
      eventType: "RATE_LIMIT_EXCEEDED",
      severity: "WARN",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: "/admin/login",
      method: "POST",
      details: { waitSeconds: rateLimit.waitSeconds },
    });

    return {
      success: false,
      error: `Too many failed attempts. Try again in ${
        rateLimit.waitSeconds || 60
      } seconds.`,
    };
  }

  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  const expectedToken = getExpectedToken();

  if (!configuredPassword || !expectedToken) {
    return {
      success: false,
      error:
        "Admin access is disabled. Set ADMIN_PASSWORD (at least 8 characters) and ADMIN_SESSION_SECRET.",
    };
  }

  const suppliedHash = createHmac("sha256", "password-comparison")
    .update(password)
    .digest("hex");
  const expectedHash = createHmac("sha256", "password-comparison")
    .update(configuredPassword)
    .digest("hex");

  if (!safeEqual(suppliedHash, expectedHash)) {
    recordFailedAttempt(client.key);
    await safeLog({
      eventType: "AUTH_LOGIN_FAILED",
      severity: "WARN",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: "/admin/login",
      method: "POST",
      details: { reason: "Invalid password" },
    });
    return { success: false, error: "Invalid admin password." };
  }

  loginAttempts.delete(client.key);

  const cookieStore = await cookies();
  cookieStore.set("admin_session", expectedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  await safeLog({
    eventType: "AUTH_LOGIN_SUCCESS",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: "/admin/login",
    method: "POST",
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<ActionResult> {
  const client = await getClientInfo();
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  await safeLog({
    eventType: "AUTH_LOGIN_SUCCESS",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: "/admin/logout",
    method: "POST",
    details: { action: "LOGOUT" },
  });

  return { success: true };
}

export async function prepareProjectUploads(
  files: UploadRequest[]
): Promise<PrepareUploadsResult> {
  if (!(await verifyAdminAuth())) {
    return { success: false, error: "Unauthorized access." };
  }

  if (!Array.isArray(files) || files.length === 0) {
    return { success: false, error: "No image files were selected." };
  }

  if (files.length > MAX_IMAGES) {
    return {
      success: false,
      error: `A project can contain up to ${MAX_IMAGES} images.`,
    };
  }

  const clientIds = new Set<string>();
  const validatedFiles: UploadRequest[] = [];

  for (const file of files) {
    const validationError = validateUploadRequest(file);
    if (validationError) return { success: false, error: validationError };

    if (clientIds.has(file.clientId)) {
      return { success: false, error: "Duplicate image IDs were detected." };
    }
    clientIds.add(file.clientId);
    validatedFiles.push(file);
  }

  try {
    const uploads = await Promise.all(
      validatedFiles.map(async (file) => {
        const contentType = file.contentType.toLowerCase();
        const extension = MIME_EXTENSIONS[contentType];
        const path = `projects/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;

        const { data, error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .createSignedUploadUrl(path, { upsert: false });

        if (error || !data?.token) {
          throw new Error(
            `Could not prepare ${file.name}: ${
              error?.message || "Missing upload token."
            }`
          );
        }

        const unsigned: Omit<UploadedImageProof, "signature"> = {
          clientId: file.clientId,
          path,
          size: file.size,
          contentType,
        };

        return {
          ...unsigned,
          token: data.token,
          signature: createUploadSignature(unsigned),
        };
      })
    );

    return { success: true, uploads };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to prepare image uploads.",
    };
  }
}

export async function discardProjectUploads(
  uploads: UploadedImageProof[]
): Promise<ActionResult> {
  if (!(await verifyAdminAuth())) {
    return { success: false, error: "Unauthorized access." };
  }

  const cleanupError = await removeVerifiedUploadFiles(uploads);
  return cleanupError
    ? { success: false, error: cleanupError }
    : { success: true };
}

export async function createProject(formData: FormData): Promise<ActionResult> {
  const client = await getClientInfo();

  if (!(await verifyAdminAuth())) {
    await safeLog({
      eventType: "UNAUTHORIZED_ACCESS",
      severity: "CRITICAL",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: "/admin/createProject",
      method: "POST",
    });
    return { success: false, error: "Unauthorized access." };
  }

  const fields = validateProjectFields(formData);
  if (fields.error) return { success: false, error: fields.error };

  const parsed = parseUploadedProofs(formData);
  if (parsed.error) return { success: false, error: parsed.error };

  if (parsed.uploads.length === 0 || parsed.uploads.length > MAX_IMAGES) {
    return {
      success: false,
      error: `Add between 1 and ${MAX_IMAGES} project images.`,
    };
  }

  const verified = await verifyUploadedImages(parsed.uploads);
  if (verified.error) return { success: false, error: verified.error };

  const imageUrls = verified.images.map((image) => image.publicUrl);
  const uploadedPaths = verified.images.map((image) => image.path);

  const { error: insertError } = await supabaseAdmin.from("projects").insert({
    title: fields.title,
    description: fields.description,
    demo_link: fields.demoLink || null,
    github_link: fields.githubLink || null,
    image_url: JSON.stringify(imageUrls),
    likes_count: 0,
  });

  if (insertError) {
    await removeStorageFiles(uploadedPaths);
    return { success: false, error: insertError.message };
  }

  await safeLog({
    eventType: "DATA_MUTATION",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: "/admin/createProject",
    method: "POST",
    details: { action: "CREATE_PROJECT", title: fields.title },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const client = await getClientInfo();

  if (!(await verifyAdminAuth())) {
    await safeLog({
      eventType: "UNAUTHORIZED_ACCESS",
      severity: "CRITICAL",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: "/admin/updateProject",
      method: "POST",
    });
    return { success: false, error: "Unauthorized access." };
  }

  if (!id) return { success: false, error: "Missing project ID." };

  const fields = validateProjectFields(formData);
  if (fields.error) return { success: false, error: fields.error };

  const parsedState = parseImageState(formData);
  if (parsedState.error) return { success: false, error: parsedState.error };

  if (parsedState.items.length === 0 || parsedState.items.length > MAX_IMAGES) {
    return {
      success: false,
      error: `Keep between 1 and ${MAX_IMAGES} project images.`,
    };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("projects")
    .select("image_url")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return {
      success: false,
      error: existingError?.message || "Project not found.",
    };
  }

  const oldImageUrls = parseStoredImageUrls(existing.image_url);
  const allowedExistingUrls = new Set(oldImageUrls);
  const uploadedProofs = parsedState.items
    .filter(
      (item): item is Extract<ProjectImageState, { kind: "uploaded" }> =>
        item.kind === "uploaded"
    )
    .map((item) => item.upload);

  for (const item of parsedState.items) {
    if (item.kind === "existing" && !allowedExistingUrls.has(item.url)) {
      await removeVerifiedUploadFiles(uploadedProofs);
      return {
        success: false,
        error: "Image state contains an unknown existing image.",
      };
    }
  }

  const verified = await verifyUploadedImages(uploadedProofs);
  if (verified.error) return { success: false, error: verified.error };

  const verifiedByPath = new Map(
    verified.images.map((image) => [image.path, image] as const)
  );

  const finalUrls: string[] = [];
  for (const item of parsedState.items) {
    if (item.kind === "existing") {
      finalUrls.push(item.url);
      continue;
    }

    const verifiedUpload = verifiedByPath.get(item.upload.path);
    if (!verifiedUpload) {
      await removeVerifiedUploadFiles(uploadedProofs);
      return { success: false, error: "An uploaded image is missing." };
    }
    finalUrls.push(verifiedUpload.publicUrl);
  }

  if (new Set(finalUrls).size !== finalUrls.length) {
    await removeVerifiedUploadFiles(uploadedProofs);
    return { success: false, error: "Duplicate images were detected." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("projects")
    .update({
      title: fields.title,
      description: fields.description,
      demo_link: fields.demoLink || null,
      github_link: fields.githubLink || null,
      image_url: JSON.stringify(finalUrls),
    })
    .eq("id", id);

  if (updateError) {
    await removeVerifiedUploadFiles(uploadedProofs);
    return { success: false, error: updateError.message };
  }

  const removedPaths = oldImageUrls
    .filter((url) => !finalUrls.includes(url))
    .map(extractStoragePath)
    .filter((path): path is string => Boolean(path));

  const cleanupError = await removeStorageFiles(removedPaths);

  await safeLog({
    eventType: "DATA_MUTATION",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: `/admin/updateProject/${id}`,
    method: "POST",
    details: {
      action: "UPDATE_PROJECT",
      projectId: id,
      title: fields.title,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return {
    success: true,
    warning: cleanupError
      ? `Project saved, but an old image could not be removed: ${cleanupError}`
      : undefined,
  };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const client = await getClientInfo();

  if (!(await verifyAdminAuth())) {
    await safeLog({
      eventType: "UNAUTHORIZED_ACCESS",
      severity: "CRITICAL",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: `/admin/deleteProject/${id}`,
      method: "POST",
    });
    return { success: false, error: "Unauthorized access." };
  }

  if (!id) return { success: false, error: "Missing project ID." };

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("projects")
    .select("id,deleted_at")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return {
      success: false,
      error: existingError?.message || "Project not found.",
    };
  }

  if (existing.deleted_at) {
    return { success: true, warning: "Project is already in the recycle bin." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { success: false, error: updateError.message };

  await safeLog({
    eventType: "DATA_MUTATION",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: `/admin/deleteProject/${id}`,
    method: "POST",
    details: { action: "SOFT_DELETE_PROJECT", projectId: id },
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return { success: true };
}

export async function restoreProject(id: string): Promise<ActionResult> {
  const client = await getClientInfo();

  if (!(await verifyAdminAuth())) {
    await safeLog({
      eventType: "UNAUTHORIZED_ACCESS",
      severity: "CRITICAL",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: `/admin/restoreProject/${id}`,
      method: "POST",
    });
    return { success: false, error: "Unauthorized access." };
  }

  if (!id) return { success: false, error: "Missing project ID." };

  const { error } = await supabaseAdmin
    .from("projects")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await safeLog({
    eventType: "DATA_MUTATION",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: `/admin/restoreProject/${id}`,
    method: "POST",
    details: { action: "RESTORE_PROJECT", projectId: id },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function purgeDeletedProject(id: string): Promise<ActionResult> {
  const client = await getClientInfo();

  if (!(await verifyAdminAuth())) {
    await safeLog({
      eventType: "UNAUTHORIZED_ACCESS",
      severity: "CRITICAL",
      ipAddress: client.ip,
      userAgent: client.userAgent,
      path: `/admin/purgeDeletedProject/${id}`,
      method: "POST",
    });
    return { success: false, error: "Unauthorized access." };
  }

  if (!id) return { success: false, error: "Missing project ID." };

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("projects")
    .select("image_url,deleted_at")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return {
      success: false,
      error: existingError?.message || "Project not found.",
    };
  }

  if (!existing.deleted_at) {
    return { success: false, error: "Only deleted projects can be purged." };
  }

  const deletedAt = new Date(existing.deleted_at).getTime();
  const purgeAt = deletedAt + PROJECT_PURGE_DAYS * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(deletedAt) || Date.now() < purgeAt) {
    return {
      success: false,
      error: `Permanent deletion is available ${PROJECT_PURGE_DAYS} days after deletion.`,
    };
  }

  const { error: deleteError } = await supabaseAdmin
    .from("projects")
    .delete()
    .eq("id", id);

  if (deleteError) return { success: false, error: deleteError.message };

  const paths = parseStoredImageUrls(existing.image_url)
    .map(extractStoragePath)
    .filter((path): path is string => Boolean(path));

  const cleanupError = await removeStorageFiles(paths);

  await safeLog({
    eventType: "DATA_MUTATION",
    severity: "INFO",
    ipAddress: client.ip,
    userAgent: client.userAgent,
    path: `/admin/purgeDeletedProject/${id}`,
    method: "POST",
    details: { action: "PURGE_PROJECT", projectId: id },
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return {
    success: true,
    warning: cleanupError
      ? `Project permanently deleted, but some stored images could not be removed: ${cleanupError}`
      : undefined,
  };
}
