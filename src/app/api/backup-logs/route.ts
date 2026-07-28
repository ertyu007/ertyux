import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logSecurityEvent } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const expectedSecret = process.env.BACKUP_SECRET;

  if (!expectedSecret || token !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse days parameter (default 7)
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "7", 10), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Fetch logs
    const { data: logs, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filename = `backup_${new Date().toISOString().split("T")[0]}.json`;
    const jsonData = JSON.stringify(logs || [], null, 2);

    // Try uploading to Supabase Storage
    let storageUrl: string | null = null;
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("audit-backups")
        .upload(filename, jsonData, {
          contentType: "application/json",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        storageUrl = uploadData.path;
      }
    } catch {
      // Storage bucket may not exist; continue without it
    }

    // Log backup event
    await logSecurityEvent({
      eventType: "DATA_MUTATION",
      severity: "INFO",
      path: "/api/backup-logs",
      method: "GET",
      details: {
        action: "audit_log_backup",
        days,
        logCount: logs?.length || 0,
        storagePath: storageUrl || "direct_download",
      },
    });

    return NextResponse.json({
      success: true,
      count: logs?.length || 0,
      days,
      storagePath: storageUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup failed" },
      { status: 500 }
    );
  }
}
