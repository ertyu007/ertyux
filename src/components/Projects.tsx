"use client";

import { AlertCircle, FolderOpen, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";
import ProjectCard from "./ProjectCard";
import ProjectViewer from "./ProjectViewer";

export type ProjectRecord = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: unknown;
  demo_link?: string | null;
  github_link?: string | null;
  likes_count?: number | null;
  tags?: unknown;
  created_at?: string | null;
};

export type ProjectViewModel = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  demo_link?: string;
  github_link?: string;
  likes_count: number;
  tags?: string[];
};

function parseImageUrls(value: unknown): string[] {
  let source: unknown[] = [];

  if (Array.isArray(value)) {
    source = value;
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      source = Array.isArray(parsed) ? parsed : [value];
    } catch {
      source = [value];
    }
  }

  return [...new Set(
    source
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  )].slice(0, 5);
}

function parseTags(value: unknown): string[] | undefined {
  let source: unknown[] = [];

  if (Array.isArray(value)) {
    source = value;
  } else if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      source = Array.isArray(parsed) ? parsed : value.split(",");
    } catch {
      source = value.split(",");
    }
  }

  const tags = [...new Set(
    source
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  )].slice(0, 8);

  return tags.length > 0 ? tags : undefined;
}

function mapProject(record: ProjectRecord): ProjectViewModel {
  return {
    id: String(record.id),
    title: record.title?.trim() || "Untitled project",
    description: record.description?.trim() || "No description available.",
    image_urls: parseImageUrls(record.image_url),
    demo_link: record.demo_link?.trim() || undefined,
    github_link: record.github_link?.trim() || undefined,
    likes_count: Math.max(0, Number(record.likes_count) || 0),
    tags: parseTags(record.tags),
  };
}

function ProjectSkeleton() {
  return (
    <article className="pgx-skeleton" aria-hidden="true">
      <div className="pgx-skeleton__image" />
      <div className="pgx-skeleton__content">
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

export default function Projects() {
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const requestIdRef = useRef(0);

  const loadProjects = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (requestId !== requestIdRef.current) return;

      setRecords((data || []) as ProjectRecord[]);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error("Failed to load projects:", error);
      setRecords([]);
      setErrorMessage("โหลดโปรเจกต์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
    };
  }, [loadProjects]);

  const projects = useMemo(() => records.map(mapProject), [records]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) || null,
    [projects, selectedId]
  );

  useEffect(() => {
    if (loading || selectedId || projects.length === 0) return;

    const match = window.location.hash.match(/^#project-(.+)$/);
    if (!match) return;

    const id = decodeURIComponent(match[1]);
    if (projects.some((project) => project.id === id)) {
      queueMicrotask(() => setSelectedId(id));
    }
  }, [loading, projects, selectedId]);

  const openProject = useCallback((id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `#project-${encodeURIComponent(id)}`);
  }, []);

  const closeProject = useCallback(() => {
    setSelectedId(null);

    if (window.location.hash.startsWith("#project-")) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, []);

  const updateLikeCount = useCallback((id: string, count: number) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, likes_count: count } : record
      )
    );
  }, []);

  return (
    <section id="projects" className="section pgx-projects">
      <div className="container">
        <header className="pgx-projects__header">
          <div>
            <div className="section-tag">Portfolio</div>
            <h2>
              Featured <span className="text-gradient">Work</span>
            </h2>
          </div>

          <p>
            เลือกโปรเจกต์เพื่อดูรายละเอียด รูปภาพ เดโม และซอร์สโค้ด
          </p>
        </header>

        {errorMessage && (
          <div className="pgx-notice" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{errorMessage}</span>
            <button type="button" onClick={() => void loadProjects()}>
              <RefreshCw size={15} aria-hidden="true" />
              ลองใหม่
            </button>
          </div>
        )}

        {loading ? (
          <div className="pgx-grid" aria-label="กำลังโหลดโปรเจกต์">
            {[0, 1, 2].map((item) => (
              <ProjectSkeleton key={item} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="pgx-empty">
            <FolderOpen size={34} aria-hidden="true" />
            <h3>ยังไม่มีโปรเจกต์</h3>
            <p>โปรเจกต์ที่เผยแพร่แล้วจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="pgx-grid">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onSelect={openProject}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectViewer
          key={selectedProject.id}
          project={selectedProject}
          onClose={closeProject}
          onLike={updateLikeCount}
        />
      )}
    </section>
  );
}
