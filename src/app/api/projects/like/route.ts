import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_UPDATE_ATTEMPTS = 5;

type LikeRequest = {
  projectId?: unknown;
};

export async function POST(request: Request) {
  let body: LikeRequest;

  try {
    body = (await request.json()) as LikeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const projectId =
    typeof body.projectId === "string" ? body.projectId.trim() : "";

  if (
    !projectId ||
    projectId.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(projectId)
  ) {
    return NextResponse.json({ error: "Invalid project ID." }, { status: 400 });
  }

  for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt += 1) {
    const { data: project, error: readError } = await supabaseAdmin
      .from("projects")
      .select("likes_count")
      .eq("id", projectId)
      .is("deleted_at", null)
      .maybeSingle();

    if (readError) {
      console.error("Could not read project like count:", readError.message);
      return NextResponse.json(
        { error: "Could not update like count." },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const currentCount = Math.max(0, Number(project.likes_count) || 0);
    const nextCount = currentCount + 1;
    let updateQuery = supabaseAdmin
      .from("projects")
      .update({ likes_count: nextCount })
      .eq("id", projectId)
      .is("deleted_at", null);

    updateQuery =
      project.likes_count === null
        ? updateQuery.is("likes_count", null)
        : updateQuery.eq("likes_count", project.likes_count);

    const { data: updated, error: updateError } = await updateQuery
      .select("likes_count")
      .maybeSingle();

    if (updateError) {
      console.error("Could not update project like count:", updateError.message);
      return NextResponse.json(
        { error: "Could not update like count." },
        { status: 500 }
      );
    }

    if (updated) {
      return NextResponse.json(
        { likesCount: Math.max(0, Number(updated.likes_count) || nextCount) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return NextResponse.json(
    { error: "Like count changed too quickly. Please try again." },
    { status: 409 }
  );
}
