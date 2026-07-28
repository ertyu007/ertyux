import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminAuth } from "../actions";
import AdminWrapper from "../AdminWrapper";
import LogsClient from "./LogsClient";
import LoginForm from "../LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security Logs | Portfolio",
  robots: { index: false, follow: false },
};

export type AuditLog = {
  id: string;
  event_type: string;
  severity: string;
  ip_address: string;
  user_agent: string;
  path: string;
  method: string;
  details: Record<string, unknown>;
  created_at: string;
};

export default async function LogsPage() {
  const isAdmin = await verifyAdminAuth();

  if (!isAdmin) {
    return <LoginForm />;
  }

  const { data: logs, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[LOGS_PAGE_ERROR] Failed to fetch audit logs:", error.message);
  }

  return (
    <AdminWrapper>
      <LogsClient initialLogs={(logs as AuditLog[] | null) || []} />
    </AdminWrapper>
  );
}
