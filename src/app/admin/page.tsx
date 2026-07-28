import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabase-admin";
import AdminClient from "./AdminClient";
import AdminWrapper from "./AdminWrapper";
import LoginForm from "./LoginForm";
import { verifyAdminAuth } from "./actions";

export const metadata: Metadata = {
  title: "Admin | Portfolio",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export type Project = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  demo_link: string | null;
  github_link: string | null;
  likes_count: number | null;
  created_at?: string | null;
};

export default async function AdminPage() {
  const isAdmin = await verifyAdminAuth();

  if (!isAdmin) {
    return <LoginForm />;
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id,title,description,image_url,demo_link,github_link,likes_count,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load admin projects:", error.message);
  }

  const projects = Array.isArray(data) ? (data as Project[]) : [];

  return (
    <AdminWrapper>
      <AdminClient
        key={projects.map((project) => project.id).join(":")}
        initialProjects={projects}
      />
    </AdminWrapper>
  );
}
